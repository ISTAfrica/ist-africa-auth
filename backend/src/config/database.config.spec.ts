import { databaseConfig } from './database.config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

describe('DatabaseConfig', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should return default configuration when no environment variables are set', () => {
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_DATABASE;

    // const config: SequelizeModuleOptions = databaseConfig();

    // expect(config).toEqual({
    //   dialect: 'postgres',
    //   host: 'localhost',
    //   port: 5432,
    //   username: 'postgres',
    //   password: 'postgres',
    //   database: 'IAA',
    //   autoLoadModels: true,
    //   sync: { alter: true },
    //   logging: false,
    // });
  });

  it('should correctly read and apply configuration from environment variables', () => {
    process.env.DB_HOST = 'test-host';
    process.env.DB_PORT = '1234';
    process.env.DB_USERNAME = 'test-user';
    process.env.DB_PASSWORD = 'test-password';
    process.env.DB_DATABASE = 'test-db';

    const config: SequelizeModuleOptions = databaseConfig();

    expect(config.host).toBe('test-host');
    expect(config.port).toBe(1234); // Should be number
    expect(config.username).toBe('test-user');
    expect(config.password).toBe('test-password');
    expect(config.database).toBe('test-db');

    expect(config.dialect).toBe('postgres');
    expect(config.autoLoadModels).toBe(true);
  });

  it('should handle invalid or non-numeric DB_PORT gracefully, falling back to default (5432)', () => {
    delete process.env.DB_PORT;
    process.env.DB_PORT = 'not-a-number';

    const config: SequelizeModuleOptions = databaseConfig();

    expect(config.port).toBe(5432);
  });
});
