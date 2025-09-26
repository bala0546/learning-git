import { Injectable, OnDestroy } from '@angular/core';
import { InventoryService } from '../inventory/inventory.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StockService implements OnDestroy {
  private timer: any = null;
  private latestChangeSubject = new BehaviorSubject<{ id: number; time: number } | null>(null);
  latestChange$ = this.latestChangeSubject.asObservable();

  constructor(private inventory: InventoryService) {}

  startSimulation(intervalMs = 2000) {
    if (this.timer) return;
    this.timer = setInterval(() => this._tick(), intervalMs);
  }

  stopSimulation() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private _tick() {
    const products = this.inventory.getSnapshot();
    if (!products.length) return;
    const idx = Math.floor(Math.random() * products.length);
    const product = products[idx];
    // random delta between -5 and +5
    const delta = Math.floor(Math.random() * 11) - 5;
    if (delta === 0) return;
    this.inventory.changeQuantity(product.id, delta);
    this.latestChangeSubject.next({ id: product.id, time: Date.now() });
  }

  ngOnDestroy(): void {
    this.stopSimulation();
  }
}
