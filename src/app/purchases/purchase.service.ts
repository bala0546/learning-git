import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Purchase } from '../models/purchase';
import { InventoryService } from '../inventory/inventory.service';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private purchases$ = new BehaviorSubject<Purchase[]>([
    {
      id: 1,
      supplierId: 1,
      items: [{ productId: 1, name: 'USB-C Cable', quantity: 50, price: 120 }],
      total: 50 * 120, // 6000
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
    {
      id: 2,
      supplierId: 2,
      items: [{ productId: 2, name: 'HDMI Cable', quantity: 30, price: 200 }],
      total: 30 * 200, // 6000
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: 3,
      supplierId: 1,
      items: [{ productId: 3, name: 'Ethernet Cable', quantity: 100, price: 80 }],
      total: 100 * 80, // 8000
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    },
  ]);

  constructor(private inventory: InventoryService) {}

  getPurchases(): Observable<Purchase[]> {
    return this.purchases$.asObservable();
  }

  createPurchase(p: Omit<Purchase, 'id' | 'createdAt' | 'status'>) {
    const current = this.purchases$.value;
    const id = current.length ? Math.max(...current.map(x => x.id)) + 1 : 1;
    const newPurchase: Purchase = {
      ...p,
      id,
      createdAt: Date.now(),
    };
    // increase stock for each item
    newPurchase.items.forEach(i => this.inventory.changeQuantity(i.productId, Math.abs(i.quantity)));
    this.purchases$.next([...current, newPurchase]);
    return newPurchase;
  }

  removePurchase(id: number) {
    const next = this.purchases$.value.filter(po => po.id !== id);
    this.purchases$.next(next);
  }
}
