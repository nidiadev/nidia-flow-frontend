'use client';

import { useState, useEffect } from 'react';

export type ViewMode = 'table' | 'cards';

/**
 * Hook para manejar el modo de vista (tabla o cards)
 * Persiste la preferencia en localStorage
 */
export function useViewMode(storageKey: string = 'view-mode', defaultMode: ViewMode = 'table') {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey) as ViewMode;
      if (saved === 'table' || saved === 'cards') {
        setViewMode(saved);
      }
    }
  }, [storageKey]);

  // Save to localStorage when view mode changes
  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, mode);
    }
  };

  return {
    viewMode,
    setViewMode: updateViewMode,
    isTableView: viewMode === 'table',
    isCardsView: viewMode === 'cards',
  };
}

