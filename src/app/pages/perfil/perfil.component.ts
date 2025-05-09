import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { IUser } from '../../interfaces/iuser.interface';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
  
export class PerfilComponent implements OnInit {
  currentUser: IUser | null = null;
  isLoading = true;
  error = false;
  errorMessage = '';
  showUserForm = false;
  createUserForm: FormGroup;
  submittingUser = false;

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.createUserForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }
  
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

    // Validador personalizado para verificar que las contraseñas coincidan
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
      return null;
    }
  }
  
  // Método para mostrar/ocultar el formulario
  toggleUserForm(): void {
    this.showUserForm = !this.showUserForm;
    if (!this.showUserForm) {
      this.createUserForm.reset();
      this.createUserForm.patchValue({ role: 'user' });
    }
  }
  
  // Método para enviar el formulario
  onCreateUserSubmit(): void {
    if (this.createUserForm.invalid) {
      this.markFormGroupTouched(this.createUserForm);
      return;
    }
    
    const userData = {
      name: this.createUserForm.value.name,
      email: this.createUserForm.value.email,
      role: this.createUserForm.value.role,
      password: this.createUserForm.value.password
    };
    
    this.submittingUser = true;
    
    this.authService.createUser(userData).pipe(
      finalize(() => this.submittingUser = false)
    ).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Usuario creado',
          text: `El usuario ${userData.name} ha sido creado exitosamente`,
          confirmButtonText: 'Aceptar'
        });
        this.toggleUserForm();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'No se pudo crear el usuario. Por favor, intenta de nuevo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }
  
  // Método auxiliar para marcar todos los campos como tocados
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}