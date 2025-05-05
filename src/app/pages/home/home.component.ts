import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { IProduct } from '../../interfaces/iproduct.interface';
import { IUser } from '../../interfaces/iuser.interface';
import { finalize } from 'rxjs/operators';

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
  currentUser: IUser | null = null;
  isLoading = true;
  userError = false;
  error = false;
  totalProducts = 0;
  lowStockCount = 0;
  
  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private tokenService: TokenService
  ) {}
  
  ngOnInit(): void {
    this.loadUserData();
    this.loadProducts();
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
  
  loadProducts(): void {
    this.productService.getAll()
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (products) => {
          this.products = products;
          this.totalProducts = products.length;
          // Obtener los 5 productos más recientes
          this.recentProducts = [...products]
            .sort((a, b) => {
              return new Date(b.updatedAt || b.createdAt || 0).getTime() - 
                     new Date(a.updatedAt || a.createdAt || 0).getTime();
            })
            .slice(0, 5);
          
          // Contar productos con bajo stock
          this.lowStockCount = products.filter(p => p.stock <= 2).length;
        },
        error: (err) => {
          this.error = true;
          console.error('Error cargando productos:', err);
        }
      });
  }
  
  getGreetingByTime(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días. ¡Que tengas un excelente inicio de jornada!';
    if (hour < 18) return 'Buenas tardes. ¡Espero que tu día esté siendo productivo!';
    return 'Buenas noches. ¡Es hora de revisar el inventario del día!';
  }
}