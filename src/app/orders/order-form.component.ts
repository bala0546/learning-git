import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../inventory/inventory.service';
import { OrderService } from './order.service';
import { Product } from '../models/product';

@Component({
  standalone: true,
  selector: 'app-order-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.css'],
})
export class OrderFormComponent {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  // pagination
  pageSize = 5;
  currentPage = 0;
  categories: string[] = [];
  productQuery = '';
  selectedCategory = 'All';
  private _filterTimer: any = null;
  cart: { product: Product; qty: number }[] = [];
  // per-product quantity map to avoid input focus issues
  qtyMap: { [productId: number]: number } = {};

  // customer fields
  customerName = '';
  customerAddress = '';
  customerPhone = '';

  constructor(private inventory: InventoryService, private orderSvc: OrderService, public router: Router) {
    this.inventory.getProducts().subscribe(p => {
      this.products = p;
      // derive categories and set filtered list
      const cats = Array.from(new Set(p.map(x => x.category || 'Uncategorized'))).filter(Boolean);
      this.categories = ['All', ...cats];
      // ensure selectedCategory is valid
      if (!this.categories.includes(this.selectedCategory)) this.selectedCategory = 'All';
      this.applyFilter();
    });
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
    if (!q && (this.selectedCategory === 'All')) {
      this.filteredProducts = [...this.products];
      this.currentPage = 0;
      return;
    }
    this.filteredProducts = this.products.filter(p => {
      const matchCategory = this.selectedCategory === 'All' || (p.category || 'Uncategorized') === this.selectedCategory;
      const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
    // reset paging when filters change
    this.currentPage = 0;
  }

  // Pagination helpers
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
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

  addToCart(p: Product) {
    const raw = this.qtyMap[p.id];
    let qty = Number.isFinite(raw as any) ? Math.floor(Number(raw)) : 0;
    qty = Math.max(0, qty);
    if (!qty) return;

    const existing = this.cart.find(c => c.product.id === p.id);
    const currentInCart = existing ? existing.qty : 0;

    // Validate against available stock using latest product snapshot
    const latest = this.inventory.getSnapshot().find(x => x.id === p.id);
    const available = (latest ? latest.quantity : (p.quantity || 0)) - currentInCart;
    if (qty > available) {
      alert(`Only ${available} unit(s) of "${p.name}" available to order.`);
      return;
    }

    // push a shallow copy of the product to avoid unexpected mutation
    const prodCopy: Product = { ...p };
    if (existing) {
      existing.qty += qty;
      this.cart = this.cart.map(c => c);
    } else {
      this.cart.push({ product: prodCopy, qty });
      this.cart = [...this.cart];
    }

    // clear the qty input model
    this.qtyMap[p.id] = 0;
  }

  removeFromCart(pid: number) {
    this.cart = this.cart.filter(c => c.product.id !== pid);
  }

  get total() {
    return this.cart.reduce((s, c) => s + Math.round(c.product.price) * c.qty, 0);
  }

  submit(form?: any) {
    // mark controls touched so validation messages show
    if (form) Object.values(form.controls || {}).forEach((c: any) => c.markAsTouched());

    if (!this.cart.length) return alert('Cart empty');

    // validate customer info
    if (!this.customerName.trim()) {
      alert('Please enter customer name');
      const el = document.getElementsByName('customerName')[0] as HTMLElement | undefined;
      if (el && typeof el.focus === 'function') el.focus();
      return;
    }
    if (!this.customerAddress.trim()) {
      alert('Please enter customer address');
      const el = document.getElementsByName('customerAddress')[0] as HTMLElement | undefined;
      if (el && typeof el.focus === 'function') el.focus();
      return;
    }

    const rawPhone = (this.customerPhone || '').toString();
    const tenDigit = rawPhone.replace(/[^0-9]/g, '');
    const phoneValid = tenDigit.length === 10 && /^[6-9]/.test(tenDigit);
    const phoneControl = form?.controls?.['customerPhone'];
    if (!phoneValid) {
      if (phoneControl?.control && typeof phoneControl.control.setErrors === 'function') {
        phoneControl.control.setErrors({ pattern: true });
        phoneControl.control.markAsTouched();
      }
      alert('Please enter a valid phone number');
      const el = document.getElementsByName('customerPhone')[0] as HTMLElement | undefined;
      if (el && typeof el.focus === 'function') el.focus();
      return;
    }

    if (form && form.invalid) return; // stop if validation failed

    // Re-validate stock against latest snapshot to avoid race conditions
    const snapshot = this.inventory.getSnapshot();
    for (const c of this.cart) {
      const prod = snapshot.find(p => p.id === c.product.id);
      if (!prod) return alert(`Product ${c.product.name} no longer available.`);
      if (c.qty > prod.quantity) {
        return alert(`Cannot place order: requested ${c.qty} of "${c.product.name}" but only ${prod.quantity} available.`);
      }
    }

    // normalize phone
    let phone = rawPhone;
    if (tenDigit.length === 10) phone = '+91-' + tenDigit;

    const order = {
      items: this.cart.map(c => ({ productId: c.product.id, name: c.product.name, quantity: c.qty, price: c.product.price })),
      total: this.total,
      customer: { name: this.customerName.trim(), address: this.customerAddress.trim(), phone: phone },
    };
    this.orderSvc.createOrder(order as any);
    this.router.navigate(['/orders']);
  }
}
