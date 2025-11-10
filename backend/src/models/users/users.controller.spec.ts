import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

// Mock data
const mockUserList = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
];

const mockCreateUserDto: CreateUserDto = {
  name: 'Charlie',
  email: 'charlie@example.com',
  password: 'testpassword123',
  role: 'user',
};

const mockCreatedUser = { id: 3, ...mockCreateUserDto };

// Mock UsersService
class MockUsersService {
  findAll() {
    return Promise.resolve(mockUserList);
  }

  findOne(id: number) {
    return Promise.resolve(mockUserList.find((u) => u.id === id) || null);
  }

  create(dto: CreateUserDto) {
    return Promise.resolve(mockCreatedUser);
  }
}

describe('UsersController', () => {
  let controller: UsersController;
  let service: MockUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useClass: MockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService) as unknown as MockUsersService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call usersService.create and return the new user object', async () => {
      const result = await controller.create(mockCreateUserDto);
      expect(service.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('findAll', () => {
    it('should call usersService.findAll and return a list of users', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUserList);
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOne with the parsed ID and return a single user', async () => {
      const idToFind = '1';
      const result = await controller.findOne(idToFind);
      expect(service.findOne).toHaveBeenCalledWith(+idToFind);
      expect(result).toEqual(mockUserList.find((u) => u.id === 1));
    });

    it('should return null if the user is not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(null);
      const result = await controller.findOne('999');
      expect(service.findOne).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });
});
