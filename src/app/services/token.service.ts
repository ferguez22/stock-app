import { Injectable } from '@angular/core';
import { IUser } from '../interfaces/iuser.interface';

// NOTA DE SEGURIDAD: En un entorno de alta seguridad, el token JWT
// debería almacenarse en una cookie HttpOnly en vez de localStorage
// para prevenir ataques XSS. Se usa localStorage por simplicidad
// y porque Angular proporciona protección XSS integrada.

@Injectable({
  providedIn: 'root'
})
  
export class TokenService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // --- TOKEN ---

  setToken(token: string | undefined): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Verifica que el token no haya expirado
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  // --- USUARIO ---

  setUser(userString: string): void {
    try {
      const user = JSON.parse(userString);
      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      };

      localStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));
    } catch (e) {
      console.error('Error guardando usuario en localStorage:', e);
    }
  }

  getUser(): IUser | null {
    try {
      const userString = localStorage.getItem(this.USER_KEY);
      if (!userString) return null;
      return JSON.parse(userString);
    } catch (e) {
      console.error('Error recuperando usuario de localStorage:', e);
      return null;
    }
  }

  // --- LIMPIEZA ---

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}