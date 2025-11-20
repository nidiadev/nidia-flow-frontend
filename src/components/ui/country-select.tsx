'use client';

import React from 'react';
import { Combobox } from '@/components/ui/combobox';
import countriesData from '@/lib/data/countries.json';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = countriesData as Country[];

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = 'Selecciona un país',
  className,
  disabled = false,
}: CountrySelectProps) {
  const options = COUNTRIES.map((country) => ({
    value: country.code,
    label: `${country.flag} ${country.name}`,
  }));

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Buscar país..."
      emptyText="No se encontraron países."
      allowCustom={false}
      className={className}
    />
  );
}

