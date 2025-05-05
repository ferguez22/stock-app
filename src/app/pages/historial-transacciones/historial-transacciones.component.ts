import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';
import { ITransaction } from '../../interfaces/itransaction.interface';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-historial-transacciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-transacciones.component.html',
  styleUrl: './historial-transacciones.component.css'
})
export class HistorialTransaccionesComponent implements OnInit {
  transactions: ITransaction[] = [];
  filteredTransactions: ITransaction[] = [];
  isLoading = true;
  error = false;
  errorMessage = '';
  
  // Filtros
  filterType: 'ALL' | 'IN' | 'OUT' = 'ALL';
  searchTerm = '';
  userRole = 'user';

  constructor(
    private transactionService: TransactionService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadUserRole();
    this.loadTransactions();
  }

  private loadUserRole(): void {
    const cachedUser = this.tokenService.getUser();
    if (cachedUser) {
      this.userRole = cachedUser.role;
    }
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.error = false;
    
    this.transactionService.getAll()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          console.log('Transacciones cargadas:', this.transactions.length);
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos:', data);
          this.transactions = data;
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error al cargar transacciones:', err);
          this.error = true;
          this.errorMessage = 'No se pudieron cargar las transacciones. Por favor, inténtalo de nuevo más tarde.';
        }
      });
  }

  getTypeClass(type: string): string {
    return type === 'IN' ? 'bg-success' : 'bg-danger';
  }

  getTypeIcon(type: string): string {
    return type === 'IN' ? 'fa-arrow-down' : 'fa-arrow-up';
  }

  getTypeText(type: string): string {
    return type === 'IN' ? 'Entrada' : 'Salida';
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.transactions]; // Usar una copia para no modificar el original
    
    // Filtrar por tipo
    if (this.filterType !== 'ALL') {
      filtered = filtered.filter(t => t.type === this.filterType);
    }
    
    // Filtrar por término de búsqueda
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t => 
        (t.product?.item?.toLowerCase().includes(term)) || 
        (t.product?.type?.toLowerCase().includes(term)) ||
        (t.user?.name?.toLowerCase().includes(term))
      );
    }
    
    this.filteredTransactions = filtered;
    console.log('Transacciones filtradas:', this.filteredTransactions.length);
  }
}