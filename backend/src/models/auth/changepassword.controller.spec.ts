import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ChangePasswordController } from './changepassword.controller';
import { ChangePasswordService } from './changepassword.service';
import { ChangePasswordDto } from './dto/change-password.dto';

const mockChangePasswordDto: ChangePasswordDto = {
  currentPassword: 'OldPassword123',
  newPassword: 'NewPassword123',
  confirmPassword: 'NewPassword123',
};

const mockSuccessResponse = {
  message: 'Password changed successfully',
};

class MockChangePasswordService {
  changePassword(): Promise<typeof mockSuccessResponse> {
    return Promise.resolve(mockSuccessResponse);
  }
}

describe('ChangePasswordController', () => {
  let controller: ChangePasswordController;
  let service: MockChangePasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChangePasswordController],
      providers: [
        {
          provide: ChangePasswordService,
          useClass: MockChangePasswordService,
        },
      ],
    }).compile();

    controller = module.get<ChangePasswordController>(ChangePasswordController);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    service = module.get(ChangePasswordService) as MockChangePasswordService;

    jest
      .spyOn(service, 'changePassword')
      .mockResolvedValue(mockSuccessResponse);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('changePassword', () => {
    it('should call changePasswordService.changePassword with correct parameters and return success message', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockRequest = {
        user: {
          id: 1,
          user_type: 'user',
        },
      } as unknown as any;

      const result = await controller.changePassword(
        mockRequest,
        mockChangePasswordDto,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.changePassword).toHaveBeenCalledWith(
        1,
        mockChangePasswordDto.currentPassword,
        mockChangePasswordDto.newPassword,
        mockChangePasswordDto.confirmPassword,
      );
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should throw BadRequestException if user id is not provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockRequest = {
        user: undefined,
      } as unknown as any;

      await expect(
        controller.changePassword(mockRequest, mockChangePasswordDto),
      ).rejects.toThrow(
        new BadRequestException('User not found or unauthorized'),
      );
    });

    it('should throw BadRequestException if user id is null', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockRequest = {
        user: {
          id: null,
          user_type: 'user',
        },
      } as unknown as any;

      await expect(
        controller.changePassword(mockRequest, mockChangePasswordDto),
      ).rejects.toThrow(
        new BadRequestException('User not found or unauthorized'),
      );
    });

    it('should throw BadRequestException if user object is missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockRequest = {} as unknown as any;

      await expect(
        controller.changePassword(mockRequest, mockChangePasswordDto),
      ).rejects.toThrow(
        new BadRequestException('User not found or unauthorized'),
      );
    });

    it('should pass correct user id to service', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockRequest = {
        user: {
          id: 42,
          user_type: 'admin',
        },
      } as unknown as any;

      await controller.changePassword(mockRequest, mockChangePasswordDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.changePassword).toHaveBeenCalledWith(
        42,
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );
    });

    it('should handle service errors', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockRequest = {
        user: {
          id: 1,
          user_type: 'user',
        },
      } as unknown as any;

      const errorMessage = 'Current password is incorrect';
      (
        jest.spyOn(service, 'changePassword') as jest.SpyInstance
      ).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        controller.changePassword(mockRequest, mockChangePasswordDto),
      ).rejects.toThrow(errorMessage);
    });

    it('should pass all password fields correctly to service', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockRequest = {
        user: {
          id: 1,
          user_type: 'user',
        },
      } as unknown as any;

      const customDto: ChangePasswordDto = {
        currentPassword: 'Current123',
        newPassword: 'NewPass456',
        confirmPassword: 'NewPass456',
      };

      await controller.changePassword(mockRequest, customDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.changePassword).toHaveBeenCalledWith(
        1,
        'Current123',
        'NewPass456',
        'NewPass456',
      );
    });
  });
});
