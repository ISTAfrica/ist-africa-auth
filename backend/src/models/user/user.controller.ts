import { Controller, Get, Post, Body, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

import type { Request } from 'express'; 

@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getProfile(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.userService.getProfile(user.id);
  }

  
}