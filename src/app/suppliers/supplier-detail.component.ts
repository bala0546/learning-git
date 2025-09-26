import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SupplierService } from './supplier.service';
import { Supplier } from '../models/supplier';

@Component({
  standalone: true,
  selector: 'app-supplier-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './supplier-detail.component.html',
  styleUrls: ['./supplier-detail.component.css'],
})
export class SupplierDetailComponent {
  supplier: Supplier | null = null;

  constructor(private route: ActivatedRoute, private svc: SupplierService) {
    this.route.paramMap.subscribe(pm => {
      const idStr = pm.get('id');
      if (!idStr) return;
      const id = parseInt(idStr, 10);
      this.svc.getSuppliers().subscribe(list => {
        this.supplier = list.find(s => s.id === id) ?? null;
      });
    });
  }
}
