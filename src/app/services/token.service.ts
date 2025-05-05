import { Injectable } from '@angular/core';
import { IUser } from '../interfaces/iuser.interface';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  constructor() {}

  setToken(token: string | undefined): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setUser(userString: string): void {
    try {
      localStorage.setItem(this.USER_KEY, userString);
    } catch (e) {
      console.error('Error guardando usuario en localStorage:', e);
    }
  }

  getUser(): IUser | null {
    try {
      const userString = localStorage.getItem(this.USER_KEY);
      if (!userString) return null;
      
      const user = JSON.parse(userString);
      return user;
    } catch (e) {
      console.error('Error recuperando usuario de localStorage:', e);
      return null;
    }
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}