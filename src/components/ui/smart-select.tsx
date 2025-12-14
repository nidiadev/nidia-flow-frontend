"use client"

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

/**
 * SmartSelect - Componente inteligente que decide automáticamente entre Select y Combobox
 * 
 * Estrategia:
 * - <= 5 items: Usa Select (más rápido, menos overhead)
 * - > 5 items: Usa Combobox (con búsqueda)
 * 
 * Esto proporciona la mejor UX sin sacrificar performance
 */
export interface SmartSelectProps {
  options: { value: string; label: string; disabled?: boolean }[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  // Threshold para cambiar de Select a Combobox (default: 5)
  threshold?: number;
  // Forzar uso de Combobox incluso con pocos items
  forceCombobox?: boolean;
  // Forzar uso de Select incluso con muchos items
  forceSelect?: boolean;
}

export function SmartSelect({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyText,
  disabled = false,
  className,
  id,
  threshold = 5,
  forceCombobox = false,
  forceSelect = false,
}: SmartSelectProps) {
  const shouldUseCombobox = forceCombobox || (!forceSelect && options.length > threshold)

  // Si hay opciones con disabled, necesitamos manejar eso
  const hasDisabledOptions = options.some(opt => opt.disabled)

  if (shouldUseCombobox) {
    // Usar Combobox cuando hay muchos items o está forzado
    return (
      <Combobox
        options={options.map(opt => ({ value: opt.value, label: opt.label }))}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        allowCustom={false}
        className={className}
        disabled={disabled}
      />
    )
  }

  // Usar Select cuando hay pocos items
  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("h-10", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <SelectItem value="__empty__" disabled>
            {emptyText || "No hay opciones disponibles"}
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

