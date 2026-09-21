export interface WorkerAuth {
  id: string;
  name: string;
}

export interface Product {
  barcode: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  targetStock: number;
  minOrderQty: number;
  photoUrl?: string;
  photoUrls?: string[];
  isNewProduct?: boolean;
}

export interface AuditItem {
  id: string;
  barcode: string;
  productName: string;
  vendor?: 'younme' | 'spchain';
  stockCount: number;
  targetStock: number;
  minOrderQty: number;
  photoUrl?: string;
  photoUrls?: string[];
  isUnmapped?: boolean;
  workerName: string;
  updatedAt: string;
}

export interface BarcodeAlias {
  id: string;
  oldBarcode: string;
  newBarcode: string;
  productName: string;
  note?: string;
  updatedAt: string;
}

export interface OrderItem {
  barcode: string;
  productName: string;
  currentStock: number;
  targetStock: number;
  recommendedQty: number;
  finalOrderQty: number;
  minOrderQty: number;
  isBelowMinQty: boolean;
  usingAliasBarcode?: string;
  category?: string;
  vendor?: "younme" | "spchain";
  cost?: number;
  price?: number;
  status: 'PENDING' | 'ORDERED' | 'FAILED';
  failReason?: string;
  workerName?: string;
}

export interface OrderFailure {
  id: string;
  barcode: string;
  productName: string;
  failReason: 'OUT_OF_STOCK' | 'BELOW_MIN_QTY' | 'DISCONTINUED' | 'NOT_FOUND' | 'OTHER';
  failDetail: string;
  attemptedQty: number;
  minOrderQty: number;
  failedAt: string;
}

export interface AppSettings {
  managerPin: string;
  younmeId: string;
  younmePw: string;
  workerName: string;
  workers?: WorkerAuth[];
  autoOrderEnabled: boolean;
}
