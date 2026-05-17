import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { IProduct } from '../../interfaces/iproduct.interface';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

@Component({
  selector: 'app-codigos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './codigos.component.html',
  styleUrls: ['./codigos.component.css'],
})
export class CodigosComponent implements OnInit {
  products: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  selectedProducts: { [key: string]: number } = {};
  qrPreviews: { [key: string]: string } = {};
  isLoading = true;
  error = false;
  errorMessage = '';
  searchTerm = '';

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // Convierte id a string para usar como clave del diccionario
  private key(id: number | undefined): string {
    return String(id ?? '');
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = false;

    this.productService.getAll().subscribe({
      next: async (products) => {
        this.products = products;
        this.filteredProducts = [...products];
        for (const product of products) {
          if (product.id) {
            const qrValue = product.code || String(product.id);
            await this.generateQRPreview(product.id, qrValue);
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.error = true;
        this.errorMessage = 'No se pudieron cargar los productos.';
        this.isLoading = false;
      }
    });
  }

  async generateQRPreview(id: number, code: string): Promise<void> {
    this.qrPreviews[this.key(id)] = await QRCode.toDataURL(code, {
      width: 150,
      margin: 1,
      errorCorrectionLevel: 'M'
    });
  }

  toggleSelection(id: number | undefined): void {
    const k = this.key(id);
    if (!this.selectedProducts[k]) {
      this.selectedProducts[k] = 1;
    } else {
      delete this.selectedProducts[k];
    }
  }

  isSelected(id: number | undefined): boolean {
    return !!this.selectedProducts[this.key(id)];
  }

  incrementQuantity(id: number | undefined): void {
    const k = this.key(id);
    this.selectedProducts[k] = (this.selectedProducts[k] || 0) + 1;
  }

  decrementQuantity(id: number | undefined): void {
    const k = this.key(id);
    if (this.selectedProducts[k] > 1) {
      this.selectedProducts[k]--;
    } else {
      delete this.selectedProducts[k];
    }
  }

  totalSelectedCount(): number {
    return Object.values(this.selectedProducts).reduce((a, b) => a + b, 0);
  }

  applySearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredProducts = term
      ? this.products.filter(p =>
          p.item?.toLowerCase().includes(term) ||
          p.code?.toLowerCase().includes(term)
        )
      : [...this.products];
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredProducts = [...this.products];
  }

  async generatePDF(): Promise<void> {
    const selected = this.products.filter(p => this.selectedProducts[this.key(p.id)]);

    if (selected.length === 0) {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({ icon: 'warning', title: 'Atención', text: 'Selecciona al menos un producto.' });
      });
      return;
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const qrSize  = 38;
    const cellW   = 45;
    const cellH   = 50;
    const cols    = 4;
    const perPage = 20;
    const marginX = 12.5;
    const marginY = 15;

    const items: IProduct[] = [];
    selected.forEach(p => {
      const qty = this.selectedProducts[this.key(p.id)];
      for (let i = 0; i < qty; i++) items.push(p);
    });

    for (let i = 0; i < items.length; i++) {
      const product = items[i];

      if (i > 0 && i % perPage === 0) pdf.addPage();

      const pos = i % perPage;
      const col = pos % cols;
      const row = Math.floor(pos / cols);
      const x   = marginX + col * cellW;
      const y   = marginY + row * cellH;

      const dataUrl = await QRCode.toDataURL(product.code || String(product.id ?? ''), {
        width: 300,
        margin: 1,
        errorCorrectionLevel: 'M'
      });

      pdf.addImage(dataUrl, 'PNG', x, y, qrSize, qrSize);

      const name = product.item?.length > 22
        ? product.item.substring(0, 22) + '...'
        : product.item;

      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.text(name, x + qrSize / 2, y + qrSize + 4, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(product.code || '', x + qrSize / 2, y + qrSize + 8, { align: 'center' });
    }

    pdf.save('codigos-qr.pdf');
  }
}