import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../models/product';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-product-form',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css'],
})
export class ProductFormComponent {
  model: Partial<Product> = { name: '', category: '', quantity: 0, price: 0 };
  editId: number | null = null;

  // categories derived from current inventory
  categories: string[] = [];

  // temporary holder for a user-typed category when selecting 'Other'
  otherCategory = '';

  constructor(private route: ActivatedRoute, private router: Router, private svc: InventoryService, private auth: AuthService) {
    this.route.paramMap.subscribe(pm => {
      const idStr = pm.get('id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        this.editId = id;
        this.svc.getProducts().subscribe(list => {
          const found = list.find(p => p.id === id);
          if (found) this.model = { ...found };
        });
      }
    });

    // compute unique categories for the dropdown
    this.svc.getProducts().subscribe(list => {
      const cats = Array.from(new Set(list.map(p => p.category).filter(Boolean)));
      this.categories = cats;
    });
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;
    const f = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      // store base64 preview on model for now
      (this.model as any)['image'] = reader.result as string;
    };
    reader.readAsDataURL(f);
  }

  save(form?: any) {
    // If template-driven form is passed, validate before proceeding
    if (form && form.invalid) {
      // mark all controls as touched so validation messages appear
      Object.keys(form.controls || {}).forEach(k => {
        const c = form.controls[k];
        if (c && typeof c.markAsTouched === 'function') c.markAsTouched();
      });
      return;
    }
    // determine final category: either typed otherCategory or the selected one
    const finalCategory = this.model.category === '__other' ? (this.otherCategory || '') : (this.model.category || '');

    const payload = {
      id: this.editId ?? 0,
      name: this.model.name || '',
      category: finalCategory,
      quantity: Number(this.model.quantity) || 0,
      price: Math.round(Number(this.model.price) || 0),
    } as Product;

    if (this.editId) {
      this.svc.updateProduct(payload);
      // navigate back with update notification
      this.router.navigate(['/products'], { state: { notification: 'Product updated successfully' } });
    } else {
      this.svc.addProduct(payload);
      // navigate back with add notification
      this.router.navigate(['/products'], { state: { notification: 'Product added successfully' } });
    }

    // ensure categories list reflects the newly created category immediately
    if (finalCategory) {
      const set = new Set(this.categories.filter(Boolean));
      set.add(finalCategory);
      this.categories = Array.from(set);
    }

    // navigation already performed with notification state above
  }

  cancel() {
    this.router.navigate(['/products']);
  }

  get isAdmin() {
    return this.auth.getRole() === 'admin';
  }
}
