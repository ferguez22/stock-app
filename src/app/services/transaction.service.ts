import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { ITransaction } from '../interfaces/itransaction.interface';
import { IApiResponse } from '../interfaces/iresponse.interface';
import { map, tap } from 'rxjs/operators';

interface TransactionResponse {
  message: string;
  transactions?: ITransaction[];
}

@Injectable({
  providedIn: 'root'
})
  
export class TransactionService {
  private apiUrl = 'https://api-stock-app.onrender.com/api/transactions';
  
  constructor(private http: HttpClient) {}
  
  getAll(): Observable<ITransaction[]> {
    return this.http.get<TransactionResponse>(this.apiUrl).pipe(
      tap(response => console.log('Respuesta de API:', response)), // Para depuración
      map(response => {
        // Adaptamos la respuesta de la API a nuestra estructura esperada
        if (response && response.transactions) {
          return response.transactions;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error en TransactionService.getAll:', error);
        return of([]); // Devolver array vacío en caso de error
      })
    );
  }
  
  create(transaction: ITransaction): Observable<ITransaction> {
    return this.http.post<any>(this.apiUrl, transaction).pipe(
      map(response => {
        // Adaptamos también la respuesta del create
        if (response && response.transaction) {
          return response.transaction;
        }
        throw new Error(response?.message || 'Error al crear la transacción');
      }),
      catchError(error => {
        console.error('Error en TransactionService.create:', error);
        return throwError(() => error);
      })
    );
  }

    // Asumiendo que ya tienes imports de HttpClient, Observable, etc.

  createTransaction(transaction: {
    productId: string;
    type: 'IN' | 'OUT';
    userId: string;
    quantity: number;
  }): Observable<ITransaction> {
    return this.http.post<ITransaction>(this.apiUrl, transaction).pipe(
      catchError(error => {
        console.error('Error creando transacción:', error);
        return throwError(() => new Error('Error al registrar la transacción'));
      })
    );
  }

}