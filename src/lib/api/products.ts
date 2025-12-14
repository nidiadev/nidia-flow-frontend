import { ApiClient } from '../api';

// ============================================
// PRODUCTS
// ============================================

export enum ProductType {
  PRODUCT = 'product',
  SERVICE = 'service',
  COMBO = 'combo',
}

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  brand?: string;
  tags?: string[];
  price: number;
  cost?: number;
  taxRate?: number;
  discountPercentage?: number;
  trackInventory: boolean;
  stockQuantity?: number;
  stockMin?: number;
  stockUnit?: string;
  durationMinutes?: number;
  requiresScheduling?: boolean;
  imageUrl?: string;
  images?: string[];
  isActive: boolean;
  isFeatured: boolean;
  customFields?: Record<string, any>;
  variants?: ProductVariant[];
  comboItems?: ComboItem[];
  productAttributes?: { attribute: Attribute }[];
  createdAt: string;
  updatedAt: string;
}

export interface ComboItem {
  productId: string;
  product?: {
    id: string;
    name: string;
    price: number;
    sku: string;
  };
  quantity: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  priceAdjustment?: number;
  stockQuantity?: number;
  option1Name?: string;
  option1Value?: string;
  option2Name?: string;
  option2Value?: string;
  isActive: boolean;
  // Campos calculados (vienen del backend)
  finalPrice?: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  // Producto padre (viene con include)
  product?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    type: string;
    stockMin?: number;
  };
  attributeValues?: { attributeValue: AttributeValue }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  type: ProductType;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  brand?: string;
  tags?: string[];
  price: number;
  cost?: number;
  taxRate?: number;
  discountPercentage?: number;
  trackInventory?: boolean;
  stockQuantity?: number;
  stockMin?: number;
  stockUnit?: string;
  durationMinutes?: number;
  requiresScheduling?: boolean;
  imageUrl?: string;
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  customFields?: Record<string, any>;
  variants?: CreateProductVariantDto[];
  comboItems?: CreateComboItemDto[];
}

export interface UpdateProductDto {
  type?: ProductType;
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  brand?: string;
  tags?: string[];
  price?: number;
  cost?: number;
  taxRate?: number;
  discountPercentage?: number;
  trackInventory?: boolean;
  stockQuantity?: number;
  stockMin?: number;
  stockUnit?: string;
  durationMinutes?: number;
  requiresScheduling?: boolean;
  imageUrl?: string;
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  customFields?: Record<string, any>;
  variants?: CreateProductVariantDto[];
  comboItems?: CreateComboItemDto[];
}

export interface CreateComboItemDto {
  productId: string;
  quantity: number;
}

export interface CreateProductVariantDto {
  name: string;
  sku?: string;
  priceAdjustment?: number;
  stockQuantity?: number;
  option1Name?: string;
  option1Value?: string;
  option2Name?: string;
  option2Value?: string;
  isActive?: boolean;
}

export interface ProductFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  type?: ProductType;
  categoryId?: string;
  isActive?: boolean;
  trackInventory?: boolean;
  lowStock?: boolean;
  outOfStock?: boolean;
  isFeatured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  productsByType: {
    product: number;
    service: number;
    combo: number;
  };
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  averagePrice: number;
}

export const productsApi = {
  // Get all products
  getAll: async (filters?: ProductFilterDto) => {
    const response = await ApiClient.get('/products', { params: filters });
    return response;
  },

  // Get product by ID
  getById: async (id: string) => {
    const response = await ApiClient.get(`/products/${id}`);
    return response;
  },

  // Get product price (with calculations)
  getPrice: async (id: string, quantity?: number, variantId?: string) => {
    const response = await ApiClient.get(`/products/${id}/price`, {
      params: { quantity, variantId },
    });
    return response;
  },

  // Get product statistics
  getStats: async () => {
    const response = await ApiClient.get('/products/stats');
    return response;
  },

  // Create product
  create: async (data: CreateProductDto) => {
    const response = await ApiClient.post('/products', data);
    return response;
  },

  // Update product
  update: async (id: string, data: UpdateProductDto) => {
    const response = await ApiClient.patch(`/products/${id}`, data);
    return response;
  },

  // Delete product (soft delete)
  delete: async (id: string) => {
    const response = await ApiClient.delete(`/products/${id}`);
    return response;
  },

  // Bulk update prices
  bulkUpdatePrices: async (data: {
    productIds: string[];
    updateType: 'percentage' | 'fixed' | 'set';
    value: number;
    applyTo?: 'price' | 'cost' | 'both';
  }) => {
    const response = await ApiClient.post('/products/bulk-update-prices', data);
    return response;
  },

  // Bulk update discounts
  bulkUpdateDiscounts: async (data: {
    productIds: string[];
    discountPercentage: number;
  }) => {
    const response = await ApiClient.post('/products/bulk-update-discounts', data);
    return response;
  },
};

// ============================================
// CATEGORIES
// ============================================

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
  };
  children?: Category[];
  isActive: boolean;
  sortOrder: number;
  imageUrl?: string;
  metadata?: Record<string, any>;
  productsCount?: number;
  path?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
  isActive?: boolean;
  rootOnly?: boolean;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  rootCategories: number;
  categoriesWithProducts: number;
  averageProductsPerCategory: number;
}

export const categoriesApi = {
  // Get all categories
  getAll: async (filters?: CategoryFilterDto) => {
    const response = await ApiClient.get('/categories', { params: filters });
    return response;
  },

  // Get category tree (hierarchical)
  getTree: async () => {
    const response = await ApiClient.get('/categories/tree');
    return response;
  },

  // Get root categories only
  getRoot: async () => {
    const response = await ApiClient.get('/categories/root');
    return response;
  },

  // Get category statistics
  getStats: async () => {
    const response = await ApiClient.get('/categories/stats');
    return response;
  },

  // Get category by ID
  getById: async (id: string) => {
    const response = await ApiClient.get(`/categories/${id}`);
    return response;
  },

  // Create category
  create: async (data: CreateCategoryDto) => {
    const response = await ApiClient.post('/categories', data);
    return response;
  },

  // Update category
  update: async (id: string, data: UpdateCategoryDto) => {
    const response = await ApiClient.patch(`/categories/${id}`, data);
    return response;
  },

  // Activate category
  activate: async (id: string) => {
    const response = await ApiClient.patch(`/categories/${id}/activate`);
    return response;
  },

  // Reorder categories
  reorder: async (categoryOrders: Array<{ id: string; sortOrder: number }>) => {
    const response = await ApiClient.post('/categories/reorder', { categoryOrders });
    return response;
  },

  // Delete category (soft delete)
  delete: async (id: string) => {
    const response = await ApiClient.delete(`/categories/${id}`);
    return response;
  },
};

// ============================================
// ATTRIBUTES
// ============================================

export interface Attribute {
  id: string;
  name: string;
  type: 'text' | 'color' | 'number' | 'select';
  isRequired: boolean;
  values?: AttributeValue[];
  createdAt: string;
  updatedAt: string;
}

export interface AttributeValue {
  id: string;
  attributeId: string;
  name: string;
  value?: string;
  position: number;
}

export interface CreateAttributeDto {
  name: string;
  type: 'text' | 'color' | 'number' | 'select';
  isRequired?: boolean;
  values?: { name: string; value?: string; position?: number }[];
}

export interface UpdateAttributeDto {
  name?: string;
  type?: 'text' | 'color' | 'number' | 'select';
  isRequired?: boolean;
  values?: { id?: string; name: string; value?: string; position?: number }[];
}

export const attributesApi = {
  getAll: async () => {
    const response = await ApiClient.get('/attributes');
    return response;
  },
  getById: async (id: string) => {
    const response = await ApiClient.get(`/attributes/${id}`);
    return response;
  },
  create: async (data: CreateAttributeDto) => {
    const response = await ApiClient.post('/attributes', data);
    return response;
  },
  update: async (id: string, data: UpdateAttributeDto) => {
    const response = await ApiClient.patch(`/attributes/${id}`, data);
    return response;
  },
  delete: async (id: string) => {
    const response = await ApiClient.delete(`/attributes/${id}`);
    return response;
  }
};

// ============================================
// WAREHOUSES
// ============================================

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseDto {
  name: string;
  location?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateWarehouseDto extends Partial<CreateWarehouseDto> {}

export const warehousesApi = {
  getAll: async () => {
    const response = await ApiClient.get('/warehouses');
    return response;
  },
  getById: async (id: string) => {
    const response = await ApiClient.get(`/warehouses/${id}`);
    return response;
  },
  create: async (data: CreateWarehouseDto) => {
    const response = await ApiClient.post('/warehouses', data);
    return response;
  },
  update: async (id: string, data: UpdateWarehouseDto) => {
    const response = await ApiClient.patch(`/warehouses/${id}`, data);
    return response;
  },
  delete: async (id: string) => {
    const response = await ApiClient.delete(`/warehouses/${id}`);
    return response;
  }
};

// ============================================
// PRODUCT VARIANTS
// ============================================

export interface BulkCreateVariantsDto {
  productId: string;
  option1: {
    name: string;
    values: string[];
  };
  option2?: {
    name: string;
    values: string[];
  };
  defaultPriceAdjustment?: number;
  defaultStockQuantity?: number;
}

export interface UpdateVariantStockDto {
  stockQuantity: number;
  reason?: string;
}

export const variantsApi = {
  // Get all variants for a product
  getByProduct: async (productId: string) => {
    const response = await ApiClient.get(`/products/${productId}/variants`);
    return response;
  },

  // Get variant by ID
  getById: async (productId: string, variantId: string) => {
    const response = await ApiClient.get(`/products/${productId}/variants/${variantId}`);
    return response;
  },

  // Create variant
  create: async (productId: string, data: CreateProductVariantDto) => {
    const response = await ApiClient.post(`/products/${productId}/variants`, data);
    return response;
  },

  // Bulk create variants
  bulkCreate: async (productId: string, data: BulkCreateVariantsDto) => {
    const response = await ApiClient.post(`/products/${productId}/variants/bulk`, data);
    return response;
  },

  // Update variant
  update: async (productId: string, variantId: string, data: Partial<CreateProductVariantDto>) => {
    const response = await ApiClient.patch(`/products/${productId}/variants/${variantId}`, data);
    return response;
  },

  // Update variant stock
  updateStock: async (productId: string, variantId: string, data: UpdateVariantStockDto) => {
    const response = await ApiClient.patch(`/products/${productId}/variants/${variantId}/stock`, data);
    return response;
  },

  // Delete variant
  delete: async (productId: string, variantId: string) => {
    const response = await ApiClient.delete(`/products/${productId}/variants/${variantId}`);
    return response;
  },
};

// ============================================
// INVENTORY
// ============================================

export interface InventoryMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  variantId?: string;
  variant?: {
    id: string;
    name: string;
    sku?: string;
  };
  warehouseId?: string;
  warehouse?: {
    id: string;
    name: string;
  };
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'sale' | 'return' | 'damaged' | 'expired';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt: string;
}

export interface CreateInventoryMovementDto {
  productId: string;
  productVariantId?: string;
  warehouseId?: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'sale' | 'return' | 'damaged' | 'expired';
  quantity: number;
  reason?: string;
  reference?: string;
  notes?: string;
}

export interface InventoryFilterDto {
  page?: number;
  limit?: number;
  productId?: string;
  variantId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface InventoryStats {
  totalMovements: number;
  movementsByType: Record<string, number>;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export const inventoryApi = {
  // Get inventory movements
  getMovements: async (filters?: InventoryFilterDto) => {
    const response = await ApiClient.get('/inventory/movements', { params: filters });
    return response;
  },

  // Get inventory statistics
  getStats: async () => {
    const response = await ApiClient.get('/inventory/stats');
    return response;
  },

  // Create inventory movement
  createMovement: async (data: CreateInventoryMovementDto) => {
    const response = await ApiClient.post('/inventory/movements', data);
    return response;
  },

  // Get product inventory
  getProductInventory: async (productId: string, variantId?: string) => {
    const response = await ApiClient.get(`/inventory/products/${productId}`, {
      params: { variantId },
    });
    return response;
  },
};

// ============================================
// STOCK ALERTS
// ============================================

export interface StockAlert {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  variantId?: string;
  variant?: {
    id: string;
    name: string;
  };
  alertType: 'low_stock' | 'out_of_stock';
  currentStock: number;
  minStock: number;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface StockAlertFilterDto {
  page?: number;
  limit?: number;
  alertType?: 'low_stock' | 'out_of_stock';
  isResolved?: boolean;
  productId?: string;
}

export const stockAlertsApi = {
  // Get all stock alerts
  getAll: async (filters?: StockAlertFilterDto) => {
    const response = await ApiClient.get('/inventory/alerts', { params: filters });
    return response;
  },

  // Get alert by ID
  getById: async (id: string) => {
    const response = await ApiClient.get(`/inventory/alerts/${id}`);
    return response;
  },

  // Resolve alert
  resolve: async (id: string) => {
    const response = await ApiClient.patch(`/inventory/alerts/${id}/resolve`);
    return response;
  },

  // Unresolve alert
  unresolve: async (id: string) => {
    const response = await ApiClient.patch(`/inventory/alerts/${id}/unresolve`);
    return response;
  },

  // Delete alert
  delete: async (id: string) => {
    const response = await ApiClient.delete(`/inventory/alerts/${id}`);
    return response;
  },
};

