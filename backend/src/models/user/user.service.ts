import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { promises as fs } from 'fs';
import * as path from 'path';

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

  async updateProfile(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await user.update(updateUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user.toJSON();
    return result;
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      await fs.unlink(file.path);
      throw new NotFoundException('User not found');
    }

    const oldAvatarUrl = user.avatarUrl;

    if (oldAvatarUrl) {
      try {
        const oldFilename = path.basename(new URL(oldAvatarUrl).pathname);
        const oldAvatarPath = path.join(process.cwd(), 'uploads', oldFilename);
        await fs.access(oldAvatarPath);
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        console.error(
          `Could not delete old avatar at ${oldAvatarUrl}:`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          error.message,
        );
      }
    }

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const newAvatarUrl = `${baseUrl}/uploads/${file.filename}`;

    await user.update({ avatarUrl: newAvatarUrl });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user.toJSON();
    return result;
  }
}
