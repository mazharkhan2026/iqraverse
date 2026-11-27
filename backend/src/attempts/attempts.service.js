import { Injectable, Inject, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { createPractice,getPractice,savePractice,submitPractice,getPracticeResult } from './practice-persistence.mjs';
const statuses={VALIDATION_ERROR:400,UNAUTHENTICATED:401,NOT_FOUND:404,INSUFFICIENT_QUESTION_BANK:409,IDEMPOTENCY_CONFLICT:409,ACTIVE_SECURE_MOCK:409,ATTEMPT_ACTIVE:409,ATTEMPT_FINALIZED:409};
@Injectable()
export class AttemptsService {
 constructor(prisma){this.prisma=prisma;}
 async run(fn,...args){try{return await fn(this.prisma,...args);}catch(error){if(statuses[error.code])throw new HttpException({code:error.code,message:error.message},statuses[error.code]);throw error;}}
 create(auth,body,key){return this.run(createPractice,auth,body,key);}
 get(auth,id){return this.run(getPractice,auth,id);}
 save(auth,id,item,body){return this.run(savePractice,auth,id,item,body);}
 submit(auth,id){return this.run(submitPractice,auth,id);}
 result(auth,id){return this.run(getPracticeResult,auth,id);}
}
Inject(PrismaService)(AttemptsService,undefined,0);
