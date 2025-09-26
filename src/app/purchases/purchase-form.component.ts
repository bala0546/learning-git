import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PurchaseService } from './purchase.service';
import { SupplierService } from '../suppliers/supplier.service';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../models/product';

@Component({
  standalone: true,
  selector: 'app-purchase-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-form.component.html',
  styleUrls: ['./purchase-form.component.css'],
})
export class PurchaseFormComponent {
  suppliers: any[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  productQuery = '';
  selectedCategory = 'All';
  categories: string[] = [];
  private _filterTimer: any = null;
  // pagination for products list
  pageSize = 5;
  currentPage = 0;
  supplierId: number | null = null;
  cart: { product: Product; qty: number; price: number }[] = [];

  constructor(private svc: PurchaseService, private supplierSvc: SupplierService, private inv: InventoryService, private router: Router) {
    this.supplierSvc.getSuppliers().subscribe(s => (this.suppliers = s));
    this.inv.getProducts().subscribe(p => {
      this.products = p;
      // derive categories
      const cats = Array.from(new Set(p.map(x => (x.category || 'Uncategorized')))).filter(Boolean);
      this.categories = ['All', ...cats];
      if (!this.categories.includes(this.selectedCategory)) this.selectedCategory = 'All';
      this.applyFilter();
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.products.length / this.pageSize));
  }

  get pagedProducts(): Product[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 0) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) this.currentPage++;
  }

  addToCart(p: Product, qtyInput: HTMLInputElement, priceInput?: HTMLInputElement) {
    const qty = Number(qtyInput?.value) || 0;
    if (!qty) return;
    const rawPrice = priceInput ? Number(priceInput.value) || 0 : Number(p.price) || 0;
    const price = Math.round(rawPrice);
    const existing = this.cart.find(c => c.product.id === p.id && c.price === price);
    if (existing) existing.qty += qty;
    else this.cart.push({ product: p, qty, price });
    if (qtyInput) qtyInput.value = '0';
    if (priceInput) priceInput.value = '0';
  }

  removeFromCart(pid: number) {
    this.cart = this.cart.filter(c => c.product.id !== pid);
  }

  get total() {
    return this.cart.reduce((s, c) => s + Math.round(c.price) * c.qty, 0);
  }

  submit() {
    if (!this.cart.length) return alert('Cart empty');
    if (!this.supplierId) return alert('Select supplier');
    const purchase = {
      supplierId: this.supplierId,
      items: this.cart.map(c => ({ productId: c.product.id, name: c.product.name, quantity: c.qty, price: Math.round(c.price) })),
      total: this.total,
    };
    this.svc.createPurchase(purchase as any);
    this.router.navigate(['/purchases']);
  }

  cancel() {
    this.router.navigate(['/purchases']);
  }

  onProductQueryChange(value: string) {
    this.productQuery = value || '';
    if (this._filterTimer) clearTimeout(this._filterTimer);
    this._filterTimer = setTimeout(() => this.applyFilter(), 180);
  }

  onCategoryChange(value: string) {
    this.selectedCategory = value || 'All';
    this.applyFilter();
  }

  applyFilter() {
    const q = (this.productQuery || '').toLowerCase().trim();
    if (!q && this.selectedCategory === 'All') {
      this.filteredProducts = [...this.products];
      this.currentPage = 0;
      return;
    }
    this.filteredProducts = this.products.filter(p => {
      const matchCategory = this.selectedCategory === 'All' || (p.category || 'Uncategorized') === this.selectedCategory;
      const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
    this.currentPage = 0;
  }
}
