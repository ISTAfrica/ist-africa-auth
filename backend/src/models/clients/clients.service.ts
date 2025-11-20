import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { randomBytes, randomUUID } from 'crypto';
import { hash } from 'bcryptjs';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    private readonly configService: ConfigService,
  ) {}

  async findPublicInfo(clientId: string): Promise<{ name: string; description: string }> {
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
    const saltRounds = Number.isNaN(Number(saltRoundsEnv)) ? 12 : Number(saltRoundsEnv);
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
    clientResponse.client_secret = rawClientSecret;

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

  async remove(id: string): Promise<void> {
    const client = await this.clientModel.findByPk(id);
    if (!client) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }
    await client.destroy();
  }
};


