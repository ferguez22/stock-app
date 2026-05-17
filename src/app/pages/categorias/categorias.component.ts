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
  // Solo categorías raíz (sin parent) para el dropdown de "categoría padre"
  parentCategories: ICategory[] = [];

  isLoading = true;
  error = false;
  errorMessage = '';

  // Control del formulario lateral
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
      name: ['', [Validators.required, Validators.minLength(2)]],
      parent_id: [null]
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
      next: (data) => {
        this.categories = data;
        // Las categorías padre son las que no tienen parent_id
        this.parentCategories = data.filter(c => !c.parent_id);
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.error = true;
        this.errorMessage = 'No se pudieron cargar las categorías.';
      }
    });
  }

  // Abre el formulario para crear
  openCreateForm(): void {
    this.isEditing = false;
    this.editingId = null;
    this.categoryForm.reset({ parent_id: null });
    this.showForm = true;
  }

  // Abre el formulario pre-cargado para editar
  openEditForm(category: ICategory): void {
    this.isEditing = true;
    this.editingId = category.id!;
    this.categoryForm.patchValue({
      name: category.name,
      parent_id: category.parent_id ?? null
    });
    this.showForm = true;
    // Scroll suave al formulario en móvil
    setTimeout(() => {
      document.getElementById('category-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.categoryForm.reset({ parent_id: null });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.categoryForm.value;

    // Convertir parent_id a número o null
    const payload: ICategory = {
      name: formValue.name.trim(),
      parent_id: formValue.parent_id ? Number(formValue.parent_id) : null
    };

    if (this.isEditing && this.editingId) {
      this.categoryService.update(this.editingId, payload).pipe(
        finalize(() => this.submitting = false)
      ).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Categoría actualizada', timer: 1500, showConfirmButton: false });
          this.closeForm();
          this.loadCategories();
        },
        error: (err) => {
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'No se pudo actualizar la categoría' });
        }
      });
    } else {
      this.categoryService.create(payload).pipe(
        finalize(() => this.submitting = false)
      ).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Categoría creada', timer: 1500, showConfirmButton: false });
          this.closeForm();
          this.loadCategories();
        },
        error: (err) => {
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'No se pudo crear la categoría' });
        }
      });
    }
  }

  confirmDelete(category: ICategory): void {
    Swal.fire({
      title: '¿Eliminar categoría?',
      html: `¿Estás seguro de eliminar <strong>${category.name}</strong>?<br>
             <small class="text-muted">Los productos asociados quedarán sin categoría.</small>`,
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
            this.loadCategories();
            // Si estaba editando esta categoría, cerrar el form
            if (this.editingId === category.id) this.closeForm();
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'No se pudo eliminar la categoría' });
          }
        });
      }
    });
  }

  // Helper para el template
  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  // Nombre del padre para mostrar en la tabla
  getParentName(parentId: number | null | undefined): string {
    if (!parentId) return '—';
    const parent = this.categories.find(c => c.id === parentId);
    return parent?.name || '—';
  }

  // Categorías disponibles como padre (excluye la que se está editando)
  getAvailableParents(): ICategory[] {
    return this.categories.filter(c => !c.parent_id && c.id !== this.editingId);
  }
}