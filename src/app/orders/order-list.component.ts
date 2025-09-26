import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from './order.service';
import { Order } from '../models/order';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-order-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css'],
})
export class OrderListComponent {
  orders: Order[] = [];
  fromDate: string | null = null;
  toDate: string | null = null;
  statusOptions: Array<{ value: any; label: string }> = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'Delivered', label: 'Delivered' },
  ];
  selectedStatus: string | null = '';

  constructor(private svc: OrderService, private auth: AuthService) {
    this.svc.getOrders().subscribe(list => (this.orders = list));
  }

  get displayedOrders(): Order[] {
    let arr = [...this.orders];
    if (this.fromDate) {
      const from = new Date(this.fromDate);
      from.setHours(0, 0, 0, 0);
      arr = arr.filter(o => o.createdAt >= from.getTime());
    }
    if (this.toDate) {
      const to = new Date(this.toDate);
      to.setHours(23, 59, 59, 999);
      arr = arr.filter(o => o.createdAt <= to.getTime());
    }
    if (this.selectedStatus) {
      arr = arr.filter(o => (o.status || 'Pending') === this.selectedStatus);
    }
    return arr;
  }

  clearDateFilter() {
    this.fromDate = null;
    this.toDate = null;
  }

  clearStatusFilter() {
    this.selectedStatus = '';
  }

  remove(id: number) {
    if (!confirm('Delete this order?')) return;
    this.svc.removeOrder(id);
  }

  preventIfNotAdmin(e: Event) {
    if (!this.isAdmin) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
    return true;
  }

  get isAdmin() {
    return this.auth.getRole() === 'admin';
  }

  changeStatus(o: Order, newStatus: any) {
    // Only allow if admin
    if (!this.isAdmin) return;
    this.svc.updateOrder(o.id, { status: newStatus });
  }
}
