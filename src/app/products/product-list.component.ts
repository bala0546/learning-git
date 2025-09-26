import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../models/product';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-product-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent {
  products: Product[] = [];
  filtered: Product[] = [];
  query = '';
  categories: string[] = [];
  selectedCategory = 'All';
  notification = '';

  constructor(private svc: InventoryService, private router: Router, private auth: AuthService) {
    // When navigating to this route, pick up any navigation state (notification).
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        try {
          const nav = (history.state || {});
          if (nav && nav.notification) {
            this.notification = nav.notification;
            setTimeout(() => this.notification = '', 3500);
          }
        } catch (e) { }
      }
    });

    // initial load of products
    this.svc.getProducts().subscribe(list => {
      this.products = list;
      this.deriveCategories();
      this.applyFilter();
    });
  }

  applyFilter() {
    const q = this.query.trim().toLowerCase();
    this.filtered = this.products.filter(p => {
      const matchCategory = this.selectedCategory === 'All' || (p.category || 'Uncategorized') === this.selectedCategory;
      const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }

  deriveCategories() {
    const cats = Array.from(new Set(this.products.map(x => x.category || 'Uncategorized'))).filter(Boolean);
    this.categories = ['All', ...cats];
    if (!this.categories.includes(this.selectedCategory)) this.selectedCategory = 'All';
  }

  remove(id: number) {
    if (!confirm('Delete this product?')) return;
    this.svc.removeProduct(id);
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

  // Visual helpers
  get maxQuantity(): number {
    return this.products.reduce((m, p) => Math.max(m, p.quantity || 0), 1);
  }

  stockPercent(p: Product): number {
    const max = this.maxQuantity || 1;
    const pct = Math.round(((p.quantity || 0) / max) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  categoryColor(cat?: string) {
    const s = (cat || 'uncategorized').toString();
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return `hsl(${h} 70% 55%)`;
  }
}
