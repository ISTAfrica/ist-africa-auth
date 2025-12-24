import { Controller, Get, Post, Body, HttpCode, Header, UnauthorizedException } from '@nestjs/common';
import { JwksService } from './jwks.service';

@Controller('api/auth')
export class JwksController {
  constructor(private readonly jwksService: JwksService) {}

  @Get('jwks') 
  @HttpCode(200)
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'public, max-age=3600, must-revalidate')
  async getJwksEndpoint() {
    return this.jwksService.getJwks();
  }

  @Post('introspect')
  @HttpCode(200)
  async introspect(@Body('token') token: string) {
    if (!token) {
      throw new UnauthorizedException('Token is required for introspection.');
    }
    return this.jwksService.introspectToken(token);
  }
}