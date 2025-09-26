import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private products$ = new BehaviorSubject<Product[]>([
    { id: 1, name: 'Wireless Mouse', category: 'Accessories', quantity: 120, price: 20 },
    { id: 2, name: 'Mechanical Keyboard', category: 'Accessories', quantity: 45, price: 90 },
    { id: 3, name: '27" Monitor', category: 'Displays', quantity: 18, price: 199 },
    { id: 4, name: 'USB-C Cable', category: 'Cables', quantity: 500, price: 5 },
    { id: 5, name: 'Laptop Stand', category: 'Accessories', quantity: 8, price: 34 },
    { id: 6, name: 'Bluetooth Speaker', category: 'Audio', quantity: 60, price: 45 },
    { id: 7, name: 'Webcam 1080p', category: 'Cameras', quantity: 30, price: 65 },
    { id: 8, name: 'External SSD 1TB', category: 'Storage', quantity: 25, price: 120 },
    { id: 9, name: 'HDMI Cable', category: 'Cables', quantity: 250, price: 8 },
    { id: 10, name: 'Gaming Chair', category: 'Furniture', quantity: 12, price: 150 },
  ]);

  constructor(private auth: AuthService) {}

  getProducts(): Observable<Product[]> {
    return this.products$.asObservable();
  }

  addProduct(product: Product) {
    const current = this.products$.value;
    const next = [...current, { ...product, id: this._nextId(current) }];
    this.products$.next(next);
  }

  updateProduct(updated: Product) {
    const next = this.products$.value.map(p => (p.id === updated.id ? updated : p));
    this.products$.next(next);
  }

  removeProduct(id: number) {
    const next = this.products$.value.filter(p => p.id !== id);
    this.products$.next(next);
  }

  changeQuantity(id: number, delta: number) {
    // enforce admin-only at service level to prevent UI bypass
    if (!this.auth.isAdmin()) return;

    const next = this.products$.value.map(p =>
      p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p
    );
    this.products$.next(next);
  }

  setQuantity(id: number, quantity: number) {
    const next = this.products$.value.map(p => (p.id === id ? { ...p, quantity: Math.max(0, quantity) } : p));
    this.products$.next(next);
  }

  getSnapshot(): Product[] {
    return this.products$.value;
  }

  private _nextId(list: Product[]) {
    return list.length ? Math.max(...list.map(p => p.id)) + 1 : 1;
  }
}
