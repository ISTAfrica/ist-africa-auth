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
    delete process.env.DB_NAME;

    const config: SequelizeModuleOptions = databaseConfig();

    expect(config).toEqual({
      dialect: 'postgres',
      host: 'dpg-d5drrhvgi27c73e3qoh0-a.oregon-postgres.render.com', 
      port: 5432,
      username: 'iaa_user', 
      password: 'RgG5LgB8E47bkvz4TceWyH0m0ehHi5PT',
      database: 'iaa_ndp2',
      autoLoadModels: true,
      sync: { force: false },
      logging: false,
      timezone: '+00:00',
      dialectOptions: {
        useUTC: true,
        ssl: { require: true, rejectUnauthorized: false }, 
      },
    });
  });

  it('should correctly read and apply configuration from environment variables', () => {
    process.env.DB_HOST = 'test-host';
    process.env.DB_PORT = '1234';
    process.env.DB_USERNAME = 'test-user';
    process.env.DB_PASSWORD = 'test-password';
    process.env.DB_NAME = 'test-db';

    const config: SequelizeModuleOptions = databaseConfig();

    expect(config.host).toBe('test-host');
    expect(config.port).toBe(1234); 
    expect(config.username).toBe('test-user');
    expect(config.password).toBe('test-password');
    expect(config.database).toBe('test-db');

    expect(config.dialect).toBe('postgres');
    expect(config.autoLoadModels).toBe(true);
    expect(config.dialectOptions).toEqual({ useUTC: true, ssl: { require: true, rejectUnauthorized: false } });
  });

  it('should handle invalid or non-numeric DB_PORT gracefully, falling back to default (5432)', () => {
    delete process.env.DB_PORT;
    process.env.DB_PORT = 'not-a-number';

    const config: SequelizeModuleOptions = databaseConfig();

    expect(config.port).toBe(5432);
  });
});
