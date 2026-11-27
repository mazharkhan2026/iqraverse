import { Controller, Get, Post, Put, Bind, Param, Body, Req, Headers, Inject, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ExamsGuard } from '../exams/exams.guard.js';
import { AttemptsService } from './attempts.service.js';
@ApiTags('Attempts — NSCT practice')
@ApiBearerAuth()
@UseGuards(ExamsGuard)
@Controller('attempts')
export class AttemptsController {
 constructor(service){this.service=service;}
 @Post('custom')
 @Bind(Req(),Body(),Headers('idempotency-key'))
 @ApiHeader({name:'Idempotency-Key',required:true})
 @ApiBody({schema:{type:'object',required:['variantId','topicIds','difficulty','count'],properties:{variantId:{type:'string',format:'uuid'},topicIds:{type:'array',minItems:1,uniqueItems:true,items:{type:'string',format:'uuid'}},difficulty:{type:'string',enum:['easy','medium','hard','mixed']},count:{type:'integer',minimum:1,maximum:100},formats:{type:'array',items:{type:'string',enum:['single_select']}}}}})
 @ApiOperation({summary:'Create NSCT practice attempt'})
 create(req,body,key){return this.service.create(req.auth,body,key);}
 @Get(':attemptId')
 @Bind(Req(),Param('attemptId'))
 get(req,id){return this.service.get(req.auth,id);}
 @Put(':attemptId/answers/:itemId')
 @Bind(Req(),Param('attemptId'),Param('itemId'),Body())
 @ApiBody({schema:{type:'object',required:['answer'],properties:{answer:{type:'string'}}}})
 save(req,id,item,body){return this.service.save(req.auth,id,item,body);}
 @Post(':attemptId/submit')
 @HttpCode(200)
 @Bind(Req(),Param('attemptId'))
 submit(req,id){return this.service.submit(req.auth,id);}
 @Get(':attemptId/result')
 @Bind(Req(),Param('attemptId'))
 result(req,id){return this.service.result(req.auth,id);}
}
Inject(AttemptsService)(AttemptsController,undefined,0);
