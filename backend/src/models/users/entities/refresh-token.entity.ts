import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.entity';

@Table({
  tableName: 'refresh_tokens',
  timestamps: true,
})
export class RefreshToken extends Model {
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
  declare hashedToken: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare revoked: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare browser: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare os: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare deviceType: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare ipAddress: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastActiveAt: Date | null;
}
