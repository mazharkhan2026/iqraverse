import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ExamsModule } from './exams/exams.module.js';
import { AttemptsModule } from './attempts/attempts.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ExamsModule,
    AttemptsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}