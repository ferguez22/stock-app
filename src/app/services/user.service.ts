import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IUser } from '../interfaces/iuser.interface';
import { IAuthResponse, IApiResponse } from '../interfaces/iresponse.interface';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://api-stock-app.onrender.com/api/users';
  private readonly USER_ID_KEY = 'user_id';
  
  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {}

  register(user: IUser): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.apiUrl}/register`, user);
  }

  login(credentials: { email: string, password: string }): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          // Guardar token
          this.tokenService.setToken(response.token);
          
          // Extraer el ID una única vez durante el login
          const userId = this.extractIdFromToken(response.token);
          if (userId) {
            // Guardar el ID para uso futuro directo
            localStorage.setItem(this.USER_ID_KEY, userId);
          }
          
          // Si el API devuelve el usuario directamente, guardarlo
          if (response.user) {
            this.tokenService.setUser(JSON.stringify(response.user));
          }
        })
      );
  }

  logout(): void {
    this.tokenService.removeToken();
    localStorage.removeItem(this.USER_ID_KEY);
    this.router.navigate(['/login']);
  }
  
  isLoggedIn(): boolean {
    return this.tokenService.getToken() !== null;
  }

  getUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.apiUrl);
  }

  // Método directo para obtener usuario por ID
  getUserById(id: string): Observable<IUser> {
    return this.http.get<IApiResponse<IUser>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener el usuario');
        }
        return response.data;
      })
    );
  }
  
  // Método simple para obtener el ID del usuario actual
  getCurrentUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }
  
  // Este método se usa SOLO UNA VEZ durante el login
  private extractIdFromToken(token: string): string | null {
    if (!token) return null;
    
    try {
      // Decodificar el token para obtener el ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.usuario_id || null;
    } catch (error) {
      console.error('Error extrayendo ID del token:', error);
      return null;
    }
  }
}