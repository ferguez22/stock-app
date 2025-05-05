
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITransaction } from '../interfaces/itransaction.interface';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'https://api-stock-app.onrender.com/api/transactions';
  
  constructor(private http: HttpClient) {}
  
  getAll(): Observable<ITransaction[]> {
    return this.http.get<ITransaction[]>(this.apiUrl);
  }
  
  create(transaction: ITransaction): Observable<ITransaction> {
    return this.http.post<ITransaction>(this.apiUrl, transaction);
  }
}