import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { TransactionService } from '../../services/transaction.service';
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

  scannerMode: 'usb' | 'camera' = 'usb';
  scannedCode: string = '';
  isLoading = false;
  error = false;
  errorMessage = '';
  scannedProduct: IProduct | null = null;
  myOutProducts: any[] = [];
  isLoadingOutProducts = false;
  outProductsError = false;
  othersOutProducts: any[] = [];
  isLoadingOthersProducts = false;
  othersProductsError = false;

  constructor(
    private productService: ProductService,
    private transactionService: TransactionService,
    private authService: AuthService,
    private tokenService: TokenService,
  ) {}

  ngOnInit(): void {
    if (this.isMobileDevice()) {
      this.scannerMode = 'camera';
    }
    
    this.loadUserOutProducts();
    this.loadOthersOutProducts(); // Cargar productos de otros usuarios
  }

  loadUserOutProducts(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;
    
    this.isLoadingOutProducts = true;
    this.outProductsError = false;
    
    this.transactionService.getUserOutProducts(userId).subscribe({
      next: (data) => {
        this.myOutProducts = data;
        this.isLoadingOutProducts = false;
      },
      error: (err) => {
        console.error('Error cargando productos fuera de almacén:', err);
        this.outProductsError = true;
        this.isLoadingOutProducts = false;
      }
    });
  }

  loadOthersOutProducts(): void {
    this.isLoadingOthersProducts = true;
    this.othersProductsError = false;
    
    this.transactionService.getOthersOutProducts().subscribe({
      next: (data) => {
        this.othersOutProducts = data;
        this.isLoadingOthersProducts = false;
      },
      error: (err) => {
        console.error('Error cargando productos de otros usuarios:', err);
        this.othersProductsError = true;
        this.isLoadingOthersProducts = false;
      }
    });
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
    this.errorMessage = '';
  
    this.productService.findByBarcode(this.scannedCode).subscribe({
      next: (product) => {
        this.isLoading = false;
        this.scannedProduct = product;
        this.showProductActionDialog(product);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = true;
        this.errorMessage = err.message || 'No se encontró ningún producto con este código de barras.';
  
        Swal.fire({
          icon: 'error',
          title: 'Producto no encontrado',
          text: this.errorMessage,
          confirmButtonText: 'Aceptar'
        });
        
        // Resetear el código escaneado y enfocar el input para el siguiente escaneo
        setTimeout(() => {
          this.scannedCode = '';
          this.focusInput();
        }, 100);
      }
    });
  }

  showProductActionDialog(product: IProduct): void {
    const stockColor = product.stock <= 2 ? 'text-danger' :
                       product.stock <= 5 ? 'text-warning' : 'text-success';

    Swal.fire({
      title: 'Producto encontrado',
      html: `
        <div class="product-info text-start">
          <h4>${product.item}</h4>
          <p><strong>Código:</strong> ${product.code || 'N/A'}</p>
          <p><strong>Tipo:</strong> ${product.type || 'No especificado'}</p>
          <p><strong>Stock actual:</strong> <span class="${stockColor} fw-bold">${product.stock}</span></p>
        </div>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      denyButtonColor: '#dc3545',
      confirmButtonText: '<i class="fas fa-arrow-down me-1"></i> Entrada',
      denyButtonText: '<i class="fas fa-arrow-up me-1"></i> Salida',
      cancelButtonText: 'Cancelar',
      focusConfirm: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateProductStock(product, 'IN');
      } else if (result.isDenied) {
        this.updateProductStock(product, 'OUT');
      }
    });
  }

  updateProductStock(product: IProduct, transactionType: 'IN' | 'OUT'): void {
    Swal.fire({
      title: transactionType === 'IN' ? 'Entrada de producto' : 'Salida de producto',
      text: `¿Cuántas unidades de "${product.item}" quieres ${transactionType === 'IN' ? 'ingresar al' : 'retirar del'} almacén?`,
      input: 'number',
      inputAttributes: {
        min: '1',
        step: '1'
      },
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || parseInt(value) <= 0) {
          return 'Debes ingresar una cantidad válida mayor a cero';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const quantity = parseInt(result.value);

        if (transactionType === 'OUT' && quantity > product.stock) {
          Swal.fire({
            icon: 'error',
            title: 'Stock insuficiente',
            text: `Solo hay ${product.stock} unidades disponibles`
          });
          return;
        }

        Swal.fire({
          title: 'Procesando...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const userId = this.authService.getCurrentUserId()

        this.transactionService.createTransaction({
          productId: product._id!,
          userId: userId!,
          type: transactionType,
          quantity: quantity
        }).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Operación exitosa',
              text: `Se ha registrado la ${transactionType === 'IN' ? 'entrada' : 'salida'} de ${quantity} unidades`
            });

            this.scannedCode = '';
            this.focusInput();
            this.loadUserOutProducts();
            this.loadOthersOutProducts();
          },
          error: (err) => {
            console.error('Error en la transacción:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo procesar la transacción. Intente nuevamente.'
            });
          }
        });
      }
    });
  }

  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad/i.test(navigator.userAgent);
  }
}
