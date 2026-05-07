import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import { appRoleToUserRole } from '../types';

const STORAGE_KEY = 'zbs_forcall_user';

interface UseAuthResult {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurar sesión desde Supabase al cargar
  useEffect(() => {
    let isMounted = true;
    let timeoutId: any = null;

    const initAuth = async () => {
      // Timeout de seguridad: 5s para no quedarse pillado
      timeoutId = setTimeout(() => {
        if (isMounted && isLoading) {
          setIsLoading(false);
        }
      }, 5000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (isMounted) setIsLoading(false);
          return;
        }

        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error in initAuth:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error loading profile:', profileError);
        setUser(null);
        return;
      }

      const appUser: User = {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: appRoleToUserRole(profile.role),
        is2FAEnabled: false,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      setUser(appUser);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setUser(null);
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        const msg = authError.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : authError.message;
        setError(msg);
        return { success: false, error: msg };
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        return { success: true };
      }

      const msg = 'No se pudo iniciar sesión.';
      setError(msg);
      return { success: false, error: msg };
    } catch (err: any) {
      const msg = err?.message || 'Error al iniciar sesión.';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }, []);

  return { user, isLoading, error, signIn, signOut };
}
