/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Op } from 'sequelize';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { randomBytes, randomUUID } from 'crypto';
import { hash } from 'bcryptjs';
import { ClientUser } from '../auth/entities/client-user.entity';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { ClientCompany } from '../companies/entities/client-company.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    @InjectModel(ClientUser)
    private readonly clientUserModel: typeof ClientUser,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Company)
    private readonly companyModel: typeof Company,
    @InjectModel(ClientCompany)
    private readonly clientCompanyModel: typeof ClientCompany,
    private readonly configService: ConfigService,
  ) {}

  // -------------------- Client Companies helpers --------------------

  private async validateCompanyIds(companyIds: string[]): Promise<void> {
    if (companyIds.length === 0) return;
    const found = await this.companyModel.findAll({
      where: { id: companyIds },
      attributes: ['id'],
    });
    if (found.length !== companyIds.length) {
      throw new BadRequestException(
        'One or more company_ids reference companies that do not exist',
      );
    }
  }

  private async replaceClientCompanies(
    clientId: string,
    companyIds: string[],
  ): Promise<void> {
    await this.clientCompanyModel.destroy({ where: { clientId } });
    if (companyIds.length === 0) return;
    await this.clientCompanyModel.bulkCreate(
      companyIds.map((companyId) => ({ clientId, companyId })),
    );
  }

  private async getClientCompanyIds(clientId: string): Promise<string[]> {
    const rows = await this.clientCompanyModel.findAll({
      where: { clientId },
      attributes: ['companyId'],
    });
    return rows.map((r) => r.companyId);
  }

  // -------------------- Client Members --------------------

  async listMembers(clientId: string, q?: string) {
    const client = await this.clientModel.findByPk(clientId);
    if (!client) throw new NotFoundException(`Client "${clientId}" not found`);

    const assignments = await this.clientUserModel.findAll({
      where: { clientId },
      order: [['createdAt', 'DESC']],
    });

    if (assignments.length === 0) return [];

    const userIds = assignments.map((a) => a.userId);
    const userWhere: Record<string | symbol, unknown> = { id: userIds };
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      userWhere[Op.or] = [
        { email: { [Op.iLike]: term } },
        { name: { [Op.iLike]: term } },
      ];
    }

    const users = await this.userModel.findAll({
      where: userWhere,
      attributes: ['id', 'email', 'name', 'membershipStatus', 'isActive'],
    });

    const userById = new Map(users.map((u) => [u.id, u]));

    return assignments
      .map((a) => {
        const u = userById.get(a.userId);
        if (!u) return null;
        return {
          userId: u.id,
          email: u.email,
          name: u.name,
          membershipStatus: u.membershipStatus,
          isActive: u.isActive,
          assignedAt: a.getDataValue('createdAt'),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  async assignMembers(
    clientId: string,
    userIds: string[],
    assignedBy: string,
  ): Promise<{ added: number; skipped: number }> {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { added: 0, skipped: 0 };
    }

    const client = await this.clientModel.findByPk(clientId);
    if (!client) throw new NotFoundException(`Client "${clientId}" not found`);

    const validUsers = await this.userModel.findAll({
      where: { id: userIds },
      attributes: ['id'],
    });
    const validIds = validUsers.map((u) => u.id);

    if (validIds.length === 0) return { added: 0, skipped: userIds.length };

    const rows = validIds.map((userId) => ({
      clientId,
      userId,
      assignedBy,
    }));

    const created = await this.clientUserModel.bulkCreate(rows, {
      ignoreDuplicates: true,
    });

    return {
      added: created.length,
      skipped: userIds.length - created.length,
    };
  }

  async removeMembers(
    clientId: string,
    userIds: string[],
  ): Promise<{ removed: number }> {
    if (!Array.isArray(userIds) || userIds.length === 0) return { removed: 0 };

    const client = await this.clientModel.findByPk(clientId);
    if (!client) throw new NotFoundException(`Client "${clientId}" not found`);

    const removed = await this.clientUserModel.destroy({
      where: { clientId, userId: userIds },
    });
    return { removed };
  }

  async listAssignableUsers(clientId: string, q?: string, limit = 50) {
    const client = await this.clientModel.findByPk(clientId);
    if (!client) throw new NotFoundException(`Client "${clientId}" not found`);

    const assignedRows = await this.clientUserModel.findAll({
      where: { clientId },
      attributes: ['userId'],
    });
    const assignedIds = assignedRows.map((r) => r.userId);

    const where: Record<string, unknown> = { isActive: true };
    if (assignedIds.length) {
      where.id = { [Op.notIn]: assignedIds };
    }
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      where[Op.and as unknown as string] = [
        {
          [Op.or]: [
            { email: { [Op.iLike]: term } },
            { name: { [Op.iLike]: term } },
          ],
        },
      ];
    }

    const users = await this.userModel.findAll({
      where,
      attributes: ['id', 'email', 'name', 'membershipStatus'],
      order: [['name', 'ASC']],
      limit,
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      membershipStatus: u.membershipStatus,
    }));
  }

  async findPublicInfo(
    clientId: string,
  ): Promise<{ name: string; description: string }> {
    const client = await this.clientModel.findOne({
      where: { client_id: clientId },
      attributes: ['name', 'description'], // Only return public, non-sensitive info
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client.toJSON();
  }

  async create(createClientDto: CreateClientDto) {
    const existingClient = await this.clientModel.findOne({
      where: { name: createClientDto.name },
    });
    if (existingClient) {
      throw new ConflictException('Client with this name already exists');
    }

    const requiresCompany = createClientDto.requires_company ?? false;
    const companyIds = createClientDto.company_ids ?? [];

    if (requiresCompany && companyIds.length === 0) {
      throw new BadRequestException(
        'company_ids must contain at least one company when requires_company is true',
      );
    }
    await this.validateCompanyIds(companyIds);

    const clientId = randomBytes(16).toString('hex');
    const rawClientSecret = randomBytes(32).toString('hex');

    const saltRoundsEnv = this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    const saltRounds = Number.isNaN(Number(saltRoundsEnv))
      ? 12
      : Number(saltRoundsEnv);
    const hashedSecret = await hash(rawClientSecret, saltRounds);

    const newClient = await this.clientModel.create({
      id: `client:${randomUUID()}`,
      client_id: clientId,
      client_secret: hashedSecret,
      name: createClientDto.name,
      description: createClientDto.description,
      redirect_uri: createClientDto.redirect_uri,
      allowed_origins: createClientDto.allowed_origins,
      requires_company: requiresCompany,
    });

    await this.replaceClientCompanies(newClient.id, companyIds);

    const clientResponse = newClient.toJSON();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    clientResponse.client_secret = rawClientSecret;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    clientResponse.company_ids = companyIds;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return clientResponse;
  }

  async findAll(): Promise<Array<Record<string, unknown>>> {
    const clients = await this.clientModel.findAll({
      attributes: {
        exclude: ['client_secret'],
      },
      order: [['created_at', 'DESC']],
    });

    if (clients.length === 0) return [];

    const allMemberships = await this.clientCompanyModel.findAll({
      where: { clientId: clients.map((c) => c.id) },
      attributes: ['clientId', 'companyId'],
    });
    const byClient = new Map<string, string[]>();
    for (const m of allMemberships) {
      const arr = byClient.get(m.clientId) ?? [];
      arr.push(m.companyId);
      byClient.set(m.clientId, arr);
    }

    return clients.map((c) => {
      const json = c.toJSON() as Record<string, unknown>;
      json.company_ids = byClient.get(c.id) ?? [];
      return json;
    });
  }

  async findOne(id: string): Promise<Record<string, unknown>> {
    const client = await this.clientModel.findByPk(id, {
      attributes: {
        exclude: ['client_secret'],
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }

    const companyIds = await this.getClientCompanyIds(client.id);
    const json = client.toJSON() as Record<string, unknown>;
    json.company_ids = companyIds;
    return json;
  }

  async regenerateClientSecret(id: string) {
    const client = await this.clientModel.findByPk(id);

    if (!client) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }

    const rawClientSecret = randomBytes(32).toString('hex');

    const saltRoundsEnv = this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    const saltRounds = Number.isNaN(Number(saltRoundsEnv))
      ? 12
      : Number(saltRoundsEnv);
    const hashedSecret = await hash(rawClientSecret, saltRounds);

    await client.update({
      client_secret: hashedSecret,
    });

    const clientResponse = client.toJSON();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    clientResponse.client_secret = rawClientSecret;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return clientResponse;
  }

  async update(
    id: string,
    updateClientDto: UpdateClientDto,
  ): Promise<Record<string, unknown>> {
    const client = await this.clientModel.findByPk(id);

    if (!client) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }
    if (updateClientDto.name && updateClientDto.name !== client.name) {
      const existingClient = await this.clientModel.findOne({
        where: { name: updateClientDto.name },
      });

      if (existingClient) {
        throw new ConflictException(
          `Client with name '${updateClientDto.name}' already exists`,
        );
      }
    }

    const { company_ids: incomingCompanyIds, ...scalarUpdates } =
      updateClientDto;

    const nextRequiresCompany =
      scalarUpdates.requires_company ?? client.requires_company;
    const nextCompanyIds =
      incomingCompanyIds ?? (await this.getClientCompanyIds(client.id));

    if (nextRequiresCompany && nextCompanyIds.length === 0) {
      throw new BadRequestException(
        'company_ids must contain at least one company when requires_company is true',
      );
    }
    if (incomingCompanyIds !== undefined) {
      await this.validateCompanyIds(incomingCompanyIds);
    }

    await client.update(scalarUpdates);

    if (incomingCompanyIds !== undefined) {
      await this.replaceClientCompanies(client.id, incomingCompanyIds);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const searchField = id.startsWith('client:') ? 'id' : 'client_id';

    const client = await this.clientModel.findOne({
      where: { [searchField]: id },
    });

    if (!client) {
      throw new NotFoundException(`Client with identifier "${id}" not found`);
    }

    const clientName = client.name;
    await client.destroy();

    return {
      message: `Client "${clientName}" has been successfully deleted`,
    };
  }
}
