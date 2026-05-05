import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { validateUser } from '../lib/users';

const STORAGE_KEY = 'zbs_forcall_user';

interface UseAuthResult {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (userId: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurar sesión desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: User = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (userId: string, pin: string) => {
    setError(null);
    const localUser = validateUser(userId, pin);
    if (!localUser) {
      const msg = 'PIN incorrecto. Inténtalo de nuevo.';
      setError(msg);
      return { success: false, error: msg };
    }
    const appUser: User = {
      id: localUser.id,
      name: localUser.name,
      email: '',
      role: localUser.role,
      is2FAEnabled: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
    setUser(appUser);
    return { success: true };
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setError(null);
  }, []);

  return { user, isLoading, error, signIn, signOut };
}
