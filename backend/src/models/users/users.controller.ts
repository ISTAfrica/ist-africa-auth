import { Controller, Get, Param, Patch, Body, BadRequestException, Post, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { User as UserDecorator } from '../../commons/decorators/user.decorator';
@Controller('api/users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  // GET all users
  @Get()
  async findAll(): Promise<User[]> {

    console.log('Fetching all users...');
    return this.usersService.findAll();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
  // PATCH /api/users/:id/status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Body('statusReason') statusReason: string,
    @UserDecorator() loggedInUser,
  ): Promise<User> {
    try {
      return await this.usersService.toggleUserStatus(
        +id,
        isActive,
        loggedInUser.id,
        statusReason,
      );
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  // PATCH /api/users/:id/role
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: 'user' | 'admin',
    @UserDecorator() loggedInUser,
  ): Promise<User> {
    try {
      return await this.usersService.updateUserRole(
        +id,
        role,
        loggedInUser.id,
      );
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}

