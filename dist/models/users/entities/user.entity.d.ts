import { Model } from 'sequelize-typescript';
export declare class User extends Model {
    id: number;
    email: string;
    name: string;
    password: string;
    isActive: boolean;
}
