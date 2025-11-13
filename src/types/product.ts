export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  type: ProductType;
  categoryId?: string;
  categoryName?: string;
  
  // Pricing
  price: number;
  cost?: number;
  taxRate: number;
  currency: string;
  
  // Inventory
  trackInventory: boolean;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  
  // Status
  isActive: boolean;
  isFeatured: boolean;
  
  // Media
  imageUrl?: string;
  images?: string[];
  
  // Metadata
  tags?: string[];
  customFields?: Record<string, any>;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export type ProductType = 'product' | 'service' | 'combo';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parentName?: string;
  isActive: boolean;
  sortOrder: number;
  productsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  attributes: Record<string, string>; // e.g., { size: 'M', color: 'Red' }
  price: number;
  cost?: number;
  currentStock: number;
  minStock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComboItem {
  id: string;
  comboId: string;
  productId: string;
  productName?: string;
  quantity: number;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  minStock: number;
  alertType: 'low_stock' | 'out_of_stock';
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName?: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export type MovementType = 
  | 'purchase' 
  | 'sale' 
  | 'adjustment' 
  | 'return' 
  | 'transfer' 
  | 'damage' 
  | 'loss';

export interface ProductFilters {
  search?: string;
  type?: ProductType | 'all';
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  lowStock?: boolean;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  totalCategories: number;
  featuredProducts: number;
}

export const PRODUCT_TYPE_CONFIG = {
  product: {
    label: 'Producto',
    variant: 'default' as const,
    color: 'bg-nidia-blue/20 text-nidia-blue dark:bg-nidia-blue/30 dark:text-nidia-blue',
    description: 'Producto físico con inventario'
  },
  service: {
    label: 'Servicio',
    variant: 'secondary' as const,
    color: 'bg-nidia-purple/20 text-nidia-purple dark:bg-nidia-purple/30 dark:text-nidia-purple',
    description: 'Servicio sin inventario físico'
  },
  combo: {
    label: 'Combo',
    variant: 'success' as const,
    color: 'bg-nidia-green/20 text-nidia-green dark:bg-nidia-green/30 dark:text-nidia-green',
    description: 'Combinación de productos'
  },
} as const;

export const MOVEMENT_TYPE_CONFIG = {
  purchase: { label: 'Compra', color: 'text-green-600', icon: '📦' },
  sale: { label: 'Venta', color: 'text-blue-600', icon: '🛒' },
  adjustment: { label: 'Ajuste', color: 'text-yellow-600', icon: '⚙️' },
  return: { label: 'Devolución', color: 'text-purple-600', icon: '↩️' },
  transfer: { label: 'Transferencia', color: 'text-indigo-600', icon: '🔄' },
  damage: { label: 'Daño', color: 'text-red-600', icon: '⚠️' },
  loss: { label: 'Pérdida', color: 'text-muted-foreground', icon: '❌' },
} as const;

export function getStockStatus(currentStock: number, minStock: number) {
  if (currentStock === 0) {
    return { label: 'Sin stock', color: 'text-red-600', variant: 'destructive' as const };
  }
  if (currentStock <= minStock) {
    return { label: 'Stock bajo', color: 'text-orange-600', variant: 'warning' as const };
  }
  return { label: 'En stock', color: 'text-green-600', variant: 'success' as const };
}

export function calculateMargin(price: number, cost: number): number {
  if (price === 0) return 0;
  return ((price - cost) / price) * 100;
}

export function calculatePriceWithTax(price: number, taxRate: number): number {
  return price * (1 + taxRate / 100);
}
