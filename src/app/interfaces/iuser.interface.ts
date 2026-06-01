export interface IUser {
  id?: number;              // AUTO_INCREMENT (antes era _id string)
  name: string;             // Nombre completo
  email: string;            // Email único
  password?: string;        // Solo se usa para enviar al crear/editar, NUNCA viene del servidor
  role: 'admin' | 'user';   // Rol del usuario
  is_active?: boolean;      // Soft delete: false = usuario desactivado (nuevo)
  last_login?: string;      // Última vez que inició sesión (nuevo)
  created_at?: string;      // Fecha de creación
  updated_at?: string;      // Última actualización
}