import { Controller, Get, Param, Patch, Body, BadRequestException, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  // GET all users
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id); 
  }
  // PATCH /api/users/:id/status - toggle user status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Body('statusReason') statusReason?: string,
  ): Promise<User> {
    try {
      return await this.usersService.toggleUserStatus(+id, isActive, statusReason);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  // PATCH /api/users/:id/role - change user role
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: 'user' | 'admin',
  ): Promise<User> {
    try {
      return await this.usersService.updateUserRole(+id, role);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}
