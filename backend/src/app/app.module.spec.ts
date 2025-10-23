import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from '../models/users/users.module';

describe('AppModule', () => {
  let appModule: TestingModule;

  beforeEach(async function (this: void) {
    const moduleBuilder = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(ConfigModule)
      .useModule(
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ TEST_VAR: 'mocked' })],
        }),
      )
      .overrideModule(SequelizeModule)
      .useModule(
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        }),
      )
      .compile();

    appModule = moduleBuilder;
  });

  it('should be defined and compile successfully with mocked dependencies', function (this: void) {
    expect(appModule).toBeDefined();
  });

  it('should include the UsersModule', function (this: void) {
    const hasUsersModule = appModule.get(UsersModule);
    expect(hasUsersModule).toBeDefined();
  });

  afterAll(async function (this: void) {
    if (appModule) {
      await appModule.close();
    }
  });
});
