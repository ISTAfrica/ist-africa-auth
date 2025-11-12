import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { EmailService } from '../../email/email.service';
import { CreateUserDto } from './dto/create-user.dto';

// Mock User data
const mockUserList = [
  { id: 1, name: 'Alice', email: 'alice@example.com', password: 'hashed1', role: 'user', isActive: true },
  { id: 2, name: 'Bob', email: 'bob@example.com', password: 'hashed2', role: 'user', isActive: true },
];

const mockCreateUserDto: CreateUserDto = {
  name: 'Charlie',
  email: 'charlie@example.com',
  password: 'testpassword123',
  role: 'user',
};

// Mocked Sequelize model
const mockUserModel = {
  create: jest.fn().mockResolvedValue({ id: 3, ...mockCreateUserDto }),
  findAll: jest.fn().mockResolvedValue(mockUserList),
  findByPk: jest.fn((id: number) =>
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
      expect(result).toEqual({ id: 3, ...mockCreateUserDto });
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
      const result = await service.findOne(1);
      expect(userModel.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'], include: ['role'] },
      });
      expect(result).toEqual(mockUserList[0]);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userModel, 'findByPk').mockResolvedValueOnce(null);
      await expect(service.findOne(999)).rejects.toThrow('User with ID 999 not found');
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
