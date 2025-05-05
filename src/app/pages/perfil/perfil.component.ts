import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { IUser } from '../../interfaces/iuser.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  currentUser: IUser | null = null;
  isLoading = true;
  error = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) { }
  
ngOnInit(): void {
  // Verificar si hay token
  if (!this.tokenService.getToken()) {
    this.router.navigate(['/login']);
    return;
  }
  
  // Intentar obtener del localStorage primero
  const cachedUser = this.tokenService.getUser();
  
  if (cachedUser) {
    this.currentUser = cachedUser;
    this.isLoading = false;
    
    // Solo cargar datos frescos si han pasado más de 5 minutos desde la última carga
    const lastUpdate = localStorage.getItem('user_last_update');
    const now = Date.now();
    if (!lastUpdate || (now - parseInt(lastUpdate)) > 5 * 60 * 1000) {
      this.loadUserData();
      localStorage.setItem('user_last_update', now.toString());
    }
  } else {
    // Si no hay datos en caché, cargarlos
    this.loadUserData();
  }
}

  private loadUserData(): void {
    // Obtener el ID del usuario
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.error = true;
      this.errorMessage = 'No se pudo identificar al usuario actual';
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    this.error = false;
    
    // Usar getUserById directamente con el ID obtenido
    this.authService.getUserById(userId)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.error = false;
        },
        error: (err) => {
          console.error('Error obteniendo datos del usuario:', err);
          this.error = true;
          this.errorMessage = err.message || 'Error al cargar los datos del usuario';
          
          // Si no hay datos en caché, redirigir al login
          if (!this.currentUser) {
            this.router.navigate(['/login']);
          }
        }
      });
  }

  logout(): void {
    this.authService.logout();
  }
}