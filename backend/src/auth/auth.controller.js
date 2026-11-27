import {
  Controller,
  Post,
  Body,
  Bind,
  Inject,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  @Post('register')
  @Bind(Body())
  @ApiOperation({ summary: 'Register a student account' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'displayName'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
        },
        password: {
          type: 'string',
          minLength: 8,
          format: 'password',
        },
        displayName: {
          type: 'string',
          minLength: 1,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Account created successfully',
    schema: {
      type: 'object',
      required: ['id', 'email', 'displayName', 'roles'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        displayName: { type: 'string' },
        roles: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['student', 'instructor', 'admin'],
          },
        },
      },
    },
  })
  register(body) {
    return this.authService.register(body);
  }
}

Inject(AuthService)(AuthController, undefined, 0);