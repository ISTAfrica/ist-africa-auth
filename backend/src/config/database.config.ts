import { SequelizeModuleOptions } from '@nestjs/sequelize';

export const databaseConfig = (): SequelizeModuleOptions => ({
  dialect: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'IAA',
  autoLoadModels: true,
  sync: { force: false }, // or `undefined` if you don't want auto-sync
  logging: false,
}); // ✅ Make sure this closing parenthesis and semicolon exist
