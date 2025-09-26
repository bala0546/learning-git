import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order } from '../models/order';
import { InventoryService } from '../inventory/inventory.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private orders$ = new BehaviorSubject<Order[]>(
    [
      {
        id: 1,
        customer: { name: 'Alice', phone: '+91-9000000001', address: 'Flat 12B, Green Apartments, MG Road, City' },
        items: [{ productId: 1, name: 'USB-C Cable', quantity: 2, price: 220 }],
        total: 2 * 220, // 440
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
        status: 'Pending'
      },
      {
        id: 2,
        customer: { name: 'Bob', phone: '+91-9000000002', address: '9 Lakeside Avenue, Block B, City' },
        items: [{ productId: 2, name: 'HDMI Cable', quantity: 1, price: 350 }],
        total: 1 * 350, // 350
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
        shipment: { carrier: 'FastShip', trackingNumber: 'FS123' },
        status: 'Shipped'
      },
    ]
  );
  constructor(private inventory: InventoryService) {
    // Deduct seeded order quantities from inventory so stock reflects them
    this.orders$.value.forEach(o => {
      o.items.forEach(i => this.inventory.changeQuantity(i.productId, -Math.abs(i.quantity)));
    });
  }

  getOrders(): Observable<Order[]> {
    return this.orders$.asObservable();
  }

  createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status' | 'shipment'>) {
    const current = this.orders$.value;
    const id = current.length ? Math.max(...current.map(o => o.id)) + 1 : 1;
    const newOrder: Order = {
      ...order,
      id,
      createdAt: Date.now(),
      status: 'Pending',
    };

    // deduct stock
    newOrder.items.forEach(i => this.inventory.changeQuantity(i.productId, -Math.abs(i.quantity)));

    this.orders$.next([...current, newOrder]);
    return newOrder;
  }

  updateOrder(id: number, changes: Partial<Order>) {
    const current = this.orders$.value;
    const idx = current.findIndex(o => o.id === id);
    if (idx === -1) return null;
    const updated = { ...current[idx], ...changes };
    const next = [...current];
    next[idx] = updated;
    this.orders$.next(next);
    return updated;
  }

  removeOrder(id: number) {
    const next = this.orders$.value.filter(o => o.id !== id);
    this.orders$.next(next);
  }
}
