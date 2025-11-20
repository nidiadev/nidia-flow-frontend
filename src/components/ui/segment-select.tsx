'use client';

import React from 'react';
import { Combobox } from '@/components/ui/combobox';
import segmentsData from '@/lib/data/segments.json';

interface Segment {
  value: string;
  label: string;
}

const SEGMENTS: Segment[] = segmentsData as Segment[];

interface SegmentSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SegmentSelect({
  value,
  onValueChange,
  placeholder = 'Selecciona un segmento',
  className,
  disabled = false,
}: SegmentSelectProps) {
  const options = SEGMENTS.map((segment) => ({
    value: segment.value,
    label: segment.label,
  }));

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Buscar segmento..."
      emptyText="No se encontraron segmentos."
      allowCustom={true}
      className={className}
    />
  );
}

