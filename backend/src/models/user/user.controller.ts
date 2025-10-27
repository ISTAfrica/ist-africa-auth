import { Controller, Get, Post, Body, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { Request } from 'express'; // <-- CHANGE THIS LINE TO USE 'import type'

@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getProfile(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.userService.getProfile(user.id);
  }

  @Post('change-password')
  changePassword(
    @Req() req: Request,
    @Body(new ValidationPipe()) changePasswordDto: ChangePasswordDto,
  ) {
    const user = req.user as { id: number };
    return this.userService.changePassword(user.id, changePasswordDto);
  }
}