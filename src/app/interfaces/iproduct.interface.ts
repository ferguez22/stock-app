// Refleja la tabla 'products' de MariaDB
export interface IProduct {
  id?: number;              // AUTO_INCREMENT con MariaDB
  category_id?: number;     // FK a la tabla categories
  brand: string;
  item: string;
  description?: string;
  status: 'BUENO' | 'REGULAR' | 'MALO' | 'BAJA';
  stock: number;
  min_stock?: number;
  price?: number;
  code: string;
  aisle?: string;
  shelf?: string;
  side?: string;
  category_name?: string;   // Viene del JOIN con categories (no está en la tabla, lo añade la API OJOOO)
  created_at?: string;      // MariaDB devuelve timestamps como string...
  updated_at?: string;
}

// Respuesta del endpoint /products/product-status
// Describe el estado de inventario de cada producto
export interface IProductStatus {
  id: number;               // ID del producto
  item: string;             // Nombre del producto
  code: string;             // Código de barras
  stock: number;            // Stock registrado en la tabla products
  in_stock: number;         // Unidades actualmente en almacén (calculado desde transacciones)
  out_stock: number;        // Unidades fuera de almacén (calculado desde transacciones)
  total: number;            // Total general
}