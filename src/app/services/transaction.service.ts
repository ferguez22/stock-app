import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ITransaction } from '../interfaces/itransaction.interface';
import { IApiResponse } from '../interfaces/iresponse.interface';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ITransaction[]> {
    return this.http.get<IApiResponse<ITransaction[]>>(this.apiUrl).pipe(
      map(response => {
        if (!response.success || !response.data) {
          return [];
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en TransactionService.getAll:', error);
        return of([]);
      })
    );
  }

  create(transaction: {
    product_id: number;
    user_id: number;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    notes?: string;
  }): Observable<ITransaction> {
    return this.http.post<IApiResponse<ITransaction>>(this.apiUrl, transaction).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al crear la transacción');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error en TransactionService.create:', error);
        return throwError(() => error);
      })
    );
  }

  getUserOutProducts(userId: number): Observable<any[]> {
    return this.http.get<IApiResponse<any[]>>(`${this.apiUrl}/user/${userId}/out`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          return [];
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error obteniendo productos fuera de almacén:', error);
        return of([]);
      })
    );
  }

  getOthersOutProducts(): Observable<any[]> {
    return this.http.get<IApiResponse<any[]>>(`${this.apiUrl}/others/out`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          return [];
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error obteniendo productos de otros usuarios:', error);
        return of([]);
      })
    );
  }
}