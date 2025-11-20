"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string }[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCustom?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar o escribir...",
  searchPlaceholder = "Buscar...",
  emptyText = "No se encontraron opciones.",
  allowCustom = true,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Find the selected option label
  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption ? selectedOption.label : (value || "")

  // Filter options based on input
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options
    const lowerInput = inputValue.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lowerInput) ||
        opt.value.toLowerCase().includes(lowerInput)
    )
  }, [options, inputValue])

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setInputValue("")
    setOpen(false)
  }

  React.useEffect(() => {
    if (!open) {
      setInputValue("")
    }
  }, [open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    // Si allowCustom está activo, actualizar el valor inmediatamente mientras escribe
    if (allowCustom) {
      onValueChange(newValue)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && allowCustom && inputValue) {
      onValueChange(inputValue)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal h-9 px-3 py-1 text-base md:text-sm",
            "bg-background border-border",
            "dark:bg-input dark:border-[#2A2D35] dark:text-foreground dark:shadow-sm dark:hover:border-[#353842]",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-0",
            "hover:bg-background hover:border-border",
            "dark:hover:bg-input dark:hover:border-[#353842]",
            className
          )}
        >
          <span className="truncate text-left flex-1">{displayValue || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
      >
        <div className="p-2">
          <Input
            placeholder={searchPlaceholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className="mb-2"
            autoFocus
          />
          <div 
            className="max-h-[200px] overflow-y-auto overscroll-contain"
            style={{ 
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}
            onWheel={(e) => {
              const target = e.currentTarget;
              const { scrollTop, scrollHeight, clientHeight } = target;
              const delta = e.deltaY;
              
              // Si hay contenido para hacer scroll, prevenir el scroll del padre
              if (scrollHeight > clientHeight) {
                e.stopPropagation();
                
                // Si estamos en el límite superior o inferior, prevenir el scroll del padre
                if ((scrollTop === 0 && delta < 0) || (scrollTop + clientHeight >= scrollHeight && delta > 0)) {
                  e.preventDefault();
                }
              }
            }}
          >
            {filteredOptions.length === 0 && inputValue ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {emptyText}
                {allowCustom && (
                  <button
                    onClick={() => {
                      onValueChange(inputValue)
                      setOpen(false)
                    }}
                    className="ml-2 text-primary hover:underline"
                  >
                    Crear "{inputValue}"
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground flex items-center gap-2",
                      value === option.value && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </button>
                ))}
                {allowCustom && inputValue && !filteredOptions.find(opt => opt.value.toLowerCase() === inputValue.toLowerCase()) && (
                  <button
                    onClick={() => {
                      onValueChange(inputValue)
                      setOpen(false)
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-primary"
                  >
                    <Check className="h-4 w-4 opacity-0" />
                    Crear "{inputValue}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

