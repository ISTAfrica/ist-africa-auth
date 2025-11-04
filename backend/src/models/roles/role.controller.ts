import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { UserRole } from './entities/user.role.entity';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async findAll(): Promise<UserRole[]> {
    return this.roleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<UserRole> {
    return this.roleService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateRoleDto): Promise<UserRole> {
    return this.roleService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateRoleDto,
  ): Promise<UserRole> {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.roleService.remove(id);
  }
}
