import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ExamsGuard } from '../exams/exams.guard.js';
import { AttemptsService } from './attempts.service.js';
import { AttemptsController } from './attempts.controller.js';
@Module({imports:[PrismaModule,AuthModule],controllers:[AttemptsController],providers:[AttemptsService,ExamsGuard]})
export class AttemptsModule {}
