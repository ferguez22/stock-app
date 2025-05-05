export interface IProduct {
  _id?: string;
  type: string;
  item: string;
  stock: number;
  code: string;
  createdAt?: Date;
  updatedAt?: Date;
}