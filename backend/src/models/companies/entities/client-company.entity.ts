import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Client } from '../../clients/entities/client.entity';
import { Company } from './company.entity';

@Table({
  tableName: 'client_companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class ClientCompany extends Model {
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

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare companyId: string;

  @BelongsTo(() => Company, { foreignKey: 'companyId', as: 'company' })
  company: Company;
}
