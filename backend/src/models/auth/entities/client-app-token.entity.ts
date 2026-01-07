import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';

@Table({
  tableName: 'client_app_tokens',
  timestamps: true,
})
export class ClientAppToken extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare userId: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare clientId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare hashedClientSecret: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare accessToken: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare refreshToken: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare accessTokenIssuedAt: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare refreshTokenIssuedAt: Date;
}


