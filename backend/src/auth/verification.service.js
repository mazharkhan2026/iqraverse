import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class VerificationService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
  }

  async createToken(userId) {
    const token = randomBytes(32).toString('hex');

    const expiresAt = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await this.prisma.verificationToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        expiresAt,
      },
    });

    return token;
  }

  async verifyToken(token) {
    if (
      typeof token !== 'string' ||
      !/^[a-f0-9]{64}$/.test(token)
    ) {
      throw new BadRequestException({
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired verification token',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      const record = await tx.verificationToken.findUnique({
        where: {
          tokenHash: this.hashToken(token),
        },
      });

      if (!record) {
        throw new BadRequestException({
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token',
        });
      }

      const consumed = await tx.verificationToken.updateMany({
        where: {
          id: record.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (consumed.count !== 1) {
        throw new BadRequestException({
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token',
        });
      }

      const verified = await tx.user.updateMany({
        where: {
          id: record.userId,
          status: 'active',
          emailVerifiedAt: null,
        },
        data: {
          emailVerifiedAt: now,
        },
      });

      if (verified.count !== 1) {
        throw new BadRequestException({
          code: 'VERIFICATION_FAILED',
          message: 'Account cannot be verified',
        });
      }

      return {
        message: 'Email verified successfully',
      };
    });
  }
}

Inject(PrismaService)(VerificationService, undefined, 0);