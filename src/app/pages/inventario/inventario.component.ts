import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Añadir importación
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { IProduct } from '../../interfaces/iproduct.interface';
import { IUser } from '../../interfaces/iuser.interface';
import { finalize } from 'rxjs/operators';
import { ProductTableComponent } from '../../components/product-table/product-table.component';
import { ProductDetailComponent } from '../../components/product-detail/product-detail.component';
import { ProductFormComponent } from '../../components/product-form/product-form.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductTableComponent, ProductDetailComponent, ProductFormComponent], // Añadir FormsModule
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
  
export class InventarioComponent implements OnInit {
  products: IProduct[] = [];
  filteredProducts: IProduct[] = []; // para productos filtrados
  searchTerm: string = ''; // Término de búsqueda
  selectedProduct: IProduct | null = null;
  showProductDetail = false;
  showProductForm = false;
  editingProduct: IProduct | null = null;
  sortBy: string = 'name-asc';
  isLoading = true;
  error = false;
  errorMessage = '';
  currentUser: IUser | null = null;
  userRole = 'user'; // Valor predeterminado
  inventoryStats = {
    totalProducts: 0,
    totalStock: 0,
    inStockTotal: 0, 
    outStockTotal: 0
  };

  isLoadingStats = false;
  statsError = false;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadProducts();
    this.loadInventoryStats(); // Nueva llamada
  }

  private loadUserData(): void {
    // Intentar obtener del localStorage primero
    const cachedUser = this.tokenService.getUser();
    if (cachedUser) {
      this.currentUser = cachedUser;
      this.userRole = cachedUser.role;
    } else {
      // Si no está en caché, intentar obtener del token
      const userId = this.authService.getCurrentUserId();
      if (userId) {
        this.authService.getUserById(userId).subscribe({
          next: (user) => {
            this.currentUser = user;
            this.userRole = user.role;
          },
          error: (err) => console.error('Error al cargar el usuario:', err)
        });
      }
    }
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.error = false;
    
    this.productService.getAll()
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (products) => {
          this.products = products;
          this.filteredProducts = [...products];
          
          // Ahora que tenemos los productos, cargamos las estadísticas
          this.loadInventoryStats();
        },
        error: (err) => {
          console.error('Error al cargar productos:', err);
          this.error = true;
          this.errorMessage = 'No se pudieron cargar los productos. Por favor, inténtalo de nuevo más tarde.';
        }
      });
  }

  loadInventoryStats(): void {
    this.isLoadingStats = true;
    this.statsError = false;
    
    this.productService.getInventoryStatus().subscribe({
      next: (data) => {
        // Calcular totales para las estadísticas generales
        this.inventoryStats.totalProducts = data.length;
        this.inventoryStats.totalStock = data.reduce((sum: number, item: any) => sum + item.total, 0);
        this.inventoryStats.inStockTotal = data.reduce((sum: number, item: any) => sum + item.enAlmacen, 0);
        this.inventoryStats.outStockTotal = data.reduce((sum: number, item: any) => sum + item.fueraAlmacen, 0);
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
        this.statsError = true;
        this.isLoadingStats = false;
      }
    });
  }

  applySearch(): void {
      let filtered = [...this.products];

      // Filtrar por búsqueda
      if (this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(product =>
          (product.item && product.item.toLowerCase().includes(term)) ||
          (product.code && product.code.toLowerCase().includes(term)) ||
          (product.brand && product.brand.toLowerCase().includes(term)) ||
          (product.category_name && product.category_name.toLowerCase().includes(term))
        );
      }

      // Ordenar
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'name-asc':
            return (a.item || '').localeCompare(b.item || '');
          case 'name-desc':
            return (b.item || '').localeCompare(a.item || '');
          case 'category-asc':
            return (a.category_name || '').localeCompare(b.category_name || '');
          case 'stock-asc':
            return (a.stock || 0) - (b.stock || 0);
          case 'stock-desc':
            return (b.stock || 0) - (a.stock || 0);
          case 'date-newest':
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          case 'date-oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          case 'updated-newest':
            return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
          case 'updated-oldest':
            return new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime();
          default:
            return 0;
        }
      });

      this.filteredProducts = filtered;
    }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredProducts = [...this.products];
  }

  handleViewProduct(product: IProduct): void {
    this.selectedProduct = product;
    this.showProductDetail = true;
  }

  closeProductDetail(): void {
    this.showProductDetail = false;
    this.selectedProduct = null;
  }

  handleNewProduct(): void {
    if (this.userRole !== 'admin') {
      Swal.fire('Acceso denegado', 'No tienes permisos para crear productos', 'error');
      return;
    }
    this.editingProduct = null;
    this.showProductForm = true;
  }

  closeProductForm(): void {
    this.showProductForm = false;
  }

  onProductSaved(productData: any): void {
    if (this.editingProduct) {
      // Modo edición
      this.productService.update(this.editingProduct.id!, productData).subscribe({
        next: (updatedProduct) => {
          this.showProductForm = false;
          const index = this.products.findIndex(p => p.id === this.editingProduct!.id);
          if (index !== -1) {
            const selectedCategory = this.editingProduct!.category_id === updatedProduct.category_id
              ? this.editingProduct!.category_name
              : this.products[index].category_name;
            this.products[index] = { ...updatedProduct, category_name: updatedProduct.category_name || selectedCategory };
          }
          this.editingProduct = null;
          this.applySearch();
          Swal.fire({
            icon: 'success',
            title: 'Producto actualizado',
            text: `${updatedProduct.item} se ha actualizado correctamente`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'No se pudo actualizar el producto'
          });
        }
      });
    } else {
      // Modo creación
      this.productService.create(productData).subscribe({
        next: (newProduct) => {
          this.showProductForm = false;
          this.products = [newProduct, ...this.products];
          this.applySearch();
          this.loadInventoryStats();
          Swal.fire({
            icon: 'success',
            title: 'Producto creado',
            text: `${newProduct.item} se ha creado correctamente`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'No se pudo crear el producto'
          });
        }
      });
    }
  }
  
  isCodeDuplicate(code: string): boolean {
    return this.products.some(product => product.code === code);
  }
  
  createProduct(productData: any): void {
    Swal.fire({
      title: 'Guardando...',
      text: 'Creando nuevo producto',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.productService.create(productData).subscribe({
      next: (newProduct) => {
        Swal.fire({
          icon: 'success',
          title: 'Producto creado',
          html: `
            <div class="text-center">
              <p>El producto <strong>${newProduct.item}</strong> se ha creado correctamente</p>
              <p class="mt-2">Código asignado: <span class="badge bg-secondary">${newProduct.code}</span></p>
            </div>
          `
        });
        
        // Añadir el nuevo producto al inicio de la lista
        this.products = [newProduct, ...this.products];
        this.applySearch(); // Reaplica el filtro de búsqueda
        
        // Actualizar las estadísticas
        this.loadInventoryStats();
      },
      error: (err) => {
        console.error('Error creando producto:', err);
        
        let errorMsg = 'No se pudo crear el producto';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.status === 409) {
          errorMsg = 'Ya existe un producto con ese código';
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMsg
        });
      }
    });
  }

  handleEditProduct(product: IProduct): void {
    if (this.userRole !== 'admin') {
      Swal.fire('Acceso denegado', 'No tienes permisos para editar productos', 'error');
      return;
    }
    this.editingProduct = product;
    this.showProductForm = true;
  }

  handleDeleteProduct(product: IProduct): void {
    if (this.userRole !== 'admin') {
      Swal.fire('Acceso denegado', 'No tienes permisos para eliminar productos', 'error');
      return;
    }

    Swal.fire({
      title: '¿Eliminar producto?',
      text: `¿Estás seguro de eliminar "${product.item}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.delete(product.id!).subscribe({
          next: () => {
            this.products = this.products.filter(p => p.id !== product.id);
            this.applySearch();
            this.loadInventoryStats();
            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: `${product.item} ha sido eliminado correctamente`,
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (err: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'No se pudo eliminar el producto'
            });
          }
        });
      }
    });
  }
}