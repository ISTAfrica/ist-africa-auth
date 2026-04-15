import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

const ALICE_ID = 'a1111111-1111-1111-1111-111111111111';
const BOB_ID = 'b2222222-2222-2222-2222-222222222222';
const CHARLIE_ID = 'c3333333-3333-3333-3333-333333333333';

const mockUserList = [
  {
    id: ALICE_ID,
    name: 'Alice',
    email: 'alice@example.com',
    password: 'hashedpassword1',
  },
  { id: BOB_ID, name: 'Bob', email: 'bob@example.com', password: 'hashedpassword2' },
];

const mockCreateUserDto: CreateUserDto = {
  name: 'Charlie',
  email: 'charlie@example.com',
  password: 'testpassword123',
  role: 'user',
};

const mockCreatedUser = {
  id: CHARLIE_ID,
  ...mockCreateUserDto,
};

const mockUsersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: typeof mockUsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockUsersService.findAll.mockResolvedValue(mockUserList);
    mockUsersService.findOne.mockImplementation((id: string) =>
      Promise.resolve(mockUserList.find((u) => u.id === id) || null),
    );
    mockUsersService.create.mockResolvedValue(mockCreatedUser);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService) as unknown as typeof mockUsersService;
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
    it('should call usersService.findOne with the ID and return a single user', async () => {
      const result = await controller.findOne(ALICE_ID);

      expect(service.findOne).toHaveBeenCalledWith(ALICE_ID);
      expect(result).toEqual(mockUserList.find((u) => u.id === ALICE_ID));
    });

    it('should return null or undefined if the user is not found', async () => {
      const nonExistentId = '99999999-9999-9999-9999-999999999999';

      service.findOne.mockResolvedValueOnce(null);

      const result = await controller.findOne(nonExistentId);

      expect(service.findOne).toHaveBeenCalledWith(nonExistentId);
      expect(result).toBeNull();
    });
  });
});