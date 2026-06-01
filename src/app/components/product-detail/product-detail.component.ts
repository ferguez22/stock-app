import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProduct } from '../../interfaces/iproduct.interface';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
    
export class ProductDetailComponent {
  @Input() product: IProduct | null = null;
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  

  getStatusColor(): string {
    const colors: Record<string, string> = {
      'BUENO': '#198754',
      'REGULAR': '#ffc107',
      'MALO': '#fd7e14',
      'BAJA': '#dc3545'
    };
    return this.product ? colors[this.product.status] || '#6c757d' : '#6c757d';
  }

  getStockColor(): string {
    if (!this.product) return '#6c757d';
    if (this.product.stock <= 2) return '#dc3545';
    if (this.product.stock <= 5) return '#ffc107';
    return '#198754';
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}