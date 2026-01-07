import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
} from 'sequelize-typescript';

@Table({
  tableName: 'clients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class Client extends Model {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare id: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare client_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare client_secret: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare redirect_uri: string;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.STRING))
  declare allowed_origins: string[];

  @Default('active')
  @AllowNull(false)
  @Column(DataType.STRING)
  declare status: 'active' | 'inactive';
}
