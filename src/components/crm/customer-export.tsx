'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Customer } from '@/types/customer';

interface CustomerExportProps {
  customers: Customer[];
  selectedCustomers?: string[];
  trigger?: React.ReactNode;
}

const exportFields = [
  { id: 'firstName', label: 'Nombre', required: true },
  { id: 'lastName', label: 'Apellido', required: true },
  { id: 'email', label: 'Email', required: true },
  { id: 'phone', label: 'Teléfono' },
  { id: 'mobile', label: 'Móvil' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'companyName', label: 'Empresa' },
  { id: 'type', label: 'Tipo de cliente' },
  { id: 'leadScore', label: 'Lead Score' },
  { id: 'assignedToName', label: 'Asignado a' },
  { id: 'city', label: 'Ciudad' },
  { id: 'state', label: 'Estado/Provincia' },
  { id: 'country', label: 'País' },
  { id: 'industry', label: 'Industria' },
  { id: 'segment', label: 'Segmento' },
  { id: 'taxId', label: 'NIT/RFC' },
  { id: 'creditLimit', label: 'Límite de crédito' },
  { id: 'paymentTerms', label: 'Términos de pago' },
  { id: 'leadSource', label: 'Fuente del lead' },
  { id: 'createdAt', label: 'Fecha de creación' },
  { id: 'lastContactAt', label: 'Último contacto' },
  { id: 'tags', label: 'Tags' },
  { id: 'notes', label: 'Notas' },
];

export function CustomerExport({ customers, selectedCustomers, trigger }: CustomerExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'firstName', 'lastName', 'email', 'phone', 'companyName', 'type', 'leadScore'
  ]);
  const [isExporting, setIsExporting] = useState(false);

  const customersToExport = selectedCustomers && selectedCustomers.length > 0
    ? customers.filter(c => selectedCustomers.includes(c.id))
    : customers;

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, fieldId]);
    } else {
      // Don't allow unchecking required fields
      const field = exportFields.find(f => f.id === fieldId);
      if (field?.required) {
        toast.error('Este campo es requerido y no se puede desmarcar');
        return;
      }
      setSelectedFields(prev => prev.filter(id => id !== fieldId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFields(exportFields.map(f => f.id));
    } else {
      setSelectedFields(exportFields.filter(f => f.required).map(f => f.id));
    }
  };

  const generateCSV = (data: Customer[], fields: string[]) => {
    const headers = fields.map(fieldId => {
      const field = exportFields.find(f => f.id === fieldId);
      return field?.label || fieldId;
    });

    const rows = data.map(customer => {
      return fields.map(fieldId => {
        let value = (customer as any)[fieldId];
        
        // Handle special cases
        if (fieldId === 'tags' && Array.isArray(value)) {
          value = value.join(', ');
        } else if (fieldId === 'createdAt' || fieldId === 'lastContactAt') {
          value = value ? new Date(value).toLocaleDateString('es-ES') : '';
        } else if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        
        // Escape commas and quotes for CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value || '';
      });
    });

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Selecciona al menos un campo para exportar');
      return;
    }

    if (customersToExport.length === 0) {
      toast.error('No hay clientes para exportar');
      return;
    }

    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const customerCount = customersToExport.length;
      
      if (exportFormat === 'csv') {
        const csvContent = generateCSV(customersToExport, selectedFields);
        downloadFile(
          csvContent, 
          `clientes_${timestamp}_${customerCount}.csv`, 
          'text/csv;charset=utf-8;'
        );
      } else {
        // For Excel, we'll use CSV for now but with .xlsx extension
        // In a real implementation, you'd use a library like xlsx
        const csvContent = generateCSV(customersToExport, selectedFields);
        downloadFile(
          csvContent, 
          `clientes_${timestamp}_${customerCount}.xlsx`, 
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
      }

      toast.success(`${customerCount} clientes exportados exitosamente`);
      setIsOpen(false);
    } catch (error) {
      toast.error('Error al exportar los clientes');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const allSelected = selectedFields.length === exportFields.length;
  const someSelected = selectedFields.length > 0 && selectedFields.length < exportFields.length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportar Clientes</DialogTitle>
          <DialogDescription>
            Exportar {customersToExport.length} cliente{customersToExport.length !== 1 ? 's' : ''} 
            {selectedCustomers && selectedCustomers.length > 0 ? ' seleccionados' : ''} 
            en formato CSV o Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Formato de exportación</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'excel') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    CSV (Comma Separated Values)
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel (.xlsx)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Campos a exportar</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={allSelected}
                  // @ts-ignore
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">Seleccionar todos</Label>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
              {exportFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={(checked) => handleFieldToggle(field.id, !!checked)}
                    disabled={field.required}
                  />
                  <Label 
                    htmlFor={field.id} 
                    className={`text-sm ${field.required ? 'font-medium' : ''}`}
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground">
              * Campos requeridos que no se pueden desmarcar
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar {customersToExport.length} cliente{customersToExport.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}