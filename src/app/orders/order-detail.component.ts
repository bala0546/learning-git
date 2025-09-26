import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from './order.service';
import { Order } from '../models/order';

@Component({
  standalone: true,
  selector: 'app-order-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css'],
})
export class OrderDetailComponent {
  order: Order | null = null;

  constructor(private route: ActivatedRoute, private svc: OrderService) {
    this.route.paramMap.subscribe(pm => {
      const idStr = pm.get('id');
      if (!idStr) return;
      const id = parseInt(idStr, 10);
      this.svc.getOrders().subscribe(list => {
        this.order = list.find(o => o.id === id) ?? null;
      });
    });
  }
}
