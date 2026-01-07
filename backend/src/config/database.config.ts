import { SequelizeModuleOptions } from '@nestjs/sequelize';

export const databaseConfig = (): SequelizeModuleOptions => ({
  dialect: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'iaa_ndp2',
  autoLoadModels: true,
  sync: { force: false },
  logging: false,
  timezone: '+00:00',
  dialectOptions: {
    useUTC: true,

    ssl: process.env.DB_HOST !== 'localhost' ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  },
});