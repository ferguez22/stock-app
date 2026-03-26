// Refleja la tabla 'transactions' de MariaDB
export interface ITransaction {
  id?: number;                          // AUTO_INCREMENT
  product_id: number;                   // FK a la tabla products
  user_id: number;                      // FK a la tabla users
  type: 'IN' | 'OUT' | 'ADJUSTMENT';   // ENUM en MariaDB
  quantity: number;                     // Cantidad de unidades movidas
  notes?: string;                       // Notas opcionales
  created_at?: string;                  // Fecha de la transacción
  updated_at?: string;                  // Última actualización

  // Datos populados: cuando la API hace JOIN con otras tablas
  // y devuelve la info completa del producto y usuario
  product?: IProduct;
  user?: IUser;
}

// Para importar las interfaces relacionadas
import { IProduct } from './iproduct.interface';
import { IUser } from './iuser.interface';