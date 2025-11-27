'use client';

import { TenantLink } from '@/components/ui/tenant-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Package,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Product, ProductType } from '@/lib/api/products';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  viewUrl?: string;
  editUrl?: string;
}

export function ProductCard({ product, onDelete, onEdit, onView, viewUrl, editUrl }: ProductCardProps) {
  const defaultViewUrl = `/products/catalog/${product.id}`;
  const defaultEditUrl = `/products/catalog/${product.id}/edit`;

  const getTypeConfig = (type: ProductType) => {
    switch (type) {
      case ProductType.PRODUCT:
        return { label: 'Producto', variant: 'default' as const, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case ProductType.SERVICE:
        return { label: 'Servicio', variant: 'secondary' as const, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
      case ProductType.COMBO:
        return { label: 'Combo', variant: 'default' as const, color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' };
      default:
        return { label: 'Producto', variant: 'default' as const, color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' };
    }
  };

  const typeConfig = getTypeConfig(product.type);

  const getStockStatus = (stockQuantity?: number, stockMin?: number, trackInventory?: boolean) => {
    if (!trackInventory) {
      return { label: 'N/A', color: 'text-muted-foreground', icon: null };
    }
    const stock = stockQuantity || 0;
    const min = stockMin || 0;
    
    if (stock === 0) {
      return { label: 'Sin stock', color: 'text-red-600 dark:text-red-400', icon: <AlertTriangle className="h-3 w-3" /> };
    }
    if (stock <= min) {
      return { label: 'Stock bajo', color: 'text-orange-600 dark:text-orange-400', icon: <TrendingDown className="h-3 w-3" /> };
    }
    return { label: 'En stock', color: 'text-green-600 dark:text-green-400', icon: <TrendingUp className="h-3 w-3" /> };
  };

  const stockStatus = getStockStatus(product.stockQuantity, product.stockMin, product.trackInventory);

  return (
    <div className="group relative bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-nidia-green/20">
      <div className="flex items-start justify-between gap-3">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <TenantLink 
            href={viewUrl || defaultViewUrl}
            className="block"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-nidia-green/80 to-nidia-purple/80 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow">
                    <Package className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-foreground group-hover:text-nidia-green transition-colors truncate mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  SKU: {product.sku}
                </p>
              </div>
            </div>
          </TenantLink>

          {/* Description */}
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Type and Status */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge 
              variant={typeConfig.variant}
              className={cn('text-xs px-2 py-0.5', typeConfig.color)}
            >
              {typeConfig.label}
            </Badge>
            {product.isActive ? (
              <Badge variant="default" className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                Activo
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                Inactivo
              </Badge>
            )}
            {product.isFeatured && (
              <Badge variant="default" className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                Destacado
              </Badge>
            )}
          </div>

          {/* Price and Stock */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold text-sm text-foreground">
                {formatCurrency(product.price)}
              </span>
            </div>
            {product.trackInventory && (
              <div className="flex items-center gap-1.5 text-xs">
                {stockStatus.icon}
                <span className={cn('font-medium', stockStatus.color)}>
                  {product.stockQuantity || 0} {product.stockUnit || 'unidad'}
                </span>
              </div>
            )}
          </div>

          {/* Category */}
          {product.category && (
            <div className="text-xs text-muted-foreground mb-2">
              {product.category.name}
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0.5 h-4 bg-muted/60 hover:bg-muted border-border/50 text-foreground/80 font-medium"
                >
                  {tag}
                </Badge>
              ))}
              {product.tags.length > 3 && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0.5 h-4 bg-muted/60 border-border/50 text-foreground/80 font-medium"
                >
                  +{product.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onView && (
              <DropdownMenuItem onClick={() => onView(product.id)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalle
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(product.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => {
              toast.info('Función de duplicar próximamente');
            }}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem 
                onClick={() => {
                  if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
                    onDelete(product.id);
                  }
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

