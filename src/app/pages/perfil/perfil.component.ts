import { Component, OnInit }from '@angular/core';
import { Router }from '@angular/router';
import { CommonModule }from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize }from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AuthService }   from '../../services/user.service';
import { TokenService }  from '../../services/token.service';
import { IUser }         from '../../interfaces/iuser.interface';

@Component({
  selector:    'app-perfil',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl:    './perfil.component.css'
})
  
export class PerfilComponent implements OnInit {

  // ── Estado: perfil propio ──────────────────────────────────
  currentUser:  IUser | null = null;
  isLoading     = true;
  error         = false;
  errorMessage  = '';

  // ── Estado: lista de usuarios (admin) ─────────────────────
  users:            IUser[] = [];
  isLoadingUsers    = false;
  showCreateForm    = false;
  showEditForm      = false;
  editingUser:      IUser | null = null;
  submitting        = false;

  // ── Formularios ───────────────────────────────────────────
  createUserForm: FormGroup;
  editUserForm:   FormGroup;

  // ─────────────────────────────────────────────────────────
  constructor(
    private authService:  AuthService,
    private tokenService: TokenService,
    private router:       Router,
    private fb:           FormBuilder
  )
  
  {
    this.createUserForm = this.fb.group({
      name:            ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      role:            ['user', Validators.required],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.editUserForm = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(2)]],
      email:    ['', [Validators.required, Validators.email]],
      role:     ['user', Validators.required],
      password: ['', Validators.minLength(6)]
    });
  }

  // ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!this.tokenService.getToken()) {
      this.router.navigate(['/login']);
      return;
    }

    const cached = this.tokenService.getUser();
    if (cached) {
      this.currentUser = cached;
      this.isLoading   = false;
    } else {
      this.loadCurrentUser();
    }

    if (this.isAdmin()) this.loadUsers();
  }

  // ══════════════════════════════════════════════════════════
  // PERFIL PROPIO
  // ══════════════════════════════════════════════════════════

  private loadCurrentUser(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) { this.router.navigate(['/login']); return; }

    this.isLoading = true;
    this.authService.getUserById(userId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next:  (user) => this.currentUser = user,
        error: ()     => this.router.navigate(['/login'])
      });
  }

  logout(): void { this.authService.logout(); }

  // ══════════════════════════════════════════════════════════
  // HELPERS — PERMISOS (seguridad)
  // ══════════════════════════════════════════════════════════

  isAdmin(): boolean {
    return (this.currentUser ?? this.tokenService.getUser())?.role === 'admin';
  }

  isCurrentUser(user: IUser): boolean {
    return this.currentUser?.id === user.id;
  }

  /** Admin solo puede editar usuarios con role 'user', nunca a otro admin */
  canEditUser(user: IUser): boolean {
    return user.role === 'user';
  }

  /** Admin solo puede activar/desactivar usuarios con role 'user' */
  canToggleUser(user: IUser): boolean {
    return user.role === 'user' && !this.isCurrentUser(user);
  }

  get activeCount(): number {
    return this.users.filter(u => u.is_active).length;
  }

  // ══════════════════════════════════════════════════════════
  // LISTA DE USUARIOS
  // ══════════════════════════════════════════════════════════

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.authService.getAllUsers()
      .pipe(finalize(() => this.isLoadingUsers = false))
      .subscribe({
        next:  (data) => this.users = data,
        error: ()     => { /* error silencioso — no bloquear la vista */ }
      });
  }

  // ══════════════════════════════════════════════════════════
  // CREAR USUARIO
  // ══════════════════════════════════════════════════════════

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.showEditForm   = false;
    if (!this.showCreateForm) this.createUserForm.reset({ role: 'user' });
  }

  onCreateSubmit(): void {
    if (this.createUserForm.invalid) { this.createUserForm.markAllAsTouched(); return; }

    this.submitting = true;
    const v = this.createUserForm.value;

    this.authService.createUser({ name: v.name, email: v.email, role: v.role, password: v.password })
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Usuario creado', timer: 1500, showConfirmButton: false });
          this.createUserForm.reset({ role: 'user' });
          this.showCreateForm = false;
          this.loadUsers();
        },
        error: (err) => Swal.fire({
          icon: 'error', title: 'Error',
          text: err.error?.message || 'No se pudo crear el usuario'
        })
      });
  }

  // ══════════════════════════════════════════════════════════
  // EDITAR USUARIO
  // ══════════════════════════════════════════════════════════

  openEditForm(user: IUser): void {
    if (!this.canEditUser(user)) return; // guarda de seguridad

    this.editingUser = user;
    this.showEditForm   = true;
    this.showCreateForm = false;
    this.editUserForm.patchValue({ name: user.name, email: user.email, role: user.role, password: '' });

    setTimeout(() =>
      document.getElementById('edit-form')?.scrollIntoView({ behavior: 'smooth' }), 100
    );
  }

  closeEditForm(): void {
    this.showEditForm = false;
    this.editingUser  = null;
    this.editUserForm.reset({ role: 'user' });
  }

  onEditSubmit(): void {
    if (this.editUserForm.invalid) { this.editUserForm.markAllAsTouched(); return; }
    if (!this.editingUser || !this.canEditUser(this.editingUser)) return;

    this.submitting = true;
    const v = this.editUserForm.value;

    const payload: Partial<IUser> & { password?: string; password_must_change?: boolean } = {
      name:  v.name.trim(),
      email: v.email.trim(),
      role:  v.role
    };

    // Si admin cambia la contraseña de OTRO usuario → forzar cambio en próximo login
    if (v.password) {
      payload.password = v.password;
      if (!this.isCurrentUser(this.editingUser)) {
        payload.password_must_change = true;
      }
    }

    this.authService.updateUser(this.editingUser.id!, payload)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Usuario actualizado', timer: 1500, showConfirmButton: false });
          this.closeEditForm();
          this.loadUsers();
        },
        error: (err) => Swal.fire({
          icon: 'error', title: 'Error',
          text: err.error?.message || 'No se pudo actualizar el usuario'
        })
      });
  }

  // ══════════════════════════════════════════════════════════
  // ACTIVAR / DESACTIVAR
  // ══════════════════════════════════════════════════════════

  toggleActive(user: IUser): void {
    if (!this.canToggleUser(user)) return; // guarda de seguridad

    const newState = !user.is_active;
    const accion   = newState ? 'activar' : 'desactivar';

    Swal.fire({
      title:              `¿${newState ? 'Activar' : 'Desactivar'} usuario?`,
      html:               `¿Confirmas ${accion} a <strong>${user.name}</strong>?`,
      icon:               'warning',
      showCancelButton:   true,
      confirmButtonText:  'Confirmar',
      cancelButtonText:   'Cancelar',
      confirmButtonColor: newState ? '#28a745' : '#fd7e14'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.authService.updateUser(user.id!, { is_active: newState }).subscribe({
        next: () => {
          Swal.fire({
            icon:               'success',
            title:              newState ? 'Usuario activado' : 'Usuario desactivado',
            timer:              1200,
            showConfirmButton:  false
          });
          this.loadUsers();
        },
        error: () => Swal.fire({
          icon: 'error', title: 'Error',
          text: 'No se pudo cambiar el estado del usuario'
        })
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // VALIDADORES
  // ══════════════════════════════════════════════════════════

  passwordMatchValidator(fg: FormGroup): { passwordMismatch: true } | null {
    const pass    = fg.get('password')?.value;
    const confirm = fg.get('confirmPassword')?.value;

    if (pass !== confirm) {
      fg.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    fg.get('confirmPassword')?.setErrors(null);
    return null;
  }
}