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
  tableName: 'client_users',
  timestamps: true,
})
export class ClientUser extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare clientId: string;

  @BelongsTo(() => Client)
  client: Client;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' })
  user: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare assignedBy: string | null;

  @BelongsTo(() => User, { foreignKey: 'assignedBy', as: 'assigner' })
  assigner: User | null;
}
