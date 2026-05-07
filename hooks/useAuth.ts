import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Profile } from '../types';
import { appRoleToUserRole, userRoleToAppRole } from '../types';
import { USERS } from '../lib/users';

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

  const fetchProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      const profile = data as Profile;
      const appUser: User = {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone || undefined,
        role: appRoleToUserRole(profile.role),
        is2FAEnabled: false, // MFA se gestiona en Supabase si es necesario
      };
      
      return appUser;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    // 1. Verificar sesión inicial
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const appUser = await fetchProfile(session.user.id, session.user.email || '');
          setUser(appUser);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 2. Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const appUser = await fetchProfile(session.user.id, session.user.email || '');
        setUser(appUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      // 1. Intentar inicio de sesión normal
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // 2. Si falla por credenciales inválidas, comprobar si el usuario debe ser auto-registrado
        // Esto permite que el primer login "cree" la cuenta en Supabase si el PIN coincide con lib/users.ts
        if (signInError.message === 'Invalid login credentials') {
          const localUser = USERS.find(u => u.email === email);
          
          if (localUser && localUser.pin === password) {
            console.log('Auto-registrando usuario en Supabase...');
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: localUser.name,
                  role: userRoleToAppRole(localUser.role, localUser.category === 'Enfermería')
                }
              }
            });

            if (signUpError) {
              setError(signUpError.message);
              return { success: false, error: signUpError.message };
            }

            return { success: true, message: 'Cuenta creada e iniciada sesión' };
          }
        }

        setError(signInError.message);
        return { success: false, error: signInError.message };
      }

      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Error al iniciar sesión';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }, []);

  return { user, isLoading, error, signIn, signOut };
}
