import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProduct } from '../../interfaces/iproduct.interface';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product!: IProduct;
  
  @Output() viewProduct = new EventEmitter<IProduct>();
  @Output() editProduct = new EventEmitter<IProduct>();

  getStockStatusClass(): string {
    if (this.product.stock <= 2) return 'bg-danger';
    if (this.product.stock <= 5) return 'bg-warning';
    return 'bg-success';
  }
  
  onView(): void {
    this.viewProduct.emit(this.product);
  }
  
  onEdit(): void {
    this.editProduct.emit(this.product);
  }
}