/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { randomBytes, randomUUID } from 'crypto';
import { hash } from 'bcryptjs';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    private readonly configService: ConfigService,
  ) {}

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
    });
    const clientResponse = newClient.toJSON();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    clientResponse.client_secret = rawClientSecret;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return clientResponse;
  }

  async findAll(): Promise<Omit<Client, 'client_secret'>[]> {
    return this.clientModel.findAll({
      attributes: {
        exclude: ['client_secret'],
      },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Retrieves a single client by its primary key (ID), excluding the secret.
   */
  async findOne(id: string): Promise<Omit<Client, 'client_secret'>> {
    const client = await this.clientModel.findByPk(id, {
      attributes: {
        exclude: ['client_secret'],
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }

    return client;
  }

  async regenerateSecret(id: string) {
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
  ): Promise<Omit<Client, 'client_secret'>> {
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

    await client.update(updateClientDto);

    const updatedClient = await this.clientModel.findByPk(id, {
      attributes: {
        exclude: ['client_secret'],
      },
    });

    if (!updatedClient) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }

    return updatedClient;
  }

  async regenerateSecret(id: string) {
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

  async remove(id: string): Promise<{ message: string }> {
    const client = await this.clientModel.findOne({ where: { client_id: id } });
    if (!client) {
      throw new NotFoundException(`Client with identifier "${id}" not found`);
    }

    // Check for name conflict only if the name is being updated
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

    await client.update(updateClientDto);

    // Retrieve the updated client object excluding the secret
    const updatedClient = await this.clientModel.findByPk(id, {
      attributes: {
        exclude: ['client_secret'],
      },
    });

    if (!updatedClient) {
      // Should ideally not happen if update succeeded
      throw new NotFoundException(
        `Client with ID "${id}" not found after update`,
      );
    }

    return updatedClient;
  }

  /**
   * Deletes a client by its unique ID (client:uuid) or client_id (hex string).
   * Note: The logic below finds by `client_id`, which is often the public-facing ID.
   */
  async remove(id: string): Promise<{ message: string }> {
    // Determine whether the input ID is the internal 'id' or the public 'client_id'
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
