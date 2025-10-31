import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { compare, hash } from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.toJSON();
}

   async updateProfile(userId: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
  
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await user.update(updateUserDto);
    const { password, ...result } = user.toJSON();
    return result;
  }


  async updateAvatar(userId: number, file: Express.Multer.File): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const avatarUrl = `${baseUrl}/uploads/${file.filename}`;

    await user.update({ avatarUrl });

    const { password, ...result } = user.toJSON();
    return result;
  }
  }
