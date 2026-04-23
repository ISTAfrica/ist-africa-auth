import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';
import { Company } from './company.entity';

@Table({
  tableName: 'user_companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class UserCompany extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' })
  user: User;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare companyId: string;

  @BelongsTo(() => Company, { foreignKey: 'companyId', as: 'company' })
  company: Company;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare assignedBy: string | null;

  @BelongsTo(() => User, { foreignKey: 'assignedBy', as: 'assigner' })
  assigner: User | null;
}
