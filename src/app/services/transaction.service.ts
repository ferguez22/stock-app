import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ITransaction } from '../interfaces/itransaction.interface';
import { IApiResponse } from '../interfaces/iresponse.interface';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
  
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ITransaction[]> {
  return this.http.get<IApiResponse<ITransaction[]>>(this.apiUrl).pipe(
    tap(response => console.log('Respuesta de API:', response)),
    map(response => {
      if (!response.success || !response.data) return [];
      return response.data;
    }),
    catchError(error => {
      console.error('Error en TransactionService.getAll:', error);
      return of([]);
    })
  );
}

  create(transaction: ITransaction): Observable<any> {
  return this.http.post<any>(this.apiUrl, transaction).pipe(
    map(response => {
      if (!response.success) {
        throw new Error(response?.message || 'Error al crear la transacción');
      }
      return response;
    }),
    catchError(error => {
      console.error('Error en TransactionService.create:', error);
      return throwError(() => error);
    })
  );
}

  getUserOutProducts(userId: number | string): Observable<any[]> {
    return this.http.get<IApiResponse<any[]>>(`${this.apiUrl}/user/${userId}/out`).pipe(
      map(response => response.success && response.data ? response.data : []),
      catchError(() => of([]))
    );
  }

  getOthersOutProducts(): Observable<any[]> {
    return this.http.get<IApiResponse<any[]>>(`${this.apiUrl}/others/out`).pipe(
      map(response => response.success && response.data ? response.data : []),
      catchError(() => of([]))
    );
  }
}