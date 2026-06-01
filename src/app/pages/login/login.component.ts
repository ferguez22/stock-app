import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
  
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Redireccionar si ya está logueado
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
    
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
  if (this.loginForm.invalid) { this.markFormGroupTouched(this.loginForm); return; }

  this.isLoading = true;
  this.errorMessage = '';

  this.authService.login(this.loginForm.value).subscribe({
    next: (response: any) => {
      this.isLoading = false;
      if (response.password_must_change) {
        // FIX 3: forzar cambio de contraseña
        this.showForcePasswordChange();
      } else {
        this.router.navigate(['/home']);
      }
    },
    error: (error) => {
      this.isLoading = false;
      this.errorMessage = error?.error?.message || 'Error de autenticación.';
    }
  });
}

  private showForcePasswordChange(): void {
    import('sweetalert2').then(({ default: Swal }) => {
      Swal.fire({
        title: '🔐 Cambio de contraseña requerido',
        html: `
          <p class="text-muted mb-3">Un administrador ha cambiado tu contraseña.<br>Debes establecer una nueva para continuar.</p>
          <input type="password" id="new-password" class="swal2-input" placeholder="Nueva contraseña (mín. 6 caracteres)">
          <input type="password" id="confirm-password" class="swal2-input" placeholder="Confirmar contraseña">
        `,
        confirmButtonText: 'Cambiar contraseña',
        allowOutsideClick: false,
        allowEscapeKey: false,
        preConfirm: () => {
          const p1 = (document.getElementById('new-password') as HTMLInputElement).value;
          const p2 = (document.getElementById('confirm-password') as HTMLInputElement).value;
          if (!p1 || p1.length < 6) {
            Swal.showValidationMessage('Mínimo 6 caracteres');
            return false;
          }
          if (p1 !== p2) {
            Swal.showValidationMessage('Las contraseñas no coinciden');
            return false;
          }
          return p1;
        }
      }).then(result => {
        if (result.isConfirmed) {
          const userId = this.authService.getCurrentUserId();
          this.authService.updateUser(userId!, { password: result.value, is_active: true }).subscribe({
            next: () => {
              Swal.fire({ icon: 'success', title: 'Contraseña actualizada', timer: 1500, showConfirmButton: false })
                .then(() => this.router.navigate(['/home']));
            },
            error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar la contraseña' })
          });
        }
      });
    });
  }
  
  // Helper para marcar todos los campos como tocados (para mostrar errores)
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }
}