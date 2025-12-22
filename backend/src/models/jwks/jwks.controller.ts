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
      // Use a standard NestJS exception for a clean error response.
      throw new UnauthorizedException('Token is required for introspection.');
    }
    // The controller's job is simple: get the request, call the service, return the result.
    return this.jwksService.introspectToken(token);
  }
}