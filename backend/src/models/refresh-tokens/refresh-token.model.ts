// import {
//   Table,
//   Column,
//   Model,
//   DataType,
//   // Make sure you have other necessary imports like ForeignKey if you use it
// } from 'sequelize-typescript';

// @Table({
//   tableName: 'refresh_tokens',
//   timestamps: true, // This automatically handles createdAt and updatedAt
// })
// export class RefreshToken extends Model {
//   @Column({
//     type: DataType.INTEGER,
//     primaryKey: true,
//     autoIncrement: true,
//   })
//   id: number;

//   @Column({
//     type: DataType.STRING, // Or DataType.TEXT if the token is very long
//     allowNull: false,
//     unique: true,
//   })
//   hashedToken: string;

//   @Column({
//     type: DataType.INTEGER,
//     allowNull: false,
//   })
//   userId: number;

//   @Column({
//     type: DataType.BOOLEAN,
//     allowNull: false,
//     defaultValue: false,
//   })
//   revoked: boolean;

//   // --- THIS IS THE MISSING PIECE ---
//   // You must add this column definition to your model file.
//   @Column({
//     type: DataType.DATE,
//     allowNull: false,
//     field: 'expiresAt', // Explicitly map to the database column name
//   })
//   expiresAt: Date;
//   // --- END OF THE FIX ---
// }