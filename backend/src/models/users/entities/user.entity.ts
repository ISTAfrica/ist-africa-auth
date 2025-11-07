import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isVerified: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare otp: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare otpExpiresAt: Date | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  declare verificationToken: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare avatarUrl: string | null;

  @Column({
    type: DataType.ENUM('ist_member', 'ext_member'),
    allowNull: false,
    defaultValue: 'ext_member',
  })
  declare membershipStatus: 'ist_member' | 'ext_member';

  @Column({
    type: DataType.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user',
  })
  declare role: 'user' | 'admin';
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isDefaultAdmin: boolean;
}
