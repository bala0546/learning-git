import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Supplier } from '../models/supplier';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private suppliers$ = new BehaviorSubject<Supplier[]>([
    { id: 1, name: 'Acme Electronics', contact: 'John Doe', email: 'john@acme.com', phone: '+91-9876543210', address: '123 Industrial Way' },
    { id: 2, name: 'Cable Co.', contact: 'Rita Cable', email: 'rita@cableco.com', phone: '+91-9844010101', address: '456 Connector Ave' },
    { id: 3, name: 'Cable Community', contact: 'Rita', email: 'rita@community.com', phone: '+91-9844010101', address: '456 Connector Ave' },
  ]);

  getSuppliers(): Observable<Supplier[]> {
    return this.suppliers$.asObservable();
  }

  addSupplier(s: Supplier) {
    const current = this.suppliers$.value;
    const next = [...current, { ...s, id: this._nextId(current) }];
    this.suppliers$.next(next);
  }

  updateSupplier(updated: Supplier) {
    const next = this.suppliers$.value.map(s => (s.id === updated.id ? updated : s));
    this.suppliers$.next(next);
  }

  removeSupplier(id: number) {
    const next = this.suppliers$.value.filter(s => s.id !== id);
    this.suppliers$.next(next);
  }

  private _nextId(list: Supplier[]) {
    return list.length ? Math.max(...list.map(s => s.id)) + 1 : 1;
  }
}
