export interface PurchaseItem {
  productId: number;
  name?: string;
  quantity: number;
  price: number;
}

export interface Purchase {
  id: number;
  supplierId: number;
  items: PurchaseItem[];
  total: number;
  createdAt: number;
}
