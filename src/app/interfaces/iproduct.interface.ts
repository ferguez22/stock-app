export interface IProduct {
  _id?: string;
  type: string;
  item: string;
  stock: number;      // Stock total en almacén
  outStock?: number;  // Stock fuera del almacén
  code: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz para la respuesta del estado del producto
export interface IProductStatus {
  inStock: number;
  outStock: number;
  totalStock: number;
}