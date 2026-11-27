import { Controller, Get, Bind, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ExamsService } from './exams.service.js';
import { ExamsGuard } from './exams.guard.js';

const uuid = { type: 'string', format: 'uuid' };
const string = { type: 'string' };
const errorSchema = { type: 'object', required: ['code', 'message'], properties: { code: string, message: string } };
const variant = {
  type: 'object',
  required: ['id', 'examCode', 'code', 'name', 'activeSyllabusId', 'syllabusEdition'],
  properties: { id: uuid, examCode: string, code: string, name: string, activeSyllabusId: uuid, syllabusEdition: string },
};
const subject = {
  type: 'object', required: ['id', 'name', 'topics'],
  properties: {
    id: uuid, name: string,
    topics: { type: 'array', items: {
      type: 'object', required: ['id', 'name', 'chapterId', 'chapterName'],
      properties: { id: uuid, name: string, chapterId: uuid, chapterName: string },
    } },
  },
};

@ApiTags('Exams')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthenticated', schema: errorSchema })
@UseGuards(ExamsGuard)
@Controller('exams')
export class ExamsController {
  constructor(examsService) {
    this.examsService = examsService;
  }

  @Get('variants')
  @ApiOperation({ summary: 'List active exam variants and published syllabus editions' })
  @ApiOkResponse({ schema: { type: 'array', items: variant } })
  listVariants() {
    return this.examsService.listVariants();
  }

  @Get('variants/:variantId/subjects')
  @Bind(Param('variantId'), Query('syllabusVersionId'))
  @ApiOperation({ summary: 'List subjects and topics for a published syllabus' })
  @ApiParam({ name: 'variantId', required: true, schema: uuid })
  @ApiQuery({ name: 'syllabusVersionId', required: false, schema: uuid })
  @ApiOkResponse({ schema: { type: 'array', items: subject } })
  @ApiResponse({ status: 400, description: 'Invalid identifier', schema: errorSchema })
  @ApiResponse({ status: 404, description: 'Published syllabus not found', schema: errorSchema })
  listSubjects(variantId, syllabusVersionId) {
    return this.examsService.listSubjects(variantId, syllabusVersionId);
  }
}

Inject(ExamsService)(ExamsController, undefined, 0);
