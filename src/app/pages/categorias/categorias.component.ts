import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { TokenService } from '../../services/token.service';
import { ICategory } from '../../interfaces/icategory.interface';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.css'
})
export class CategoriasComponent implements OnInit {

  categories: ICategory[] = [];
  isLoading = true;
  error = false;
  errorMessage = '';
  showForm = false;
  isEditing = false;
  editingId: number | null = null;
  submitting = false;
  userRole = 'user';
  categoryForm: FormGroup;

  constructor(
    private categoryService: CategoryService,
    private tokenService: TokenService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    const user = this.tokenService.getUser();
    if (user) this.userRole = user.role;
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.error = false;
    this.categoryService.getAll().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => this.categories = data,
      error: () => {
        this.error = true;
        this.errorMessage = 'No se pudieron cargar las categorías.';
      }
    });
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.editingId = null;
    this.categoryForm.reset();
    this.showForm = true;
  }

  openEditForm(category: ICategory): void {
    this.isEditing = true;
    this.editingId = category.id!;
    this.categoryForm.patchValue({ name: category.name });
    this.showForm = true;
    setTimeout(() => {
      document.getElementById('category-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.categoryForm.reset();
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const payload: ICategory = { name: this.categoryForm.value.name.trim() };

    const request$ = this.isEditing
      ? this.categoryService.update(this.editingId!, payload)
      : this.categoryService.create(payload);

    request$.pipe(finalize(() => this.submitting = false)).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: this.isEditing ? 'Categoría actualizada' : 'Categoría creada',
          timer: 1500,
          showConfirmButton: false
        });
        this.closeForm();
        this.loadCategories();
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Operación fallida' });
      }
    });
  }

  confirmDelete(category: ICategory): void {
    Swal.fire({
      title: '¿Eliminar categoría?',
      html: `¿Estás seguro de eliminar <strong>${category.name}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then(result => {
      if (result.isConfirmed) {
        this.categoryService.delete(category.id!).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1500, showConfirmButton: false });
            if (this.editingId === category.id) this.closeForm();
            this.loadCategories();
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'No se pudo eliminar' });
          }
        });
      }
    });
  }

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }
}