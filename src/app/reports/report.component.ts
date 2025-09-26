import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { InventoryService } from '../inventory/inventory.service';
import { OrderService } from '../orders/order.service';
import { PurchaseService } from '../purchases/purchase.service';
import { ReportService, ReportSnapshot } from './report.service';

@Component({
  standalone: true,
  selector: 'app-report',
  imports: [CommonModule],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
})
export class ReportComponent implements OnInit, OnDestroy {
  snapshot: ReportSnapshot | null = null;
  // Fallback sample data so donut shows even when there is no real data
  sampleInventory = [
    { category: 'Accessories', qty: 120 },
    { category: 'Electronics', qty: 80 },
    { category: 'Home', qty: 40 }
  ];
  sampleSales = [
    { category: 'Accessories', value: 125000 },
    { category: 'Electronics', value: 80000 },
    { category: 'Home', value: 35000 }
  ];

  // Display arrays used by template; point to snapshot arrays or fallbacks
  displayInventoryByCategory: { category: string; qty: number }[] = [];
  displaySalesByCategory: { category: string; value: number }[] = [];

  // slices for charts (simple typed shape used in this component)
  inventorySlices: Array<{ d: string; color: string; label: string; value: number }> = [];
  salesSlices: Array<{ category: string; value: number; frac: number }> = [];

  // CSS gradient strings for fallback donut rendering
  inventoryGradient = '';

  // new UI helpers
  recentOrders: Array<{ id: number; total: number; date: number; count: number }> = [];
  recentPurchases: Array<{ id: number; total: number; date: number; count: number }> = [];
  salesGrowth: number | null = null; // percent (positive or negative)
  purchasesTotal: number | null = null;

  // stock sparkline data (net change over recent days)
  stockSpark: Array<{ label: string; date: number; net: number; cum: number }> = [];
  sparkMax = 1;
  sparkPoints = '';

  // animated metrics for the top cards
  animatedTotals: { totalSales: number; ordersCount: number; avgOrderValue: number; purchasesTotal: number; purchasesCount: number } = {
    totalSales: 0,
    ordersCount: 0,
    avgOrderValue: 0,
    purchasesTotal: 0,
    purchasesCount: 0,
  };

  // maximum sold used by mini-bars
  maxSold = 1;

  private sub = new Subscription();
  // dashboard entrance animation flag (triggered once after first data load)
  animate = false;

  constructor(private inv: InventoryService, private orders: OrderService, private purchases: PurchaseService, private reportSvc: ReportService) {
    // keep constructor lightweight; subscriptions are handled in ngOnInit
  }

  ngOnInit(): void {
    this.sub = combineLatest([
      this.inv.getProducts(),
      this.orders.getOrders(),
      this.purchases.getPurchases()
    ])
      .pipe(debounceTime(10))
      .subscribe(([products, orders, purchases]) => {
        this.snapshot = this.reportSvc.generate(orders, products, purchases || []);

        // ensure display arrays exist so the donut & legends render
        this.displayInventoryByCategory = (this.snapshot?.inventoryByCategory && this.snapshot.inventoryByCategory.length)
          ? this.snapshot.inventoryByCategory
          : this.sampleInventory;
        this.displaySalesByCategory = (this.snapshot?.salesByCategory && this.snapshot.salesByCategory.length)
          ? this.snapshot.salesByCategory
          : this.sampleSales;

        // compute max sold for mini-bars (from snapshot.topProducts)
        this.maxSold = Math.max(1, ...(this.snapshot?.topProducts?.map(tp => tp.sold || 0) || [1]));

        this.computeSlices();
        this.animateMetricsFromSnapshot();

        // recent orders (latest 5)
        const sorted = (orders || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        this.recentOrders = sorted.slice(0, 5).map(o => ({ id: o.id, total: o.total || 0, date: o.createdAt || 0, count: (o.items || []).reduce((s, it) => s + (it.quantity || 0), 0) }));

        // recent purchases (latest 5)
        const psorted = (purchases || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        this.recentPurchases = psorted.slice(0, 5).map(p => ({ id: p.id, total: p.total || 0, date: p.createdAt || 0, count: (p.items || []).reduce((s, it) => s + (it.quantity || 0), 0) }));

        // purchases totals
        this.purchasesTotal = this.snapshot?.purchasesTotal ?? 0;

        // sales growth: compare last 30 days vs previous 30 days
        this.computeSalesGrowth(orders || []);

        // compute stock sparkline (last 14 days)
        this.computeStockSparkline(orders || [], purchases || [], 14);

        // trigger entrance animation once after data loads
        if (!this.animate) setTimeout(() => (this.animate = true), 140);
      });
  }

  getColor(idx: number) {
    const palette = ['#5B8DEF', '#F6C85F', '#6CE2B4', '#F28B82', '#A78BFA', '#FF9F40'];
    return palette[idx % palette.length];
  }

  // return percent (0..100) of sold relative to maxSold used by the grid mini-bars
  getSoldPercent(sold: number): number {
    return this.maxSold ? Math.round((sold / this.maxSold) * 100) : 0;
  }

  // small helper to create initials for a product placeholder avatar
  getInitials(name: string | undefined): string {
    if (!name) return '??';
    return name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private computeSalesGrowth(orders: any[]) {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const last30Start = now - 30 * DAY;
    const prev30Start = now - 60 * DAY;
    const prev30End = last30Start - 1;

    const sumInRange = (from: number, to: number) =>
      orders
        .filter(o => o.createdAt >= from && o.createdAt <= to)
        .reduce((s, o) => s + (o.total || 0), 0);

    const lastTotal = sumInRange(last30Start, now);
    const prevTotal = sumInRange(prev30Start, prev30End);

    if (prevTotal === 0) {
      this.salesGrowth = lastTotal === 0 ? 0 : 100;
    } else {
      this.salesGrowth = Math.round(((lastTotal - prevTotal) / prevTotal) * 100);
    }
  }

  private computeSlices() {
    const inv = this.displayInventoryByCategory || [];
    const sales = this.displaySalesByCategory || [];
    const totalInv = inv.reduce((s, i) => s + (i.qty || 0), 0) || 1;
    const totalSales = sales.reduce((s, i) => s + (i.value || 0), 0) || 1;

    // build inventory SVG slices with path and color
    let start = 0;
    this.inventorySlices = inv.map((it, idx) => {
      const frac = (it.qty || 0) / totalInv;
      const d = this.slicePath(100, 100, 80, start, start + frac);
      const color = this.getColor(idx);
      start += frac;
      return { d, color, label: it.category, value: it.qty };
    });
    this.salesSlices = sales.map((it) => ({
      category: it.category,
      value: it.value,
      frac: (it.value || 0) / totalSales,
    }));

    // build conic-gradient-like string for donut fallback
    let invAccum = 0;
    const invParts: string[] = [];
    this.inventorySlices.forEach((s, idx) => {
      const frac = (s.value || 0) / totalInv;
      const segStart = invAccum;
      invAccum += frac;
      const color = this.getColor(idx);
      invParts.push(`${color} ${segStart * 100}% ${invAccum * 100}%`);
    });
    this.inventoryGradient = `conic-gradient(${invParts.join(',')})`;
  }

  // create an SVG path for a donut/pie slice in viewBox 0..200 with center at cx,cy
  private slicePath(cx: number, cy: number, r: number, startFrac: number, endFrac: number) {
    const twoPi = Math.PI * 2;
    const startAngle = startFrac * twoPi - Math.PI / 2; // start at top
    const endAngle = endFrac * twoPi - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
    // move to center, line to start, arc to end, close
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  private animateValue(key: string, to: number, duration = 800) {
    const from = (this.animatedTotals as any)[key] || 0;
    const start = performance.now();
    const raf = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad-ish
      (this.animatedTotals as any)[key] = Math.round(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  private animateMetricsFromSnapshot() {
    const s = this.snapshot;
    if (!s) return;
    this.animateValue('totalSales', Math.round(s.totalSales || 0));
    this.animateValue('ordersCount', s.ordersCount || 0);
    this.animateValue('avgOrderValue', Math.round(s.avgOrderValue || 0));
    this.animateValue('purchasesTotal', Math.round(s.purchasesTotal || 0));
    this.animateValue('purchasesCount', s.purchasesCount || 0);
  }

  private computeStockSparkline(orders: any[], purchases: any[], days = 14) {
    const now = new Date();
    const DAY = 24 * 60 * 60 * 1000;
    const arr: Array<{ label: string; date: number; net: number; cum: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const end = start + DAY - 1;

      const purchasesQty = (purchases || [])
        .filter(p => p.createdAt >= start && p.createdAt <= end)
        .reduce((s, p) => s + ((p.items || []).reduce((ss: number, it: any) => ss + (it.quantity || 0), 0)), 0);

      const ordersQty = (orders || [])
        .filter(o => o.createdAt >= start && o.createdAt <= end)
        .reduce((s, o) => s + ((o.items || []).reduce((ss: number, it: any) => ss + (it.quantity || 0), 0)), 0);

      const net = purchasesQty - ordersQty; // positive increases stock
      arr.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), date: start, net, cum: 0 });
    }

    // compute cumulative net for trend visualization
    let cum = 0;
    arr.forEach(a => {
      cum += a.net;
      a.cum = cum;
    });

    this.stockSpark = arr;
    const vals = arr.map(a => Math.abs(a.cum));
    this.sparkMax = Math.max(1, ...vals);

    // build SVG polyline points (x across width 0..100, y scaled 0..100 with invert)
    const pts: string[] = [];
    arr.forEach((a, idx) => {
      const x = (idx / (arr.length - 1 || 1)) * 100;
      // normalize cumulative to -sparkMax..sparkMax, map to 80..10 (invert y)
      const normalized = (a.cum + this.sparkMax) / (2 * this.sparkMax); // 0..1
      const y = 90 - normalized * 70; // keep margin
      pts.push(`${x},${y}`);
    });
    this.sparkPoints = pts.join(' ');
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
