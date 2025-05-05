import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProduct } from '../../interfaces/iproduct.interface';

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-table.component.html',
  styleUrl: './product-table.component.css'
})
export class ProductTableComponent {
  @Input() products: IProduct[] = [];
  @Input() userRole: string = 'user'; // Valor por defecto: usuario regular
  
  @Output() editProduct = new EventEmitter<IProduct>();
  @Output() deleteProduct = new EventEmitter<IProduct>();
  @Output() viewProduct = new EventEmitter<IProduct>();

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  onEdit(product: IProduct): void {
    this.editProduct.emit(product);
  }

  onDelete(product: IProduct): void {
    this.deleteProduct.emit(product);
  }
  
  onView(product: IProduct): void {
    this.viewProduct.emit(product);
  }
}