import {
  Model,
  Table,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { User } from '../../../users/entities/user.entity';

// Define creation attributes interface
export interface PasswordResetTokenCreationAttributes {
  userId: number;
  token: string;
  expiresAt: Date;
}

@Table({
  tableName: 'password_reset_tokens',
  timestamps: true,
  underscored: true,
})
export class PasswordResetToken extends Model<
  PasswordResetToken,
  PasswordResetTokenCreationAttributes
> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  declare userId: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare token: string;

  @Column({
    type: 'TIMESTAMP WITHOUT TIME ZONE',
    allowNull: false,
    field: 'expires_at',
  })
  declare expiresAt: Date;

  @Column({
    type: 'TIMESTAMP WITHOUT TIME ZONE',
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  declare createdAt: Date;

  @Column({
    type: 'TIMESTAMP WITHOUT TIME ZONE',
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'updated_at',
  })
  declare updatedAt: Date;
}
