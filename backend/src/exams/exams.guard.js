import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';

@Injectable()
export class ExamsGuard {
  constructor(authService) {
    this.authService = authService;
  }

  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;
    const match = typeof header === 'string' && /^Bearer ([^\s]+)$/i.exec(header);
    if (!match) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Access token required' });
    }
    request.auth = await this.authService.validateAccessToken(match[1]);
    return true;
  }
}

Inject(AuthService)(ExamsGuard, undefined, 0);
