import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { HistorialTransaccionesComponent } from './pages/historial-transacciones/historial-transacciones.component';
import { Error404Component } from './pages/error404/error404.component';
import { CodigosComponent } from './pages/codigos/codigos.component';
import { EscanerComponent } from './pages/escaner/escaner.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

export const routes: Routes = [
  {
    path: '', component: MainLayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'historial', component: HistorialTransaccionesComponent },
      { path: 'inventario', component: InventarioComponent },
      { path: 'codigos', component: CodigosComponent },
      { path: 'escaner', component: EscanerComponent },
      { path: 'perfil', component: PerfilComponent},
      
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ]
  },
  { path: 'login', component: LoginComponent },
  { path: 'error404', component: Error404Component },
  { path: '**', redirectTo: 'error404' }
];
