import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { IUser } from '../interfaces/iuser.interface';
import { IAuthResponse, IApiResponse } from '../interfaces/iresponse.interface';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
  
export class AuthService {
  private authUrl = `${environment.apiUrl}/users`;
  private usersUrl = `${environment.apiUrl}/users`;
  private readonly USER_ID_KEY = 'user_id';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {}

  // --- AUTENTICACIÓN ---

  login(credentials: { email: string, password: string }): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.authUrl}/login`, credentials).pipe(
      tap(response => {
        this.tokenService.setToken(response.token);
        const userId = this.extractIdFromToken(response.token);
        if (userId) {
          localStorage.setItem(this.USER_ID_KEY, String(userId));
          // Fetcheamos el usuario y lo guardamos en localStorage
          this.getUserById(String(userId)).subscribe(user => {
            this.tokenService.setUser(JSON.stringify(user));
          });
        }
      })
    );
  }

  logout(): void {
    this.tokenService.clearSession();
    localStorage.removeItem(this.USER_ID_KEY);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.tokenService.getToken() !== null;
  }

  // --- GESTIÓN DE USUARIOS ---

  getUsers(): Observable<IUser[]> {
    return this.http.get<IApiResponse<IUser[]>>(this.usersUrl).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener usuarios');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error obteniendo usuarios:', error);
        return throwError(() => error);
      })
    );
  }

  getUserById(id: number | string): Observable<IUser> {
    return this.http.get<IApiResponse<IUser>>(`${this.usersUrl}/${id}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener el usuario');
        }
        return response.data;
      })
    );
  }

  createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Observable<any> {
    return this.http.post<IApiResponse<any>>(this.usersUrl, userData).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al crear usuario');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error creando usuario:', error);
        return throwError(() => error);
      })
    );
  }

  // --- UTILIDADES ---

  getCurrentUserId(): number | null {
    const id = localStorage.getItem(this.USER_ID_KEY);
    return id ? parseInt(id, 10) : null;
  }

  private extractIdFromToken(token: string): number | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload.usuario_id || null;
    } catch (error) {
      console.error('Error extrayendo ID del token:', error);
      return null;
    }
  }
}