import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierService } from './supplier.service';
import { Supplier } from '../models/supplier';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-supplier-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.css'],
})
export class SupplierListComponent {
  suppliers: Supplier[] = [];
  filtered: Supplier[] = [];
  query = '';
  notification = '';

  constructor(private svc: SupplierService, private router: Router, private auth: AuthService) {
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        try {
          const nav = (history.state || {});
          if (nav && nav.notification) {
            this.notification = nav.notification;
            setTimeout(() => this.notification = '', 3500);
          }
        } catch (e) {}
      }
    });

    this.svc.getSuppliers().subscribe(list => {
      this.suppliers = list;
      this.applyFilter();
    });
  }

  applyFilter() {
    const q = (this.query || '').toLowerCase().trim();
    if (!q) {
      this.filtered = [...this.suppliers];
      return;
    }
    this.filtered = this.suppliers.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.contact || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.address || '').toLowerCase().includes(q)
    );
  }

  remove(id: number) {
    if (!confirm('Delete supplier?')) return;
    this.svc.removeSupplier(id);
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
