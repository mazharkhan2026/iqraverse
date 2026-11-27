import { Controller, Get, Bind, Param, Query, Req, Inject, UseGuards, HttpException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { ExamsGuard } from '../exams/exams.guard.js';
import { getProgress,listHistory } from './analytics-persistence.mjs';
const statuses={VALIDATION_ERROR:400,UNAUTHENTICATED:401,FORBIDDEN:403,NOT_FOUND:404,ACTIVE_SECURE_MOCK:409,ATTEMPT_ACTIVE:409};
const id={type:'string',format:'uuid'};
const mode={type:'string',enum:['practice','mock','course','all']};
const performance={type:'object',required:['topicId','topicName','distinctAnswered','accuracy','status'],properties:{topicId:id,topicName:{type:'string'},distinctAnswered:{type:'integer',minimum:0},accuracy:{type:'number',nullable:true,minimum:0,maximum:100},status:{type:'string',enum:['weak','not_weak','insufficient','unassessed']}}};
@ApiTags('Progress and history')
@ApiBearerAuth()
@ApiResponse({status:409,description:'Active secure mock; finish it first'})
@UseGuards(ExamsGuard)
@Controller()
export class AnalyticsController {
  constructor(prisma){this.prisma=prisma;}
  async run(fn,...args){try{return await fn(this.prisma,...args);}catch(e){if(statuses[e.code])throw new HttpException({code:e.code,message:e.message},statuses[e.code]);throw e;}}
  @Get('attempts')
  @Bind(Req(),Query())
  @ApiOperation({summary:'List finalized attempt results (paginated)'})
  @ApiQuery({name:'variantId',required:true,schema:id})
  @ApiQuery({name:'syllabusVersionId',required:false,schema:id})
  @ApiQuery({name:'mode',required:false,schema:{type:'string',enum:['practice','mock','course']}})
  @ApiQuery({name:'cursor',required:false,schema:id})
  @ApiQuery({name:'limit',required:false,schema:{type:'integer',minimum:1,maximum:100,default:20}})
  @ApiOkResponse({description:'Paginated finalized Result objects and nullable nextCursor'})
  history(req,query){return this.run(listHistory,req.auth,query);}
  @Get('progress/:variantId')
  @Bind(Req(),Param('variantId'),Query())
  @ApiOperation({summary:'Topic accuracy from latest distinct graded answers'})
  @ApiParam({name:'variantId',schema:id})
  @ApiQuery({name:'syllabusVersionId',required:false,schema:id})
  @ApiQuery({name:'mode',required:false,schema:mode})
  @ApiOkResponse({schema:{type:'object',required:['variantId','syllabusVersionId','mode','topics'],properties:{variantId:id,syllabusVersionId:id,mode,topics:{type:'array',items:performance}}}})
  progress(req,variantId,query){return this.run(getProgress,req.auth,variantId,query);}
}
Inject(PrismaService)(AnalyticsController,undefined,0);
