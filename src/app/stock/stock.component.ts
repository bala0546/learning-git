import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../models/product';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-stock',
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css'],
})
export class StockComponent implements OnDestroy {
  products: Product[] = [];
  filtered: Product[] = [];
  // pagination
  pageSize = 5;
  currentPage = 0;
  categories: string[] = [];
  query = '';
  selectedCategory = 'All';
  restockThreshold = 10; // user adjustable

  private subs = new Subscription();
  isAdmin = false;

  constructor(private inventory: InventoryService, public auth: AuthService) {
    this.subs.add(
      this.inventory.getProducts().subscribe(p => {
        this.products = p;
        this.deriveCategories();
        this.applyFilter();
      })
    );

    // reactively update admin flag when role changes
    this.subs.add(
      this.auth.role$.subscribe(r => {
        this.isAdmin = r === 'admin';
      })
    );
  }

  deriveCategories() {
    const cats = Array.from(new Set(this.products.map(x => x.category || 'Uncategorized'))).filter(Boolean);
    this.categories = ['All', ...cats];
    if (!this.categories.includes(this.selectedCategory)) this.selectedCategory = 'All';
  }

  applyFilter() {
    const q = (this.query || '').toLowerCase().trim();
    this.filtered = this.products.filter(p => {
      const matchCategory = this.selectedCategory === 'All' || (p.category || 'Uncategorized') === this.selectedCategory;
      const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
    // reset paging when filter changes
    this.currentPage = 0;
  }

  /**
   * Show only products that are below the current restockThreshold.
   * Useful for a one-click low-stock view from the UI.
   */
  filterLowStock() {
    this.filtered = this.products.filter(p => (p.quantity || 0) < this.restockThreshold);
    this.currentPage = 0;
  }

  /** Restore the normal search/category filter */
  clearLowFilter() {
    this.applyFilter();
  }

  increment(p: Product, amount = 1) {
    if (!this.isAdmin) return;
    this.inventory.changeQuantity(p.id, amount);
  }

  decrement(p: Product, amount = 1) {
    if (!this.isAdmin) return;
    this.inventory.changeQuantity(p.id, -amount);
  }

  get totalProducts() {
    return this.products.length;
  }

  get lowStockCount() {
    return this.products.filter(p => p.quantity < this.restockThreshold).length;
  }

  get totalQuantity() {
    return this.products.reduce((s, p) => s + p.quantity, 0);
  }

  get lowStockPercent(): number {
    const total = this.totalProducts || 0;
    return total ? Math.round((this.lowStockCount / total) * 100) : 0;
  }

  // Average quantity across products
  get avgQuantity(): number {
    const total = this.totalProducts;
    return total ? Math.round(this.totalQuantity / total) : 0;
  }

  // Product with highest quantity
  get topProduct(): Product | null {
    if (!this.products || !this.products.length) return null;
    return this.products.reduce((best, p) => (p.quantity > (best.quantity || 0) ? p : best), this.products[0]);
  }

  // Tile click handlers
  showAllProducts() {
    this.selectedCategory = 'All';
    this.query = '';
    this.applyFilter();
  }

  showTopProduct() {
    const tp = this.topProduct;
    if (!tp) return;
    this.query = tp.name;
    this.applyFilter();
  }

  showLowStock() {
    this.filterLowStock();
  }

  // Visual helpers for progress bars
  get maxQuantity(): number {
    // determine a reasonable max (at least 1) to normalize bars
    return this.products.reduce((m, p) => Math.max(m, p.quantity || 0), 1);
  }

  stockPercent(p: Product): number {
    const max = this.maxQuantity || 1;
    const pct = Math.round(((p.quantity || 0) / max) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  levelColor(p: Product): string {
    // color: red for below threshold, otherwise green-to-blue based on percent
    if ((p.quantity || 0) < this.restockThreshold) return 'linear-gradient(90deg,#ef4444,#f97316)';
    const pct = this.stockPercent(p);
    // interpolate hue from 120 (green) to 220 (blue)
    const hue = Math.round(120 + (220 - 120) * (pct / 100));
    return `linear-gradient(90deg,hsl(${hue} 70% 45%), hsl(${(hue+20)%360} 70% 55%))`;
  }

  // Category color generator — deterministic HSL based on category text
  categoryColor(cat?: string) {
    const s = (cat || 'uncategorized').toString();
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return `hsl(${h} 70% 50%)`;
  }

  // Pagination helpers
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get pagedProducts(): Product[] {
    const start = this.currentPage * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 0) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) this.currentPage++;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
