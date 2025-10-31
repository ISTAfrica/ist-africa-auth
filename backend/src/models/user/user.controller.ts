import { Controller, Get, Post, Body, UseGuards, Req, ValidationPipe, Patch,UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import type { Request } from 'express'; 
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

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
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
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
  uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = req.user as { id: number };
    return this.userService.updateAvatar(user.id, file);
  }
  
}