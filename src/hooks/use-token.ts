'use client';

import { useCallback } from 'react';

export function useToken() {
  const setTokens = useCallback((accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Also set as httpOnly cookies for better security (would need server-side implementation)
      document.cookie = `accessToken=${accessToken}; path=/; secure; samesite=strict`;
    }
  }, []);

  const setAccessToken = useCallback((accessToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      document.cookie = `accessToken=${accessToken}; path=/; secure; samesite=strict`;
    }
  }, []);

  const getAccessToken = useCallback((): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  const getRefreshToken = useCallback((): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }, []);

  const clearTokens = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear cookies
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }, []);

  const isAuthenticated = useCallback((): boolean => {
    return !!getAccessToken();
  }, [getAccessToken]);

  return {
    setTokens,
    setAccessToken,
    getAccessToken,
    getRefreshToken,
    clearTokens,
    isAuthenticated,
  };
}