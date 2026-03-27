import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ICategory } from '../../interfaces/icategory.interface';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
    
export class ProductFormComponent implements OnInit {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  productForm!: FormGroup;
  categories: ICategory[] = [];
  isLoadingCategories = true;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.productForm = this.fb.group({
      brand: ['', [Validators.required]],
      item: ['', [Validators.required]],
      category_id: ['', [Validators.required]],
      description: [''],
      status: ['BUENO', [Validators.required]],
      stock: [0, [Validators.required, Validators.min(0)]],
      min_stock: [2],
      price: [null],
      aisle: [''],
      shelf: [''],
      side: ['']
    });

    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoadingCategories = false;
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.isLoadingCategories = false;
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      Object.values(this.productForm.controls).forEach(c => c.markAsTouched());
      return;
    }

    const formData = { ...this.productForm.value };
    formData.category_id = Number(formData.category_id);
    if (formData.price) formData.price = Number(formData.price);
    if (formData.min_stock) formData.min_stock = Number(formData.min_stock);

    this.save.emit(formData);
  }

  onClose(): void {
    this.productForm.reset({ status: 'BUENO', stock: 0, min_stock: 2 });
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  isInvalid(field: string): boolean {
    const control = this.productForm.get(field);
    return !!(control && control.invalid && control.touched);
  }
}