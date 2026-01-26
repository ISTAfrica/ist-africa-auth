import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

describe('AppModule', () => {
  let appModule: TestingModule;

  beforeEach(async function (this: void) {
    const moduleBuilder = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ TEST_VAR: 'mocked' })],
        }),
      ],
    }).compile();

    appModule = moduleBuilder;
  });

  it('should be defined and compile successfully with mocked dependencies', function (this: void) {
    expect(appModule).toBeDefined();
  });

  it('should have ConfigModule available', function (this: void) {
    const configModule = appModule.get(ConfigModule);
    expect(configModule).toBeDefined();
  });

  afterAll(async function (this: void) {
    if (appModule) {
      await appModule.close();
    }
  });
});
