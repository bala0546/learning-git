import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from './purchase.service';
import { Purchase } from '../models/purchase';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-purchase-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.css'],
})
export class PurchaseListComponent {
  purchases: Purchase[] = [];
  filtered: Purchase[] = [];
  query = '';
  sortBy: 'created' | 'supplier' = 'created';
  sortDir: 'asc' | 'desc' = 'desc';
  fromDate: string | null = null;
  toDate: string | null = null;

  constructor(private svc: PurchaseService, private auth: AuthService) {
    this.svc.getPurchases().subscribe(list => {
      this.purchases = list;
      this.applyFilterAndSort();
    });
  }

  applyFilterAndSort() {
    const q = (this.query || '').toLowerCase().trim();
    this.filtered = this.purchases
      .filter(p => {
        const supplierStr = String(p.supplierId || '').toLowerCase();
        const itemsStr = (p.items || [])
          .map(i => (i.name || i.productId).toString())
          .join(' ')
          .toLowerCase();
        return (
          !q ||
          supplierStr.includes(q) ||
          itemsStr.includes(q) ||
          String(p.id).includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (this.sortBy === 'created') cmp = a.createdAt - b.createdAt;
        if (this.sortBy === 'supplier') cmp = (a.supplierId || 0) - (b.supplierId || 0);
        return this.sortDir === 'asc' ? cmp : -cmp;
      });

    // apply date range filtering if set
    if (this.fromDate) {
      const from = new Date(this.fromDate);
      from.setHours(0, 0, 0, 0);
      this.filtered = this.filtered.filter(p => p.createdAt >= from.getTime());
    }
    if (this.toDate) {
      const to = new Date(this.toDate);
      to.setHours(23, 59, 59, 999);
      this.filtered = this.filtered.filter(p => p.createdAt <= to.getTime());
    }
  }

  setSort(by: 'created' | 'supplier') {
    if (this.sortBy === by) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else this.sortBy = by as any;
    this.applyFilterAndSort();
  }

  remove(id: number) {
    if (!confirm('Delete this purchase?')) return;
    this.svc.removePurchase(id);
  }

  // Clear date range filters and refresh the list
  clearDateFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.applyFilterAndSort();
  }

  get displayedPurchases(): Purchase[] {
    return this.filtered;
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
}
