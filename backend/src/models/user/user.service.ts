import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { compare, hash } from 'bcryptjs';
import { User } from '../users/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  /**
   * Fetches a user's profile by their ID, excluding the password.
   * @param userId The ID of the user to retrieve.
   * @returns The user object without the password hash.
   */
  async getProfile(userId: number) {
    // Use findByPk for primary key lookups, and specify attributes to exclude the password.
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // The raw data is returned, which already excludes the password.
    return user.toJSON();
}
  }
