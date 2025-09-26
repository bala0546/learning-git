import { Supplier } from './supplier';

export interface OrderItem {
  productId: number;
  name?: string;
  quantity: number;
  price: number;
}

export interface ShipmentInfo {
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: number;
}

export interface CustomerInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string; // NEW
}

export type OrderStatus = 'Pending' | 'Shipped' | 'Delivered';

export interface Order {
  id: number;
  items: OrderItem[];
  total: number;
  createdAt: number;
  supplierId?: number;
  shipment?: ShipmentInfo;
  customer?: CustomerInfo; // NEW
  status?: OrderStatus; // NEW
}
