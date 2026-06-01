import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { IProduct } from '../interfaces/iproduct.interface';
import { IApiResponse } from '../interfaces/iresponse.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<IProduct[]> {
    return this.http.get<IApiResponse<IProduct[]>>(this.apiUrl).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener productos');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en ProductService.getAll:', error);
        return throwError(() => error);
      })
    );
  }

  getById(id: number): Observable<IProduct> {
    return this.http.get<IApiResponse<IProduct>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener el producto');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en ProductService.getById:', error);
        return throwError(() => error);
      })
    );
  }

  getInventoryStatus(): Observable<any[]> {
    return this.http.get<IApiResponse<any[]>>(`${this.apiUrl}/product-status`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener estado del inventario');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en getInventoryStatus:', error);
        return throwError(() => error);
      })
    );
  }

  create(product: Partial<IProduct>): Observable<IProduct> {
    return this.http.post<IApiResponse<IProduct>>(this.apiUrl, product).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al crear el producto');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en ProductService.create:', error);
        return throwError(() => error);
      })
    );
  }

  update(id: number, product: Partial<IProduct>): Observable<IProduct> {
    return this.http.put<IApiResponse<IProduct>>(`${this.apiUrl}/${id}`, product).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al actualizar el producto');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en ProductService.update:', error);
        return throwError(() => error);
      })
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete<IApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al eliminar el producto');
        }
        return response;
      }),
      catchError(error => {
        console.error('Error en ProductService.delete:', error);
        return throwError(() => error);
      })
    );
  }

  findByBarcode(barcode: string): Observable<IProduct> {
    return this.http.get<IApiResponse<IProduct>>(`${this.apiUrl}/barcode/${barcode}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'No se encontró el producto');
        }
        return response.data;
      }),
      catchError(err => {
        console.error('Error buscando producto por código de barras:', err);
        return throwError(() => new Error('No se encontró el producto'));
      })
    );
  }
}