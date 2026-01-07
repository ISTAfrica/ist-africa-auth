import { SequelizeModuleOptions } from '@nestjs/sequelize';

export const sequelizeConfig: SequelizeModuleOptions = {
  dialect: 'postgres',
  host: '127.0.0.1',
  port: 5433,
  username: 'postgres',
  password: 'mypassword',
  database: 'IAA',
  models: [__dirname + '/../**/*.entity{.ts,.js}'],
  autoLoadModels: true,
  synchronize: false,
  logging: false,
};
