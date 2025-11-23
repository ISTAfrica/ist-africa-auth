import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';

@Table({
  tableName: 'authorization_codes',
  timestamps: false, 
})
export class AuthorizationCode extends Model {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
    allowNull: false,
  })
  declare code: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare clientId: string;

  @BelongsTo(() => Client)
  client: Client;
}