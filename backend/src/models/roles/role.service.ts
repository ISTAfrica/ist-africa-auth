import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserRole } from './entities/user.role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(UserRole)
    private readonly roleModel: typeof UserRole,
  ) {}

  async findAll(): Promise<UserRole[]> {
    return this.roleModel.findAll();
  }

  async findOne(id: number): Promise<UserRole> {
    const role = await this.roleModel.findByPk(id);
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
    return role;
  }

  // role.service.ts
  async create(createRoleDto: CreateRoleDto): Promise<UserRole> {
    // Cast DTO to 'any' to satisfy Sequelize TypeScript requirements
    const role = await this.roleModel.create(createRoleDto as any);
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<UserRole> {
    const role = await this.findOne(id);
    await role.update({ ...updateRoleDto });
    return role;
  }

  async remove(id: number): Promise<{ message: string }> {
    const role = await this.findOne(id);
    await role.destroy();
    return { message: `Role with id ${id} deleted successfully` };
  }
}
