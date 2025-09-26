import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { SupplierService } from './supplier.service';
import { Supplier } from '../models/supplier';

@Component({
  standalone: true,
  selector: 'app-supplier-form',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './supplier-form.component.html',
  styleUrls: ['./supplier-form.component.css'],
})
export class SupplierFormComponent {
  model: Partial<Supplier> = { name: '', contact: '', email: '', phone: '', address: '' };
  editId: number | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private svc: SupplierService) {
    this.route.paramMap.subscribe(pm => {
      const idStr = pm.get('id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        this.editId = id;
        this.svc.getSuppliers().subscribe(list => {
          const found = list.find(s => s.id === id);
          if (found) this.model = { ...found };
        });
      }
    });
  }

  save(form?: any) {
    // mark all controls touched so validation messages appear
    if (form) {
      Object.values(form.controls || {}).forEach((c: any) => c.markAsTouched());
    }

    // extra phone validation: ensure 10 digits and starts with 6-9
    const rawPhone = (this.model.phone || '').toString();
    const tenDigit = rawPhone.replace(/[^0-9]/g, '');
    const phoneControl = form?.controls?.['phone'];
    const phoneValid = tenDigit.length === 10 && /^[6-9]/.test(tenDigit);
    if (!phoneValid) {
      if (phoneControl?.control && typeof phoneControl.control.setErrors === 'function') {
        phoneControl.control.setErrors({ pattern: true });
        phoneControl.control.markAsTouched();
      }
    }

    // if overall form invalid (including phone) do not proceed
    if (form && form.invalid) {
      return;
    }

    // normalize 10-digit numbers to +91 format
    let phone = rawPhone;
    if (tenDigit.length === 10) phone = '+91-' + tenDigit;

    const payload = {
      id: this.editId ?? 0,
      name: this.model.name || '',
      contact: this.model.contact || '',
      email: this.model.email || '',
      phone: phone,
      address: this.model.address || '',
    } as Supplier;

    if (this.editId) {
      this.svc.updateSupplier(payload);
      this.router.navigate(['/suppliers'], { state: { notification: 'Supplier updated successfully' } });
    } else {
      this.svc.addSupplier(payload);
      this.router.navigate(['/suppliers'], { state: { notification: 'Supplier added successfully' } });
    }

    // navigation already performed with notification state above
  }

  cancel() {
    this.router.navigate(['/suppliers']);
  }
}
