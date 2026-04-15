import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { EmailService } from '../../email/email.service';
import { CreateUserDto } from './dto/create-user.dto';

// Mock User data
const mockUserList = [
  { id: 'a1111111-1111-1111-1111-111111111111', name: 'Alice', email: 'alice@example.com', password: 'hashed1', role: 'user', isActive: true },
  { id: 'b2222222-2222-2222-2222-222222222222', name: 'Bob', email: 'bob@example.com', password: 'hashed2', role: 'user', isActive: true },
];

const mockCreateUserDto: CreateUserDto = {
  name: 'Charlie',
  email: 'charlie@example.com',
  password: 'testpassword123',
  role: 'user',
};

// Mocked Sequelize model
const mockUserModel = {
  create: jest.fn().mockResolvedValue({ id: 'c3333333-3333-3333-3333-333333333333', ...mockCreateUserDto }),
  findAll: jest.fn().mockResolvedValue(mockUserList),
  findByPk: jest.fn((id: string) =>
    Promise.resolve(mockUserList.find(u => u.id === id) || null)
  ),
  findOne: jest.fn((options) => 
    Promise.resolve(mockUserList.find(u => u.email === options.where.email) || null)
  ),
};

// Mock EmailService
const mockEmailService = {
  sendAccountDisabledEmail: jest.fn(),
  sendAccountReactivatedEmail: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let userModel: typeof User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User),
          useValue: mockUserModel,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<typeof User>(getModelToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const result = await service.create(mockCreateUserDto);
      expect(userModel.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual({ id: 'c3333333-3333-3333-3333-333333333333', ...mockCreateUserDto });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const result = await service.findAll();
      expect(userModel.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUserList);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const aliceId = 'a1111111-1111-1111-1111-111111111111';
      const result = await service.findOne(aliceId);
      expect(userModel.findByPk).toHaveBeenCalledWith(aliceId, {
        attributes: { exclude: ['password'], include: ['role'] },
      });
      expect(result).toEqual(mockUserList[0]);
    });

    it('should throw NotFoundException if user not found', async () => {
      const missingId = '99999999-9999-9999-9999-999999999999';
      jest.spyOn(userModel, 'findByPk').mockResolvedValueOnce(null);
      await expect(service.findOne(missingId)).rejects.toThrow(`User with ID ${missingId} not found`);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const result = await service.findByEmail('alice@example.com');
      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' },
        attributes: { exclude: ['password'], include: ['role'] },
      });
      expect(result).toEqual(mockUserList[0]);
    });

    it('should return null if email not found', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);
      const result = await service.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });
});
