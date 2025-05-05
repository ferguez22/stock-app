export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  createdAt?: Date;
  updatedAt?: Date;
}