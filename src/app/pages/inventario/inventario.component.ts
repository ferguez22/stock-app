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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductTableComponent], // Añadir FormsModule
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
  
export class InventarioComponent implements OnInit {
  products: IProduct[] = [];
  filteredProducts: IProduct[] = []; // Nueva propiedad para productos filtrados
  searchTerm: string = ''; // Término de búsqueda
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
        
        // Importante: Actualizar los productos con la información de stock fuera de almacén
        this.updateProductsWithOutStock(data);
        
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
        this.statsError = true;
        this.isLoadingStats = false;
      }
    });
  }

  private updateProductsWithOutStock(inventoryData: any[]): void {
    // Crear un mapa para acceso rápido por ID de producto
    const inventoryMap = new Map();
    inventoryData.forEach(item => {
      inventoryMap.set(item._id, item);
    });
    
    // Actualizar la propiedad outStock en los productos
    this.products.forEach(product => {
      const productInventory = inventoryMap.get(product._id);
      if (productInventory) {
        product.outStock = productInventory.fueraAlmacen || 0;
      } else {
        product.outStock = 0;
      }
    });
    
    // Actualizar también la lista filtrada
    this.filteredProducts = [...this.products];
  }

  applySearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredProducts = this.products.filter(product => 
      (product.item && product.item.toLowerCase().includes(term)) || 
      (product.code && product.code.toLowerCase().includes(term)) ||
      (product.type && product.type.toLowerCase().includes(term))
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredProducts = [...this.products];
  }

  handleViewProduct(product: IProduct): void {
    Swal.fire({
      title: product.item,
      html: `
        <div class="text-start">
          <p><strong>Tipo:</strong> ${product.type}</p>
          <p><strong>Código:</strong> ${product.code || 'N/A'}</p>
          <p><strong>Stock:</strong> ${product.stock}</p>
          <p><strong>Actualizado:</strong> ${product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      `,
      confirmButtonText: 'Cerrar'
    });
  }

  handleNewProduct(): void {
    if (this.userRole !== 'admin') {
      Swal.fire('Acceso denegado', 'No tienes permisos para crear productos', 'error');
      return;
    }
    
    Swal.fire({
      title: 'Nuevo producto',
      html: `
        <form id="newProductForm" class="text-start">
          <div class="mb-3">
            <label for="item" class="form-label">Nombre del producto*</label>
            <input type="text" class="form-control" id="item" placeholder="Nombre del producto">
          </div>
          <div class="mb-3">
            <label for="type" class="form-label">Tipo*</label>
            <input type="text" class="form-control" id="type" placeholder="Tipo de producto">
          </div>
          <div class="mb-3">
            <label for="code" class="form-label">Código (opcional)</label>
            <div class="input-group">
              <input type="text" class="form-control" id="code" placeholder="Código personalizado o automático">
              <div class="form-text text-muted w-100">Si lo dejas vacío, se generará automáticamente.</div>
            </div>
          </div>
          <div class="mb-3">
            <label for="stock" class="form-label">Stock inicial*</label>
            <input type="number" class="form-control" id="stock" placeholder="0" min="0" value="0">
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      didOpen: () => {
        // Establecer el foco en el primer campo
        document.getElementById('item')?.focus();
      },
      preConfirm: () => {
        // Recoger los valores del formulario
        const itemEl = document.getElementById('item') as HTMLInputElement;
        const typeEl = document.getElementById('type') as HTMLInputElement;
        const codeEl = document.getElementById('code') as HTMLInputElement;
        const stockEl = document.getElementById('stock') as HTMLInputElement;
        
        // Validación
        if (!itemEl.value.trim()) {
          Swal.showValidationMessage('El nombre del producto es obligatorio');
          return false;
        }
        
        if (!typeEl.value.trim()) {
          Swal.showValidationMessage('El tipo de producto es obligatorio');
          return false;
        }
        
        // El código ahora es opcional, solo validamos si el usuario ingresó algo
        const codeValue = codeEl.value.trim();
        if (codeValue && this.isCodeDuplicate(codeValue)) {
          Swal.showValidationMessage('Este código ya existe. Por favor, utiliza otro código o déjalo vacío para generación automática.');
          return false;
        }
        
        // Crear el objeto producto
        const newProduct: any = {
          item: itemEl.value.trim(),
          type: typeEl.value.trim(),
          stock: parseInt(stockEl.value) || 0
        };
        
        // Solo añadir el código si el usuario lo proporcionó
        if (codeValue) {
          newProduct.code = codeValue;
        }
        
        return newProduct;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.createProduct(result.value);
      }
    });
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
    
    console.log('Editar producto:', product);
    Swal.fire({
      title: 'Editar producto',
      text: 'Esta funcionalidad está en desarrollo',
      icon: 'info',
      confirmButtonText: 'OK'
    });
  }

  handleDeleteProduct(product: IProduct): void {
    // Verificar que el usuario es admin
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
        this.productService.delete(product._id as string).subscribe({
          next: () => {
            this.products = this.products.filter(p => p._id !== product._id);
            
            Swal.fire(
              '¡Eliminado!',
              'El producto ha sido eliminado correctamente',
              'success'
            );
          },
          error: (err) => {
            console.error('Error eliminando producto:', err);
            Swal.fire(
              'Error',
              'No se pudo eliminar el producto',
              'error'
            );
          }
        });
      }
    });
  }
}