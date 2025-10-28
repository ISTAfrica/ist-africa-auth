import { SequelizeModuleOptions } from '@nestjs/sequelize';

export const databaseConfig = (): SequelizeModuleOptions => {
  const isTest = process.env.NODE_ENV === 'test';

  return {
    dialect: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? (isTest ? 'test_db' : 'IAA'),
    autoLoadModels: true,
    synchronize: !isTest, // Disable sync in tests
    logging: false,
    // Reduce retries in test environment
    retry: {
      max: isTest ? 0 : 3,
    },
  };
};
