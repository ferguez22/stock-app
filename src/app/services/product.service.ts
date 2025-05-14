import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { IProduct } from '../interfaces/iproduct.interface';
import { IApiResponse } from '../interfaces/iresponse.interface';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://api-stock-app.onrender.com/api/products';
  
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
  
  getById(id: string): Observable<IProduct> {
    return this.http.get<IProduct>(`${this.apiUrl}/${id}`);
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
  
  create(product: IProduct): Observable<IProduct> {
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
  
  update(id: string, product: IProduct): Observable<IProduct> {
    return this.http.put<IProduct>(`${this.apiUrl}/${id}`, product);
  }
  
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
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