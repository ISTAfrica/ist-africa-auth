import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.entity';

@Table({
  tableName: 'blacklisted_tokens',
  timestamps: true,
})
export class BlacklistedToken extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    unique: true,
  })
  declare token: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Device or browser information',
  })
  declare deviceInfo: string | null;
}
