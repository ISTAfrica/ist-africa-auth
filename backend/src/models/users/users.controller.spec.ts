import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

const mockUserList = [
  {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    password: 'hashedpassword1',
  },
  { id: 2, name: 'Bob', email: 'bob@example.com', password: 'hashedpassword2' },
];

const mockCreateUserDto: CreateUserDto = {
  name: 'Charlie',
  email: 'charlie@example.com',
  password: 'testpassword123',
};

const mockCreatedUser = {
  id: 3,
  ...mockCreateUserDto,
};

class MockUsersService {
  findAll(this: void) {
    return Promise.resolve(mockUserList);
  }

  findOne(this: void, id: number) {
    return Promise.resolve(mockUserList.find((u) => u.id === id) || null);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(this: void, dto: CreateUserDto) {
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
    service = module.get(UsersService);

    jest.spyOn(service, 'findAll').mockResolvedValue(mockUserList);
    jest.spyOn(service, 'findOne').mockImplementation((id: number) => {
      return Promise.resolve(mockUserList.find((u) => u.id === id) || null);
    });
    jest.spyOn(service, 'create').mockResolvedValue(mockCreatedUser);
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

    it('should return null or undefined if the user is not found', async () => {
      const nonExistentId = '999';

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(null);

      const result = await controller.findOne(nonExistentId);

      expect(service.findOne).toHaveBeenCalledWith(+nonExistentId);
      expect(result).toBeNull();
    });
  });
});
