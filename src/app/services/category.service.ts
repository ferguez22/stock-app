import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ICategory } from '../interfaces/icategory.interface';
import { IApiResponse } from '../interfaces/iresponse.interface';

@Injectable({
  providedIn: 'root'
})
    
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ICategory[]> {
    return this.http.get<IApiResponse<ICategory[]>>(this.apiUrl).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener categorías');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en CategoryService.getAll:', error);
        return throwError(() => error);
      })
    );
  }

  getById(id: number): Observable<ICategory> {
    return this.http.get<IApiResponse<ICategory>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener la categoría');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en CategoryService.getById:', error);
        return throwError(() => error);
      })
    );
  }

  create(category: Partial<ICategory>): Observable<ICategory> {
    return this.http.post<IApiResponse<ICategory>>(this.apiUrl, category).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al crear la categoría');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en CategoryService.create:', error);
        return throwError(() => error);
      })
    );
  }

  update(id: number, category: Partial<ICategory>): Observable<ICategory> {
    return this.http.put<IApiResponse<ICategory>>(`${this.apiUrl}/${id}`, category).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al actualizar la categoría');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en CategoryService.update:', error);
        return throwError(() => error);
      })
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete<IApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al eliminar la categoría');
        }
        return response;
      }),
      catchError(error => {
        console.error('Error en CategoryService.delete:', error);
        return throwError(() => error);
      })
    );
  }
}