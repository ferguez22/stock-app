// Añadir la propiedad recentTransactions y cargarla en loadDashboardData

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { TransactionService } from '../../services/transaction.service';
import { IProduct } from '../../interfaces/iproduct.interface';
import { ITransaction } from '../../interfaces/itransaction.interface';
import { IUser } from '../../interfaces/iuser.interface';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  products: IProduct[] = [];
  recentProducts: IProduct[] = [];
  recentTransactions: ITransaction[] = []; // Añadir esta propiedad
  currentUser: IUser | null = null;
  isLoading = true;
  userError = false;
  error = false;
  totalProducts = 0;
  lowStockCount = 0;
  totalStockCount = 0;
  totalTransactions = 0;
  
  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private tokenService: TokenService,
    private transactionService: TransactionService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
  }
  
  loadUserData(): void {
    const cachedUser = this.tokenService.getUser();
    if (cachedUser) {
      this.currentUser = cachedUser;
    } else {
      const userId = this.authService.getCurrentUserId();
      if (userId) {
        this.authService.getUserById(userId).subscribe({
          next: (user) => {
            this.currentUser = user;
          },
          error: () => {
            this.userError = true;
          }
        });
      }
    }
  }
  
  loadDashboardData(): void {
    this.isLoading = true;
    
    // Cargar productos y transacciones en paralelo
    forkJoin({
      products: this.productService.getAll(),
      transactions: this.transactionService.getAll()
    }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({products, transactions}) => {
        // Procesar productos
        this.products = products;
        this.totalProducts = products.length;
        this.totalStockCount = products.reduce((sum, product) => sum + (product.stock || 0), 0);
        
        // Obtener productos recientes
        this.recentProducts = [...products]
          .sort((a, b) => {
            return new Date(b.updatedAt || b.createdAt || 0).getTime() - 
                   new Date(a.updatedAt || a.createdAt || 0).getTime();
          })
          .slice(0, 5);
        
        // Procesar transacciones
        this.totalTransactions = transactions.length;
        
        // Obtener transacciones recientes
        this.recentTransactions = [...transactions]
          .sort((a, b) => {
            return new Date(b.createdAt || 0).getTime() - 
                   new Date(a.createdAt || 0).getTime();
          })
          .slice(0, 5);
      },
      error: (err) => {
        this.error = true;
        console.error('Error cargando datos del dashboard:', err);
      }
    });
  }
  
  getGreetingByTime(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días. ¡Que tengas un excelente inicio de jornada!';
    if (hour < 18) return 'Buenas tardes. ¡Espero que tu día esté siendo productivo!';
    return 'Buenas noches. ¡Es hora de revisar el inventario del día!';
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}