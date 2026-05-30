import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ITransaction, ITransactionCreate } from '../interfaces/itransaction.interface';
import { IApiResponse } from '../interfaces/iresponse.interface';
import { tap } from 'rxjs/operators';

interface TransactionResponse {
  message: string;
  transactions?: ITransaction[];
}

@Injectable({
  providedIn: 'root'
})
  
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ITransaction[]> {
    return this.http.get<TransactionResponse>(this.apiUrl).pipe(
      tap(response => console.log('Respuesta de API:', response)),
      map(response => response?.transactions ?? []),
      catchError(error => {
        console.error('Error en TransactionService.getAll:', error);
        return of([]);
      })
    );
  }

  create(transaction: ITransactionCreate): Observable<ITransaction> {
    return this.http.post<any>(this.apiUrl, transaction).pipe(
      map(response => {
        if (response?.transaction) return response.transaction;
        throw new Error(response?.message || 'Error al crear la transacción');
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