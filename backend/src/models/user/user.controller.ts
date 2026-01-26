import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  ValidationPipe,
  Patch,
  UploadedFile,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('api/user')
@UseGuards(JwtAuthGuard) // Protects all routes with JWT
export class UserController {
  constructor(private readonly userService: UserService) { }

  // -------------------- User self routes --------------------
  @Get('me')
  getProfile(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.userService.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(
    @Req() req: Request,
    @Body(new ValidationPipe()) updateUserDto: UpdateUserDto,
  ) {
    const user = req.user as { id: number };
    return this.userService.updateProfile(user.id, updateUserDto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  uploadAvatar(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    const user = req.user as { id: number };
    return this.userService.updateAvatar(user.id, file);
  }
  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard) // <
  @Roles('admin')
  async updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: 'user' | 'admin',
  ) {
    const updatedUser = await this.userService.updateProfile(+userId, { role });
    return {
      message: `User role updated to ${role}`,
      user: updatedUser,
    };
  }
}
