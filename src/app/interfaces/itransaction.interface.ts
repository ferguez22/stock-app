import { IProduct } from './iproduct.interface';
import { IUser } from './iuser.interface';

export interface ITransactionCreate {
  product_id: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  notes?: string;
}

export interface ITransaction {
  id?: number;
  product_id?: number;
  user_id?: number;
  product?: IProduct;
  user?: IUser;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  notes?: string;
  createdAt?: string;
  created_at?: string;
}