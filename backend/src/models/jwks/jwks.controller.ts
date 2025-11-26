import { Controller, Get, HttpCode, Header } from '@nestjs/common';
import { JwksService } from './jwks.service';

@Controller('auth')
export class JwksController {
  constructor(private readonly jwksService: JwksService) {}

  @Get('jwks') 
  @HttpCode(200)
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'public, max-age=3600, must-revalidate')
  async getJwksEndpoint() {
    return this.jwksService.getJwks();
  }
}