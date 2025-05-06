import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { IProduct } from '../../interfaces/iproduct.interface';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-codigos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './codigos.component.html',
  styleUrls: ['./codigos.component.css'],
})
  
export class CodigosComponent implements OnInit {
  products: IProduct[] = []; // Lista de productos cargados desde el inventario
  selectedProducts: { [key: string]: number } = {}; // Productos seleccionados con cantidad
  barcodePreviews: { [key: string]: string } = {}; // URLs de las miniaturas de códigos de barras
  isLoading = true;
  error = false;
  errorMessage = ''
  filteredProducts: IProduct[] = []; // Lista de productos filtrados por búsqueda
  searchTerm: string = ''; // Término de búsqueda

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = false;
    
    this.productService.getAll().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...products]; // Inicializar con todos los productos
        
        // Generar todos los códigos de barras al cargar
        this.products.forEach(product => {
          if (product._id && product.code) {
            this.generateBarcodePreview(product._id, product.code);
          }
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.error = true;
        this.errorMessage = 'No se pudieron cargar los productos. Por favor, inténtalo de nuevo más tarde.';
        this.isLoading = false;
      }
    });
  }

  toggleSelection(productId: string, event?: Event): void {
    // Si el evento viene de un input, evitar doble acción
    if (event) {
      event.stopPropagation();
    }

    const product = this.products.find(p => p._id === productId);
    
    if (!this.selectedProducts[productId]) {
      this.selectedProducts[productId] = 1; // Mínimo de 1 código por producto
    } else {
      delete this.selectedProducts[productId];
    }
  }

  isSelected(productId: string): boolean {
    return !!this.selectedProducts[productId];
  }

  generateBarcodePreview(productId: string, code: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 200; // Aumentar resolución de la miniatura
    canvas.height = 100;
    
    JsBarcode(canvas, code, {
      format: 'CODE128',
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 10,
      margin: 5,
      background: '#FFFFFF',
      lineColor: '#000000'
    });
    
    // Convertir canvas a URL de datos con calidad óptima
    this.barcodePreviews[productId] = canvas.toDataURL('image/png', 1.0);
  }

  totalBarcodeCount(products: IProduct[], selectedProducts: {[key: string]: number}): number {
    return products.reduce((total, product) => {
      return total + (selectedProducts[product._id || ''] || 0);
    }, 0);
  }

  generatePDF(): void {
  const selectedProducts = this.products.filter(product =>
    this.selectedProducts[product._id || '']
  );

    if (selectedProducts.length === 0) {
      import('sweetalert2').then(Swal => {
      Swal.default.fire({
        title: 'Atención',
        text: 'Por favor, selecciona al menos un producto para generar el PDF.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      });
      return;
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false,
      precision: 16
    });
    
      // --- CONFIGURACIÓN PARA 24 CÓDIGOS POR PÁGINA ---
      const barcodeWidth = 40;  // Reducir ancho a 4 cm
      const barcodeHeight = 15; // Reducir alto a 1.5 cm
      const itemsPerRow = 4;    // 4 códigos por fila
      const itemsPerPage = 24;  // 24 códigos por página (6 filas x 4 columnas)
      const padding = 7;        // Reducir espacio entre códigos
      // ---------------------------------------------------
    
    let x = 15;
    let y = 20;
    let currentItemCount = 0;

    selectedProducts.forEach((product) => {
      const quantity = this.selectedProducts[product._id || ''];
      
      for (let i = 0; i < quantity; i++) {
        const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        
        // --- MODIFICA ESTOS VALORES PARA RESOLUCIÓN SVG ---
        svgElement.setAttribute("width", "1000");  // Resolución horizontal
        svgElement.setAttribute("height", "500");  // Resolución vertical
        // -------------------------------------------------
        
        svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        
        JsBarcode(svgElement, product.code, {
          format: "CODE128",
          // --- MODIFICA ESTOS VALORES PARA DETALLES DEL CÓDIGO ---
          width: 8,         // Grosor de líneas (aumentar para líneas más gruesas)
          height: 400,      // Altura del código (aumentar para código más alto)
          fontSize: 40,     // Tamaño del texto del código
          margin: 5,        // Margen interno del código
          textMargin: 5,    // Espacio entre código y texto
          // ----------------------------------------------------
          displayValue: true,
          background: "#FFFFFF",
          lineColor: "#000000"
        });
        
        document.body.appendChild(svgElement);
        
        const svgString = new XMLSerializer().serializeToString(svgElement);
        
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 600;
        const ctx = canvas.getContext("2d");
        
        const img = new Image();
        img.onload = () => {
          ctx!.drawImage(img, 0, 0);
          
          const imgData = canvas.toDataURL("image/png", 1.0);
          
          pdf.addImage(imgData, "PNG", x, y, barcodeWidth, barcodeHeight, undefined, "NONE");
          
          pdf.setDrawColor(150, 150, 150);
          pdf.setLineWidth(0.05);
          pdf.rect(x, y, barcodeWidth, barcodeHeight);
          
          currentItemCount++;
          
          if (currentItemCount % itemsPerRow === 0) {
            x = 15;
            y += barcodeHeight + padding;
          } else {
            x += barcodeWidth + (padding / 2);
          }
          
          if (currentItemCount % itemsPerPage === 0 && 
              (i < quantity - 1 || product !== selectedProducts[selectedProducts.length - 1])) {
            pdf.addPage();
            x = 15;
            y = 20;
          }
          
          if (product === selectedProducts[selectedProducts.length - 1] && 
              i === quantity - 1) {
            pdf.setProperties({
              title: "Códigos de Barras - Alta Resolución",
              creator: "StockApp",
              subject: "Códigos de Barras Optimizados"
            });
            
            pdf.save("codigos-de-barras-nitidos.pdf");
          }
        };
        
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
        
        document.body.removeChild(svgElement);
      }
    });
  }

  totalSelectedCount(): number {
    return Object.values(this.selectedProducts).reduce((total, qty) => total + qty, 0);
  }

// Añadir estos métodos a la clase CodigosComponent

  incrementQuantity(productId: string): void {
    if (!this.selectedProducts[productId]) {
      this.selectedProducts[productId] = 1;
    } else {
      this.selectedProducts[productId]++;
    }
  }

  decrementQuantity(productId: string): void {
    if (this.selectedProducts[productId] && this.selectedProducts[productId] > 1) {
      this.selectedProducts[productId]--;
    } else {
      // Si llega a 0 o menos, eliminar la selección
      delete this.selectedProducts[productId];
    }
  }

    applySearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredProducts = this.products.filter(product => 
      (product.item && product.item.toLowerCase().includes(term)) || 
      (product.code && product.code.toLowerCase().includes(term))
    );
    }
  
    clearSearch(): void {
    this.searchTerm = '';
    this.filteredProducts = [...this.products];
  }

}