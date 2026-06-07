import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { ProductService } from '../../services/product.service';
import { TransactionService } from '../../services/transaction.service';
import { AuthService } from '../../services/user.service';
import { IProduct } from '../../interfaces/iproduct.interface';
import Swal from 'sweetalert2';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-escaner',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './escaner.component.html',
  styleUrl: './escaner.component.css'
})
  
  
export class EscanerComponent implements OnInit, AfterViewInit {
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  userRole = 'user';
  scannerMode: 'usb' | 'camera' = 'usb';
  scannedCode = '';
  isLoading = false;
  error = false;
  errorMessage = '';

  myOutProducts: any[] = [];
  isLoadingOutProducts = false;
  outProductsError = false;

  othersOutProducts: any[] = [];
  isLoadingOthersProducts = false;
  othersProductsError = false;

  scannerEnabled = false;
  cameraPermissionDenied = false;
  availableDevices: MediaDeviceInfo[] = [];

  constructor(
    private productService: ProductService,
    private transactionService: TransactionService,
    private authService: AuthService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    if (this.isMobileDevice()) {
      this.scannerMode = 'camera';
      this.scannerEnabled = true;
    }

    const cachedUser = this.tokenService.getUser();
    if (cachedUser) this.userRole = cachedUser.role;

    this.loadUserOutProducts();
    if (this.userRole === 'admin') {
      this.loadOthersOutProducts();
    }
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }

  setScannerMode(mode: 'usb' | 'camera'): void {
    this.scannerMode = mode;
    this.scannerEnabled = mode === 'camera';
    if (mode === 'usb') setTimeout(() => this.focusInput(), 100);
  }

  focusInput(): void {
    if (this.barcodeInput && this.scannerMode === 'usb') {
      this.barcodeInput.nativeElement.focus();
    }
  }

  processBarcode(): void {
    if (!this.scannedCode.trim()) return;
    this.searchProduct(this.scannedCode.trim());
  }

  onZxingScan(code: string): void {
    if (!code || this.isLoading) return;
    this.scannerEnabled = false;
    this.searchProduct(code);
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
  }

  onPermissionResponse(permission: boolean): void {
    this.cameraPermissionDenied = !permission;
  }

  searchProduct(code: string): void {
    this.isLoading = true;
    this.error = false;

    this.productService.findByBarcode(code).subscribe({
      next: (product) => {
        this.isLoading = false;
        this.showProductActionDialog(product);
      },
      error: () => {
        this.isLoading = false;
        this.error = true;
        this.errorMessage = `Producto no encontrado: "${code}"`;
        this.scannedCode = '';
        this.focusInput();
        if (this.scannerMode === 'camera') this.scannerEnabled = true;
      }
    });
  }

  getOutStatus(productId: number): {
    isOut: boolean;
    isMine: boolean;
    userName?: string;
    date?: string;
    quantity?: number;
   } {
    const mine   = this.myOutProducts.find((i: any) => Number(i.product?.id) === productId);
    if (mine) return { isOut: true, isMine: true, date: mine.lastExitDate, quantity: mine.quantityOut };

    const others = this.othersOutProducts.find((i: any) => Number(i.product?.id) === productId);
    if (others) return { isOut: true, isMine: false, userName: others.user?.name, date: others.lastExitDate, quantity: others.quantityOut };

    return { isOut: false, isMine: false };
  }

  showProductActionDialog(product: IProduct): void {
    const out = this.getOutStatus(product.id!);
    const stockColor = product.stock <= 2 ? 'text-danger' : product.stock <= 5 ? 'text-warning' : 'text-success';

    let statusHtml = '';
    if (out.isOut && out.isMine) {
      const d = out.date ? new Date(out.date).toLocaleString('es-ES') : 'N/A';
      statusHtml = `<div class="alert alert-warning mt-2 text-start py-2">
        <i class="fas fa-exclamation-triangle me-1"></i>
        <strong>Tienes ${out.quantity} ud. fuera</strong><br>
        <small>Desde: ${d}</small>
      </div>`;
    } else if (out.isOut && !out.isMine) {
      const d = out.date ? new Date(out.date).toLocaleString('es-ES') : 'N/A';
      statusHtml = `<div class="alert alert-info mt-2 text-start py-2">
        <i class="fas fa-user me-1"></i>
        <strong>${out.userName}</strong> tiene ${out.quantity} ud. fuera<br>
        <small>Desde: ${d}</small>
      </div>`;
    }

    Swal.fire({
      title: product.item,
      html: `
        <div class="text-start">
          <p class="mb-1"><strong>Marca:</strong> ${product.brand}</p>
          <p class="mb-1"><strong>Código:</strong> ${product.code || 'N/A'}</p>
          <p class="mb-1"><strong>Categoría:</strong> ${product.category_name || 'N/A'}</p>
          <p class="mb-1"><strong>Stock:</strong> <span class="${stockColor} fw-bold">${product.stock}</span></p>
          ${statusHtml}
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
      if (result.isConfirmed) this.updateProductStock(product, 'IN', out.isMine ? out.quantity : undefined);
      else if (result.isDenied) this.updateProductStock(product, 'OUT');
      else {
        this.scannedCode = '';
        this.focusInput();
        if (this.scannerMode === 'camera') this.scannerEnabled = true;
      }
    });
  }

  updateProductStock(product: IProduct, type: 'IN' | 'OUT', outQuantity?: number): void {
    if (type === 'IN' && outQuantity === 1) {
      Swal.fire({
        title: 'Devolver producto',
        html: `¿Devolver <strong>1 unidad</strong> de "${product.item}" al almacén?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Devolver',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745'
      }).then(result => {
        if (!result.isConfirmed) { this.resetScanner(); return; }
        this.executeTransaction(product, type, 1);
      });
      return;
    }

    const maxQty = type === 'IN' ? (outQuantity ?? 0) : product.stock;
    const infoHtml = type === 'IN'
      ? `Tienes <strong>${maxQty}</strong> ud. fuera`
      : `Stock disponible: <strong>${maxQty}</strong>`;

    this.showQuantityDialog(type, maxQty, infoHtml).then(qty => {
      if (qty === null) { this.resetScanner(); return; }
      this.executeTransaction(product, type, qty);
    });
  }

  private showQuantityDialog(type: 'IN' | 'OUT', maxQty: number, infoHtml: string): Promise<number | null> {
    const limit = Math.min(5, maxQty);
    const buttonsHtml = Array.from({ length: limit }, (_, i) => i + 1)
      .map(n => `<button class="btn btn-outline-primary qty-btn m-1 px-3 py-2" style="font-size:1.1rem;min-width:52px" data-qty="${n}">${n}</button>`)
      .join('');

    const otherBtnHtml = maxQty > 5
      ? `<br><button class="btn btn-outline-secondary btn-sm mt-2" id="btn-other">Otra cantidad</button>`
      : '';

    return new Promise(resolve => {
      Swal.fire({
        title: type === 'IN' ? 'Entrada de producto' : 'Salida de producto',
        html: `
          <p class="text-muted mb-3">${infoHtml}</p>
          <div>${buttonsHtml}</div>
          ${otherBtnHtml}
          <div id="other-container" style="display:none;margin-top:12px">
            <input type="number" id="other-input" class="swal2-input" min="1" max="${maxQty}" placeholder="Máx. ${maxQty}">
            <button class="btn btn-primary mt-2" id="confirm-other">Confirmar</button>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        didOpen: () => {
          document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const qty = parseInt((btn as HTMLElement).getAttribute('data-qty') || '0');
              Swal.close();
              resolve(qty);
            });
          });
          document.getElementById('btn-other')?.addEventListener('click', () => {
            document.getElementById('other-container')!.style.display = 'block';
            document.getElementById('btn-other')!.style.display = 'none';
          });
          document.getElementById('confirm-other')?.addEventListener('click', () => {
            const input = document.getElementById('other-input') as HTMLInputElement;
            const val = parseInt(input.value);
            if (!val || val < 1 || val > maxQty) { input.style.borderColor = 'red'; return; }
            Swal.close();
            resolve(val);
          });
        }
      }).then(result => {
        if (result.isDismissed) resolve(null);
      });
    });
  }

  private resetScanner(): void {
    this.scannedCode = '';
    this.focusInput();
    if (this.scannerMode === 'camera') this.scannerEnabled = true;
  }

  private executeTransaction(product: IProduct, type: 'IN' | 'OUT', quantity: number): void {
      Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      this.transactionService.create({ product_id: product.id!, type, quantity }).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: `${type === 'IN' ? 'Entrada' : 'Salida'} de ${quantity} ud. registrada`
          });
          this.scannedCode = '';
          this.focusInput();
          if (this.scannerMode === 'camera') this.scannerEnabled = true;
          this.loadUserOutProducts();
          this.loadOthersOutProducts();
        },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo procesar la transacción';
          Swal.fire({ icon: 'error', title: 'Error', text: msg });
          if (this.scannerMode === 'camera') this.scannerEnabled = true;
        }
      });
    }

  loadUserOutProducts(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;
    this.isLoadingOutProducts = true;
    this.outProductsError = false;
    this.transactionService.getUserOutProducts(userId).subscribe({
      next: (data) => { this.myOutProducts = data; this.isLoadingOutProducts = false; },
      error: () => { this.outProductsError = true; this.isLoadingOutProducts = false; }
    });
  }

  loadOthersOutProducts(): void {
    this.isLoadingOthersProducts = true;
    this.othersProductsError = false;
    this.transactionService.getOthersOutProducts().subscribe({
      next: (data) => { this.othersOutProducts = data; this.isLoadingOthersProducts = false; },
      error: () => { this.othersProductsError = true; this.isLoadingOthersProducts = false; }
    });
  }

  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad/i.test(navigator.userAgent);
  }
}