import { SequelizeModuleOptions } from '@nestjs/sequelize';

export const databaseConfig = (): SequelizeModuleOptions => ({
  dialect: 'postgres',
  host: process.env.DB_HOST ?? 'dpg-d5drrhvgi27c73e3qoh0-a.oregon-postgres.render.com',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? 'iaa_user',
  password: process.env.DB_PASSWORD ?? 'RgG5LgB8E47bkvz4TceWyH0m0ehHi5PT',
  database: process.env.DB_NAME ?? 'iaa_ndp2',
  autoLoadModels: true,
  sync: { force: false }, 
  logging: false,
  timezone: '+00:00', 
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    useUTC: true,
  },
});
