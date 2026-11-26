import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class AppController {
  @Get()
  getHello() {
    return 'Welcome to IqraVerse Backend';
  }

  @Get('health')
  @ApiOperation({ summary: 'Check backend server status' })
  @ApiOkResponse({
    description: 'Backend is running successfully',
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['ok'],
          example: 'ok',
        },
      },
    },
  })
  health() {
    return { status: 'ok' };
  }
}