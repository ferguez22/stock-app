import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { IProduct } from '../../interfaces/iproduct.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-escaner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './escaner.component.html',
  styleUrl: './escaner.component.css'
})
export class EscanerComponent implements OnInit, AfterViewInit {
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;
  
  scannerMode: 'usb' | 'camera' = 'usb'; // Por defecto, usamos el modo escáner USB
  scannedCode: string = '';
  isLoading = false;
  error = false;
  errorMessage = '';
  scannedProduct: IProduct | null = null;
  
  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private tokenService: TokenService
  ) {}
  
  ngOnInit(): void {
    // Detectamos si estamos en un dispositivo móvil para cambiar el modo por defecto
    if (this.isMobileDevice()) {
      this.scannerMode = 'camera';
    }
  }
  
  ngAfterViewInit() {
    this.focusInput();
  }
  
  setScannerMode(mode: 'usb' | 'camera'): void {
    this.scannerMode = mode;
    if (mode === 'usb') {
      setTimeout(() => {
        this.focusInput();
      }, 100);
    }
  }
  
  focusInput(): void {
    if (this.barcodeInput && this.scannerMode === 'usb') {
      this.barcodeInput.nativeElement.focus();
    }
  }
  
  processBarcode(): void {
    if (!this.scannedCode.trim()) return;
    
    this.isLoading = true;
    this.error = false;
    
    // Buscar el producto por su código de barras
    this.productService.findByBarcode(this.scannedCode).subscribe({
      next: (product) => {
        this.isLoading = false;
        this.scannedProduct = product;
        
        // Mostrar modal de opciones
        this.showProductActionDialog(product);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = true;
        this.errorMessage = 'No se encontró ningún producto con este código de barras.';
        
        Swal.fire({
          icon: 'error',
          title: 'Producto no encontrado',
          text: 'No se encontró ningún producto con el código escaneado.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
    
    // Limpiar y volver a enfocar para el siguiente escaneo
    setTimeout(() => {
      this.scannedCode = '';
      this.focusInput();
    }, 100);
  }
  
  showProductActionDialog(product: IProduct): void {
    Swal.fire({
      title: product.item,
      html: `
        <p><strong>Código:</strong> ${product.code}</p>
        <p><strong>Stock actual:</strong> ${product.stock}</p>
      `,
      icon: 'info',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Sacar de almacén',
      denyButtonText: 'Devolver a almacén',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Lógica para sacar producto del almacén
        this.updateProductStock(product, 'OUT');
      } else if (result.isDenied) {
        // Lógica para devolver producto al almacén
        this.updateProductStock(product, 'IN');
      }
    });
  }
  
  updateProductStock(product: IProduct, transactionType: 'IN' | 'OUT'): void {
    // Implementar la lógica para registrar la transacción
    // ...
  }
  
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}