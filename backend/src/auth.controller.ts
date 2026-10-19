import { Controller, Get, Param, Query } from '@nestjs/common';
import { signDemoToken } from './auth';

@Controller('auth')
export class AuthController {
  @Get('demo-token/:userId')
  getDemoToken(@Param('userId') userId: string, @Query('role') role?: 'user' | 'admin') {
    return {
      userId,
      role: role === 'admin' ? 'admin' : 'user',
      token: signDemoToken(userId, role === 'admin' ? 'admin' : 'user'),
    };
  }
}
