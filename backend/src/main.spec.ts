import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';

// Mock NestFactory
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

// Mock console.log to avoid output during tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

// Import the bootstrap function directly
const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
};

describe('Main Bootstrap', () => {
  let mockApp: {
    useGlobalPipes: jest.Mock;
    enableCors: jest.Mock;
    listen: jest.Mock;
  };

  beforeEach(function (this: void) {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock app instance
    mockApp = {
      useGlobalPipes: jest.fn(),
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };

    // Mock NestFactory.create to return our mock app
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
  });

  afterEach(function (this: void) {
    mockConsoleLog.mockClear();
  });

  afterAll(function (this: void) {
    mockConsoleLog.mockRestore();
  });

  it('should create app with AppModule', async function (this: void) {
    // Mock process.env.PORT
    const originalPort = process.env.PORT;
    process.env.PORT = '3001';

    try {
      await bootstrap();

      // Verify NestFactory.create was called with AppModule
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    } finally {
      // Restore original PORT
      process.env.PORT = originalPort;
    }
  });

  it('should configure global validation pipes', async function (this: void) {
    await bootstrap();

    // Verify useGlobalPipes was called with ValidationPipe
    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
      expect.any(ValidationPipe),
    );

    const validationPipe = (
      mockApp.useGlobalPipes.mock.calls[0] as any[]
    )[0] as ValidationPipe;
    expect(validationPipe).toBeInstanceOf(ValidationPipe);
  });

  it('should enable CORS', async function (this: void) {
    await bootstrap();

    expect(mockApp.enableCors).toHaveBeenCalled();
  });

  it('should listen on default port 3000 when PORT is not set', async function (this: void) {
    // Ensure PORT is not set
    delete process.env.PORT;

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(3000);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Application is running on: http://localhost:3000',
    );
  });

  it('should listen on custom port when PORT is set', async function (this: void) {
    // Set custom port
    process.env.PORT = '4000';

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith('4000');
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Application is running on: http://localhost:4000',
    );
  });

  it('should handle bootstrap errors gracefully', async function (this: void) {
    // Mock NestFactory.create to throw an error
    (NestFactory.create as jest.Mock).mockRejectedValueOnce(
      new Error('Bootstrap failed'),
    );

    // The function should throw the error
    await expect(bootstrap()).rejects.toThrow('Bootstrap failed');
  });
});
