import { Injectable } from '@angular/core';
import { Order } from '../models/order';
import { Product } from '../models/product';
import { Purchase } from '../models/purchase';

export interface ReportSnapshot {
  totalSales: number;
  ordersCount: number;
  avgOrderValue: number;
  stockValue: number;
  lowStockCount: number;
  topProducts: { id: number; name: string; sold: number }[];
  salesByCategory: { category: string; value: number }[];
  inventoryByCategory: { category: string; qty: number }[]; // NEW
  // purchases info
  purchasesTotal?: number;
  purchasesCount?: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  generate(orders: Order[], products: Product[], purchases: Purchase[] = []): ReportSnapshot {
    const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
    const ordersCount = orders.length;
    const avgOrderValue = ordersCount ? totalSales / ordersCount : 0;
    const stockValue = products.reduce((s, p) => s + Math.round(p.price) * p.quantity, 0);
    const lowStockCount = products.filter(p => p.quantity < 10).length;

    const soldMap = new Map<number, number>();
    orders.forEach(o => o.items.forEach(it => soldMap.set(it.productId, (soldMap.get(it.productId) || 0) + it.quantity)));

    const topProducts = Array.from(soldMap.entries())
      .map(([id, sold]) => ({ id, name: products.find(p => p.id === id)?.name || String(id), sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6);

    // sales by category (sum of price * qty grouped by product.category)
    const categoryMap = new Map<string, number>();
    orders.forEach(o =>
      o.items.forEach(it => {
        const prod = products.find(p => p.id === it.productId);
        const cat = prod?.category || 'Uncategorized';
        const value = Math.round((it.price || 0) * it.quantity);
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + value);
      })
    );
    const salesByCategory = Array.from(categoryMap.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // inventory by category (sum of quantities grouped by product.category)
    const invMap = new Map<string, number>();
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      invMap.set(cat, (invMap.get(cat) || 0) + (p.quantity || 0));
    });
    const inventoryByCategory = Array.from(invMap.entries())
      .map(([category, qty]) => ({ category, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    // purchases metrics
    const purchasesTotal = (purchases || []).reduce((s, p) => s + (p.total || 0), 0);
    const purchasesCount = (purchases || []).length;

    return { totalSales, ordersCount, avgOrderValue, stockValue, lowStockCount, topProducts, salesByCategory, inventoryByCategory, purchasesTotal, purchasesCount };
  }
}
