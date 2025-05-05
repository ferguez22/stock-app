import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { IProduct } from '../../interfaces/iproduct.interface';
import { IUser } from '../../interfaces/iuser.interface';
import { ProductTableComponent } from '../../components/product-table/product-table.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductTableComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
export class InventarioComponent implements OnInit {
  products: IProduct[] = [];
  isLoading = true;
  error = false;
  errorMessage = '';
  currentUser: IUser | null = null;
  userRole = 'user'; // Valor predeterminado
  searchTerm: string = '';

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadProducts();
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
  }

  handleViewProduct(product: IProduct): void {
    // Mostrar detalles del producto (para todos los usuarios)
    Swal.fire({
      title: product.item,
      html: `
        <div class="text-start">
          <p><strong>Tipo:</strong> ${product.type}</p>
          <p><strong>Código:</strong> ${product.code || 'N/A'}</p>
          <p><strong>En almacén:</strong> ${product.stock}</p>
          <p><strong>Fuera de almacén:</strong> ${product.outStock || 0}</p>
          <p><strong>Actualizado:</strong> ${product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar'
    });
  }

  handleEditProduct(product: IProduct): void {
    // Verificar que el usuario es admin
    if (this.userRole !== 'admin') {
      Swal.fire('Acceso denegado', 'No tienes permisos para editar productos', 'error');
      return;
    }
    
    console.log('Editar producto:', product);
    // Aquí implementarás la lógica de edición (modal, formulario, etc.)
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
    
    // Confirmar eliminación
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
        // Aquí llamas a tu servicio para eliminar el producto
        this.productService.delete(product._id as string).subscribe({
          next: () => {
            // Eliminar el producto de la lista local
            this.products = this.products.filter(p => p._id !== product._id);
            this.splitProductsByLocation(); // Actualizar ambas listas
            
            // Mostrar mensaje de éxito
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