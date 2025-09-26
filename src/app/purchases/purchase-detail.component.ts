import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PurchaseService } from './purchase.service';
import { Purchase } from '../models/purchase';

@Component({
  standalone: true,
  selector: 'app-purchase-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './purchase-detail.component.html',
  styleUrls: ['./purchase-detail.component.css'],
})
export class PurchaseDetailComponent {
  purchase: Purchase | null = null;

  constructor(private route: ActivatedRoute, private svc: PurchaseService) {
    this.route.paramMap.subscribe(pm => {
      const idStr = pm.get('id');
      if (!idStr) return;
      const id = parseInt(idStr, 10);
      this.svc.getPurchases().subscribe(list => {
        this.purchase = list.find(p => p.id === id) ?? null;
      });
    });
  }
}
