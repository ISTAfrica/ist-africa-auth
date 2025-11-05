// import { Sequelize } from 'sequelize-typescript';
// import { User } from '../models/users/entities/user.entity';
// import { configService } from '../config/config.service';

// const sequelize = new Sequelize({
//   dialect: 'postgres',
//   host: configService.get('DB_HOST'),
//   port: configService.getNumber('DB_PORT'),
//   username: configService.get('DB_USERNAME'),
//   password: configService.get('DB_PASSWORD'),
//   database: configService.get('DB_DATABASE'),
//   models: [User],
// });

// (async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('Database connected!');
//     await sequelize.sync({ alter: true }); // will add missing columns like membershipStatus
//     console.log('Database synced!');
//   } catch (err) {
//     console.error('DB connection error:', err);
//   } finally {
//     await sequelize.close();
//   }
// })();
