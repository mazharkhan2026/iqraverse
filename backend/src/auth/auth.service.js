import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service.js';

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8),
  displayName: z.string().trim().min(1),
});

const loginSchema = registerSchema.pick({
  email: true,
  password: true,
});

const ACCESS_TTL = 900;
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

const userRelations = {
  profile: true,
  roles: {
    where: { revokedAt: null },
    include: { role: true },
  },
};

@Injectable()
export class AuthService {
  constructor(prisma, jwtService) {
    this.prisma = prisma;
    this.jwtService = jwtService;
  }

  async onModuleInit() {
    this.secret = process.env.JWT_ACCESS_SECRET;

    if (!this.secret || !/^[a-f0-9]{64}$/i.test(this.secret)) {
      throw new Error('JWT_ACCESS_SECRET is missing or invalid');
    }

    this.dummyPasswordHash = await argon2.hash(
      randomBytes(32),
      { type: argon2.argon2id }
    );
  }

  hashToken(token) {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  safeUser(user) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.profile.displayName,
      roles: user.roles.map((item) => item.role.name),
    };
  }

  isActiveUser(user) {
    return Boolean(
      user &&
      user.status === 'active' &&
      user.emailVerifiedAt &&
      user.profile &&
      user.roles.length
    );
  }

  invalidSession() {
    return new UnauthorizedException({
      code: 'INVALID_SESSION',
      message: 'Invalid or expired session',
    });
  }

  // REGISTER

  async register(body) {
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid registration data',
      });
    }

    const { email, password, displayName } = validation.data;

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          profile: {
            create: { displayName },
          },
          roles: {
            create: {
              role: {
                connect: { name: 'student' },
              },
            },
          },
        },
        include: userRelations,
      });

      return this.safeUser(user);

    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'ACCOUNT_CONFLICT',
          message: 'Account already exists',
        });
      }

      throw error;
    }
  }

  // VALIDATE LOGIN

  async validateCredentials(body) {
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid login data',
      });
    }

    const { email, password } = validation.data;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: userRelations,
    });

    const validPassword = await argon2.verify(
      user?.passwordHash ?? this.dummyPasswordHash,
      password
    );

    if (
      !user ||
      !validPassword ||
      user.status !== 'active' ||
      !user.profile ||
      !user.roles.length
    ) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email first',
      });
    }

    return this.safeUser(user);
  }

  // CREATE ACCESS TOKEN

  async createAccessToken(userId, familyId) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        sid: familyId,
      },
      {
        secret: this.secret,
        algorithm: 'HS256',
        expiresIn: ACCESS_TTL,
        issuer: 'iqraverse',
        audience: 'iqraverse-api',
      }
    );
  }

  // LOGIN AND CREATE SESSION

  async login(body) {
    const user = await this.validateCredentials(body);

    const refreshToken = randomBytes(32).toString('hex');

    const expiresAt = new Date(
      Date.now() + SESSION_TTL
    );

    const family =
      await this.prisma.authSessionFamily.create({
        data: {
          userId: user.id,
          expiresAt,
          sessions: {
            create: {
              tokenHash: this.hashToken(refreshToken),
              expiresAt,
            },
          },
        },
      });

    return {
      accessToken: await this.createAccessToken(
        user.id,
        family.id
      ),
      refreshToken,
      expiresIn: ACCESS_TTL,
      user,
    };
  }

  // ROTATE REFRESH TOKEN

  async refresh(refreshToken) {
    if (
      typeof refreshToken !== 'string' ||
      !/^[a-f0-9]{64}$/.test(refreshToken)
    ) {
      throw this.invalidSession();
    }

    const tokenHash = this.hashToken(refreshToken);

    const result = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.refreshSession.findUnique({
          where: { tokenHash },
        });

        if (!existing) return null;

        await tx.$queryRaw`
          SELECT id
          FROM auth_session_families
          WHERE id = ${existing.familyId}::uuid
          FOR UPDATE
        `;

        const record = await tx.refreshSession.findUnique({
          where: { tokenHash },
          include: {
            family: {
              include: {
                user: {
                  include: userRelations,
                },
              },
            },
          },
        });

        if (!record) return null;

        const now = new Date();
        const family = record.family;

        if (family.revokedAt || family.expiresAt <= now) {
          return null;
        }

        // Reused token: revoke the session family.

        if (record.rotatedAt) {
          await tx.authSessionFamily.update({
            where: { id: family.id },
            data: { revokedAt: now },
          });

          return null;
        }

        if (
          record.revokedAt ||
          record.expiresAt <= now ||
          !this.isActiveUser(family.user)
        ) {
          return null;
        }

        const newToken = randomBytes(32).toString('hex');

        await tx.refreshSession.update({
          where: { id: record.id },
          data: { rotatedAt: now },
        });

        await tx.refreshSession.create({
          data: {
            familyId: family.id,
            parentId: record.id,
            tokenHash: this.hashToken(newToken),
            expiresAt: family.expiresAt,
          },
        });

        return {
          user: this.safeUser(family.user),
          familyId: family.id,
          refreshToken: newToken,
        };
      }
    );

    if (!result) {
      throw this.invalidSession();
    }

    return {
      accessToken: await this.createAccessToken(
        result.user.id,
        result.familyId
      ),
      refreshToken: result.refreshToken,
      expiresIn: ACCESS_TTL,
      user: result.user,
    };
  }

  // VALIDATE ACCESS TOKEN AND SESSION

  async validateAccessToken(accessToken) {
    let payload;

    try {
      payload = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret: this.secret,
          algorithms: ['HS256'],
          issuer: 'iqraverse',
          audience: 'iqraverse-api',
        }
      );
    } catch {
      throw this.invalidSession();
    }

    if (
      !z.uuid().safeParse(payload.sub).success ||
      !z.uuid().safeParse(payload.sid).success
    ) {
      throw this.invalidSession();
    }

    const family =
      await this.prisma.authSessionFamily.findFirst({
        where: {
          id: payload.sid,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: userRelations,
          },
        },
      });

    if (!family || !this.isActiveUser(family.user)) {
      throw this.invalidSession();
    }

    return {
      user: this.safeUser(family.user),
      familyId: family.id,
    };
  }

  // REVOKE SESSION

  async revokeSession(userId, familyId) {
    await this.prisma.authSessionFamily.updateMany({
      where: {
        id: familyId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Logged out successfully',
    };
  }
}

Inject(PrismaService)(AuthService, undefined, 0);
Inject(JwtService)(AuthService, undefined, 1);