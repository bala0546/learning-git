import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from './inventory.service';
import { Product } from '../models/product';

@Component({
  standalone: true,
  selector: 'app-inventory',
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css'],
})
export class InventoryComponent {
  products: Product[] = [];
  filtered: Product[] = [];
  query = '';
  showAdd = false;
  newProduct: Partial<Product> = { name: '', category: '', quantity: 0, price: 0 };

  constructor(private svc: InventoryService) {
    this.svc.getProducts().subscribe(list => {
      this.products = list;
      this.applyFilter();
    });
  }

  applyFilter() {
    const q = this.query.trim().toLowerCase();
    this.filtered = this.products.filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }

  toggleAdd() {
    this.showAdd = !this.showAdd;
  }

  add() {
    if (!this.newProduct.name) return;
    this.svc.addProduct(this.newProduct as Product);
    this.newProduct = { name: '', category: '', quantity: 0, price: 0 };
    this.showAdd = false;
  }

  remove(id: number) {
    if (!confirm('Remove product?')) return;
    this.svc.removeProduct(id);
  }
}
