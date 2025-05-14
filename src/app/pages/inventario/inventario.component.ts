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
          console.log('Productos recibidos:', products);
          this.products = products;
          this.filteredProducts = [...products]; // Inicializar filteredProducts con todos los productos
        },
        error: (err) => {
          console.error('Error al cargar productos:', err);
          this.error = true;
          this.errorMessage = 'No se pudieron cargar los productos. Por favor, inténtalo de nuevo más tarde.';
        }
      });
  }

  // Nuevo método para cargar estadísticas
  loadInventoryStats(): void {
    this.isLoadingStats = true;
    this.statsError = false;
    
    this.productService.getInventoryStatus().subscribe({
      next: (data) => {
        // Calcular totales
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

  // Método para aplicar la búsqueda
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

  // Método para limpiar la búsqueda
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