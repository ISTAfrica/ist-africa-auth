import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { UserRole } from '../../roles/entities/user.role.entity';
import { Optional } from 'sequelize';

// Define attributes
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  roleId?: number;
  otp?: string | null;
  otpExpiresAt?: Date | null;
  isVerified?: boolean;
  verificationToken?: string | null;
  avatarUrl?: string | null;
}

// Define creation attributes (fields optional on create)
export type UserCreationAttributes = Optional<
  UserAttributes,
  | 'id'
  | 'roleId'
  | 'otp'
  | 'otpExpiresAt'
  | 'isVerified'
  | 'verificationToken'
  | 'avatarUrl'
>;

@Table({ tableName: 'users', timestamps: true })
export class User extends Model<UserAttributes, UserCreationAttributes> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @ForeignKey(() => UserRole)
  @Column({ type: DataType.INTEGER })
  declare roleId: number;

  @BelongsTo(() => UserRole)
  declare role: UserRole;

  @Column({ type: DataType.STRING, allowNull: true })
  declare otp: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare otpExpiresAt: Date | null;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  declare isVerified: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  declare verificationToken: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare avatarUrl: string | null;
}
