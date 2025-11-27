'use client';

import React from 'react';
import { Combobox } from '@/components/ui/combobox';
import industriesData from '@/lib/data/industries.json';

interface Industry {
  value: string;
  label: string;
}

const INDUSTRIES: Industry[] = industriesData as Industry[];

interface IndustrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function IndustrySelect({
  value,
  onValueChange,
  placeholder = 'Selecciona una industria',
  className,
  disabled = false,
}: IndustrySelectProps) {
  const options = INDUSTRIES.map((industry) => ({
    value: industry.value,
    label: industry.label,
  }));

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Buscar industria..."
      emptyText="No se encontraron industrias."
      allowCustom={true}
      className={className}
    />
  );
}

