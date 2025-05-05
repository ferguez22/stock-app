export interface IProduct {
  _id?: string;
  type: string;
  item: string;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}