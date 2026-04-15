import { Controller, Get, Param, Patch, Body, BadRequestException, Post, UseGuards, Req, Delete, Query } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { User as UserDecorator } from '../../commons/decorators/user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
@Controller('api/users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // -------------------- User → Apps (admin) --------------------

  @Get(':id/clients')
  @UseGuards(AdminGuard)
  listUserClients(@Param('id') id: string) {
    return this.usersService.listUserClients(id);
  }

  @Post(':id/clients')
  @UseGuards(AdminGuard)
  assignUserClients(
    @Param('id') id: string,
    @Body() body: { clientIds: string[] },
    @Req() req: Request,
  ) {
    const adminId = req.user?.id ?? '';
    return this.usersService.assignUserClients(id, body.clientIds ?? [], adminId);
  }

  @Delete(':id/clients')
  @UseGuards(AdminGuard)
  removeUserClients(
    @Param('id') id: string,
    @Body() body: { clientIds: string[] },
  ) {
    return this.usersService.removeUserClients(id, body.clientIds ?? []);
  }

  @Get(':id/clients/assignable')
  @UseGuards(AdminGuard)
  listAssignableClients(
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    const lim = limit ? Math.min(Number(limit) || 50, 200) : 50;
    return this.usersService.listAssignableClients(id, q, lim);
  }

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
    return this.usersService.findOne(id);
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
        id,
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
        id,
        role,
        loggedInUser.id,
      );
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}

