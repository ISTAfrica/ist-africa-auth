// import { Test, TestingModule } from '@nestjs/testing';
// import { AppModule } from './app.module';
// import { ConfigModule } from '@nestjs/config';
// import { SequelizeModule } from '@nestjs/sequelize';
// import { UsersModule } from '../models/users/users.module';

// describe('AppModule', () => {
//   let appModule: TestingModule;

//   beforeEach(async () => {
//     const moduleBuilder = await Test.createTestingModule({
//       imports: [AppModule],
//     })
//       .overrideModule(ConfigModule)
//       .useModule(
//         ConfigModule.forRoot({
//           isGlobal: true,
//           ignoreEnvFile: true,
//           load: [() => ({ TEST_VAR: 'mocked' })],
//         }),
//       )
//       .overrideModule(SequelizeModule)
//       .useModule(
//         SequelizeModule.forRoot({
//           dialect: 'sqlite',
//           storage: ':memory:',
//         }),
//       )

//       .compile();

//     appModule = moduleBuilder;
//   });
//   it('should be defined and compile successfully with mocked dependencies', () => {
//     expect(appModule).toBeDefined();
//   });
//   it('should include the UsersModule', () => {
//     const hasUsersModule = appModule.get(UsersModule);
//     expect(hasUsersModule).toBeDefined();
//   });
//   afterAll(async () => {
//     await appModule.close();
//   });
// });
