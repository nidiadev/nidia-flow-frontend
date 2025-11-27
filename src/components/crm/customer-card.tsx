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
  Mail,
  Phone,
  Eye,
  Star,
  Building2,
  Calendar,
  MapPin,
} from 'lucide-react';
import { Customer, CUSTOMER_TYPE_CONFIG, getLeadScoreInfo } from '@/types/customer';
import { cn } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
  onDelete?: (id: string) => void;
  viewUrl?: string;
  editUrl?: string;
}

export function CustomerCard({ customer, onDelete, viewUrl, editUrl }: CustomerCardProps) {
  const typeConfig = CUSTOMER_TYPE_CONFIG[customer.type];
  const leadScoreInfo = getLeadScoreInfo(customer.leadScore);

  const defaultViewUrl = `/crm/customers/${customer.id}`;
  const defaultEditUrl = `/crm/customers/${customer.id}/edit`;

  return (
    <div className="group relative bg-card border border-border rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:border-nidia-green/20">
      <div className="flex items-start justify-between gap-3">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <TenantLink 
            href={viewUrl || defaultViewUrl}
            className="block"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-nidia-green/80 to-nidia-purple/80 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm group-hover:shadow-md transition-shadow">
                  {customer.firstName?.[0]}{customer.lastName?.[0]}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-foreground group-hover:text-nidia-green transition-colors truncate">
                  {customer.firstName} {customer.lastName}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {customer.email}
                </p>
              </div>
            </div>
          </TenantLink>

          {/* Company & Location */}
          <div className="space-y-1.5 mb-2">
            {customer.companyName && (
              <div className="flex items-center gap-1.5 text-xs">
                <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-foreground font-medium truncate">{customer.companyName}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 flex-wrap">
              {customer.whatsapp && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="truncate">{customer.whatsapp.replace(/^\+57\s?/, '')}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{customer.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {customer.tags && customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {customer.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0.5 h-4 bg-muted/60 hover:bg-muted border-border/50 text-foreground/80 font-medium"
                >
                  {tag}
                </Badge>
              ))}
              {customer.tags.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0.5 h-4 text-muted-foreground border-border/50"
                >
                  +{customer.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Badge 
                variant={typeConfig.variant}
                className={`${typeConfig.color} text-[10px] font-medium px-2 py-0.5 h-5`}
              >
                {typeConfig.label}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className={cn('font-semibold text-xs', leadScoreInfo.color)}>
                  {customer.leadScore}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {new Date(customer.createdAt).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit' 
              })}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <TenantLink href={viewUrl || defaultViewUrl}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </TenantLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <TenantLink href={editUrl || defaultEditUrl}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </TenantLink>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Enviar email
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Phone className="mr-2 h-4 w-4" />
              Llamar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete?.(customer.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

