import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { VerificationService } from './verification.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    VerificationService,
  ],

  exports: [AuthService],
})
export class AuthModule {}