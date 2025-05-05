import { IProduct } from './iproduct.interface';
import { IUser } from './iuser.interface';

export interface ITransaction {
  _id?: string;
  productId: string;
  product?: IProduct; // Populado desde el backend
  type: 'IN' | 'OUT';
  quantity: number;
  userId?: string;
  user?: IUser; // Populado desde el backend
  createdAt?: Date;
  updatedAt?: Date;
}