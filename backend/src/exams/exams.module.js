import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ExamsController } from './exams.controller.js';
import { ExamsService } from './exams.service.js';
import { ExamsGuard } from './exams.guard.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ExamsController],
  providers: [ExamsService, ExamsGuard],
})
export class ExamsModule {}
