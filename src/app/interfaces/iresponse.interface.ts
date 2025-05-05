import { IUser } from './iuser.interface';

// Respuesta genérica de la API
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Respuesta específica para autenticación
export interface IAuthResponse {
  message?: string;
  token: string;
  user?: IUser;
}