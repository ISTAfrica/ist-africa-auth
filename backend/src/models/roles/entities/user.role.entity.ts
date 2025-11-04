import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'user_roles' })
export class UserRole extends Model<UserRole> {
  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;
}
