import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) },
  { path: '', canActivateChild: [AuthGuard], children: [
      { path: '', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'products', loadComponent: () => import('./products/product-list.component').then(m => m.ProductListComponent) },
      { path: 'products/new', loadComponent: () => import('./products/product-form.component').then(m => m.ProductFormComponent), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'products/:id/edit', loadComponent: () => import('./products/product-form.component').then(m => m.ProductFormComponent), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'orders', loadComponent: () => import('./orders/order-list.component').then(m => m.OrderListComponent) },
      { path: 'orders/new', loadComponent: () => import('./orders/order-form.component').then(m => m.OrderFormComponent) },
      { path: 'orders/:id', loadComponent: () => import('./orders/order-detail.component').then(m => m.OrderDetailComponent) },
      { path: 'suppliers', loadComponent: () => import('./suppliers/supplier-list.component').then(m => m.SupplierListComponent) },
      { path: 'suppliers/new', loadComponent: () => import('./suppliers/supplier-form.component').then(m => m.SupplierFormComponent), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'suppliers/:id/edit', loadComponent: () => import('./suppliers/supplier-form.component').then(m => m.SupplierFormComponent), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'suppliers/:id', loadComponent: () => import('./suppliers/supplier-detail.component').then(m => m.SupplierDetailComponent) },
      { path: 'stock', loadComponent: () => import('./stock/stock.component').then(m => m.StockComponent) },
      { path: 'purchases', loadComponent: () => import('./purchases/purchase-list.component').then(m => m.PurchaseListComponent) },
      { path: 'purchases/new', loadComponent: () => import('./purchases/purchase-form.component').then(m => m.PurchaseFormComponent), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'purchases/:id', loadComponent: () => import('./purchases/purchase-detail.component').then(m => m.PurchaseDetailComponent) },
      { path: 'reports', loadComponent: () => import('./reports/report.component').then(m => m.ReportComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
