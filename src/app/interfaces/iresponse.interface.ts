// Respuesta genérica de la API
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Respuesta específica para el login
export interface IAuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    is_active: boolean;
  };
}