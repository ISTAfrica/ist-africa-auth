import { Test, TestingModule } from '@nestjs/testing'; 
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

// Mock email service
const mockEmailService = {
  sendAccountDisabledEmail: jest.fn(),
  sendAccountReactivatedEmail: jest.fn(),
};

// Mock user data
const mockUserInstance = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedpassword',
  toJSON: () => ({ id: 1, email: 'test@example.com', name: 'Test User' }),
};

const mockUserArray = [mockUserInstance.toJSON()];

const mockCreateUserDto: CreateUserDto = {
  email: 'new@example.com',
  name: 'New User',
  password: 'securepassword',
  role: 'user',
};

const mockUserModel = {
  create: jest.fn().mockResolvedValue(mockUserInstance),
  findAll: jest.fn().mockResolvedValue(mockUserArray),
  findByPk: jest.fn().mockResolvedValue(mockUserInstance),
  findOne: jest.fn().mockResolvedValue(mockUserInstance),
};

describe('UsersService', () => {
  let service: UsersService;
  let model: typeof User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User),
          useValue: mockUserModel,
        },
        {
          provide: 'EmailService',
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<typeof User>(getModelToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call userModel.create with correct DTO data and return the user', async () => {
      await service.create(mockCreateUserDto);
      expect(model.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(model.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should call findAll and exclude the password attribute', async () => {
      const result = await service.findAll();
      expect(model.findAll).toHaveBeenCalledWith({
        attributes: { exclude: ['password'] },
      });
      expect(result).toEqual(mockUserArray);
    });
  });

  describe('findOne', () => {
    it('should return a user when a valid ID is passed', async () => {
      const result = await service.findOne(1);
      expect(model.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] },
      });
      expect(result).toEqual(mockUserInstance);
    });

    it('should call findOne with the correct email where clause', async () => {
      const testEmail = 'test@example.com';
      await service.findByEmail(testEmail);
      expect(model.findOne).toHaveBeenCalledWith({
        where: { email: testEmail },
      });
    });

    it('should return null if user is not found by email', async () => {
      mockUserModel.findOne.mockResolvedValueOnce(null);
      const result = await service.findByEmail('nonexistent@test.com');
      expect(result).toBeNull();
    });
  });
});
