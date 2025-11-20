'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Search } from 'lucide-react';
import countriesData from '@/lib/data/countries.json';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = countriesData as Country[];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  onBlur?: (e?: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  defaultCountry?: string;
  id?: string;
  name?: string;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  className,
  placeholder = '+57 300 123 4567',
  disabled = false,
  defaultCountry = 'CO',
  id,
  name,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const country = COUNTRIES.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.replace(country.dialCode, '').trim());
      } else {
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const filteredCountries = (() => {
    const allFiltered = COUNTRIES.filter((country) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query) ||
        country.dialCode.includes(query)
      );
    });
    return allFiltered.slice(0, 4);
  })();

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery('');
    const fullNumber = country.dialCode + phoneNumber;
    onChange?.(fullNumber || undefined);
    inputRef.current?.focus();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '');
    setPhoneNumber(newValue);
    const fullNumber = selectedCountry.dialCode + (newValue ? ' ' + newValue : '');
    onChange?.(fullNumber || undefined);
  };

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  const displayValue = phoneNumber ? formatPhoneNumber(phoneNumber) : '';

  const borderClasses = className?.includes('border-destructive')
    ? 'border-destructive'
    : className?.includes('border-primary')
    ? 'border-primary/30'
    : '';

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
          'h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base transition-[color,box-shadow] outline-none',
          'bg-background border-border relative',
          borderClasses,
          'dark:bg-input dark:border-[#2A2D35] dark:text-foreground dark:shadow-sm dark:hover:border-[#353842]',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:ring-offset-0',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className?.includes('border-destructive') && 'focus-within:ring-destructive/50',
          className
        )}
      >
        <div className="flex items-center gap-2 h-full relative z-10">
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className="flex items-center gap-1.5 flex-shrink-0 text-foreground hover:opacity-80 transition-opacity focus:outline-none relative z-10"
            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          >
            <span className="text-lg leading-none">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            <ChevronDown className={cn('h-3 w-3 transition-transform', isDropdownOpen && 'rotate-180')} />
          </button>
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="tel"
            value={displayValue}
            onChange={handlePhoneChange}
            onBlur={(e) => {
              setIsFocused(false);
              // Pasar el evento a onBlur si está definido (react-hook-form espera el evento)
              onBlur?.(e);
            }}
            onFocus={() => setIsFocused(true)}
            disabled={disabled}
            placeholder={placeholder.replace(/^\+\d+\s/, '')}
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm sm:text-base font-outfit h-full relative z-10"
            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
            autoComplete="tel"
          />
        </div>
      </div>

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-80 rounded-md border bg-background dark:bg-input shadow-lg border-border flex flex-col overflow-hidden"
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar país..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background dark:bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
              />
            </div>
          </div>
          <div className="overflow-hidden">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-left transition-colors',
                    'hover:bg-muted focus:bg-muted focus:outline-none',
                    selectedCountry.code === country.code && 'bg-muted'
                  )}
                >
                  <span className="text-lg leading-none">{country.flag}</span>
                  <span className="flex-1 text-foreground">{country.name}</span>
                  <span className="text-muted-foreground">{country.dialCode}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No se encontraron países
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
