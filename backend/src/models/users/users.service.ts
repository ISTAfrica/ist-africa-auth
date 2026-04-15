import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { EmailService } from '../../email/email.service';
import { ClientUser } from '../auth/entities/client-user.entity';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(ClientUser)
    private readonly clientUserModel: typeof ClientUser,
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    private readonly emailService: EmailService,
  ) {}

  // -------------------- User → Apps (admin) --------------------

  async listUserClients(userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException(`User "${userId}" not found`);

    const assignments = await this.clientUserModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    if (assignments.length === 0) return [];

    const clientIds = assignments.map((a) => a.clientId);
    const clients = await this.clientModel.findAll({
      where: { id: clientIds },
      attributes: ['id', 'client_id', 'name', 'description', 'status'],
    });
    const byId = new Map(clients.map((c) => [c.id, c]));

    return assignments
      .map((a) => {
        const c = byId.get(a.clientId);
        if (!c) return null;
        return {
          clientId: c.id,
          client_id: c.client_id,
          name: c.name,
          description: c.description,
          status: c.status,
          assignedAt: a.getDataValue('createdAt'),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  async assignUserClients(
    userId: string,
    clientIds: string[],
    assignedBy: string,
  ): Promise<{ added: number; skipped: number }> {
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return { added: 0, skipped: 0 };
    }
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException(`User "${userId}" not found`);

    const validClients = await this.clientModel.findAll({
      where: { id: clientIds },
      attributes: ['id'],
    });
    const validIds = validClients.map((c) => c.id);
    if (validIds.length === 0) return { added: 0, skipped: clientIds.length };

    const rows = validIds.map((clientId) => ({ clientId, userId, assignedBy }));
    const created = await this.clientUserModel.bulkCreate(rows, {
      ignoreDuplicates: true,
    });
    return { added: created.length, skipped: clientIds.length - created.length };
  }

  async removeUserClients(
    userId: string,
    clientIds: string[],
  ): Promise<{ removed: number }> {
    if (!Array.isArray(clientIds) || clientIds.length === 0) return { removed: 0 };
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException(`User "${userId}" not found`);

    const removed = await this.clientUserModel.destroy({
      where: { userId, clientId: clientIds },
    });
    return { removed };
  }

  async listAssignableClients(userId: string, q?: string, limit = 50) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException(`User "${userId}" not found`);

    const assignedRows = await this.clientUserModel.findAll({
      where: { userId },
      attributes: ['clientId'],
    });
    const assignedIds = assignedRows.map((r) => r.clientId);

    const where: Record<string | symbol, unknown> = { status: 'active' };
    if (assignedIds.length) where.id = { [Op.notIn]: assignedIds };
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: term } },
        { description: { [Op.iLike]: term } },
      ];
    }

    const clients = await this.clientModel.findAll({
      where,
      attributes: ['id', 'client_id', 'name', 'description'],
      order: [['name', 'ASC']],
      limit,
    });

    return clients.map((c) => ({
      id: c.id,
      client_id: c.client_id,
      name: c.name,
      description: c.description,
    }));
  }

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

  async findOne(id: string): Promise<User> {
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

  async updateUserRole(
  userId: string,
  role: 'user' | 'admin',
  loggedInUserId: string,
): Promise<User> {
  if (userId === loggedInUserId) {
    throw new BadRequestException('You cannot update your own role.');
  }

  const user = await this.findOne(userId);

  // When changing another user to admin, disable account by default
  if (role === 'admin') {
    user.isActive = false;
    user.statusReason = 'New admin account - inactive by default';
  }

  user.role = role;
  await user.save();

  return user;
}

async toggleUserStatus(
  userId: string,
  isActive: boolean,
  loggedInUserId: string,
  statusReason?: string,
): Promise<User> {
  if (userId === loggedInUserId) {
    throw new BadRequestException('You cannot change your own account status.');
  }

  const user = await this.findOne(userId);

  if (user.isActive === isActive) {
    throw new BadRequestException(
      `User is already ${isActive ? 'active' : 'inactive'}`,
    );
  }

  user.isActive = isActive;
  user.statusReason = statusReason || 'No reason provided';
  await user.save();

  // Send email notifications (fire-and-forget)
  if (!isActive) {
    this.emailService.sendAccountDisabledEmail(
      user.name,
      user.email,
      user.statusReason,
    ).catch((err) => console.error('Failed to send deactivation email:', err));
  } else {
    this.emailService.sendAccountReactivatedEmail(user.name, user.email)
      .catch((err) => console.error('Failed to send reactivation email:', err));
  }

  return user;
}
}