import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../inventory/inventory.service';
import { SupplierService } from '../suppliers/supplier.service';
import { OrderService } from '../orders/order.service';
import { PurchaseService } from '../purchases/purchase.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  total = 0;
  lowStock = 0;
  categories = 0;
  recent: any[] = [];
  supplierCount = 0;
  orderCount = 0;
  purchaseCount = 0;

  // animated counters for dashboard cards
  animatedCounts: { total: number; lowStock: number; categories: number; supplierCount: number; orderCount: number; purchaseCount: number } = {
    total: 0,
    lowStock: 0,
    categories: 0,
    supplierCount: 0,
    orderCount: 0,
    purchaseCount: 0,
  };

  private animateOnce = false;

  constructor(
    private svc: InventoryService,
    private supplierSvc: SupplierService,
    private orderSvc: OrderService,
    private purchaseSvc: PurchaseService
  ) {
    this.svc.getProducts().subscribe(list => {
      this.total = list.length;
      this.lowStock = list.filter(p => p.quantity < 10).length;
      this.categories = new Set(list.map(p => p.category)).size;
      this.recent = list.slice(-5).reverse();

      // animate numeric KPIs
      this.animateValue('total', this.total);
      this.animateValue('lowStock', this.lowStock);
      this.animateValue('categories', this.categories);
    });

    this.supplierSvc.getSuppliers().subscribe(list => (this.supplierCount = list.length));
    this.orderSvc.getOrders().subscribe(list => (this.orderCount = list.length));
    this.purchaseSvc.getPurchases().subscribe(list => (this.purchaseCount = list.length));

    // subscribe to counts and animate when they update
    this.supplierSvc.getSuppliers().subscribe(list => this.animateValue('supplierCount', list.length));
    this.orderSvc.getOrders().subscribe(list => this.animateValue('orderCount', list.length));
    this.purchaseSvc.getPurchases().subscribe(list => this.animateValue('purchaseCount', list.length));
  }

  private animateValue(key: string, to: number, duration = 600) {
    const from = (this.animatedCounts as any)[key] || 0;
    const start = performance.now();
    const raf = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut
      (this.animatedCounts as any)[key] = Math.round(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }
}
