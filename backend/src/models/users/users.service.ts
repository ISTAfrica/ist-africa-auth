import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { EmailService } from '../../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.userModel.create({
      email: createUserDto.email,
      name: createUserDto.name,
      password: createUserDto.password,
      role: createUserDto.role,
    });
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll({
      attributes: {
        exclude: ['password'],
        include: ['role'],
      },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      attributes: {
        exclude: ['password'],
        include: ['role'],
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
      attributes: {
        exclude: ['password'],
        include: ['role'],
      },
    });
  }

  /**
   * Change user's role (admin/user)
   */
async updateUserRole(userId: number, role: "user" | "admin"): Promise<User> {
  const user = await this.findOne(userId);

  if (role === "admin") {
    user.isActive = false; 
    user.statusReason = "New admin account - disabled by default";
  }

  user.role = role;
  await user.save();

  return user;
}


  async toggleUserStatus(
  userId: number,
  isActive: boolean,
  statusReason?: string,
): Promise<User> {
  const user = await this.findOne(userId);

  if (user.isActive === isActive) {
    throw new BadRequestException(
      `User is already ${isActive ? 'active' : 'disabled'}`,
    );
  }

  user.isActive = isActive;
  user.statusReason = statusReason || 'No reason provided'; // <-- save reason
  await user.save();

  // Send email notifications
  if (!isActive) {
    await this.emailService.sendAccountDisabledEmail(
      user.name,
      user.email,
      user.statusReason || 'No reason provided',
    );
  } else {
    await this.emailService.sendAccountReactivatedEmail(user.name, user.email);
  }

  return user;
}

}
