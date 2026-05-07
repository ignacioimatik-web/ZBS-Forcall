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

  const fetchProfile = useCallback(async (userId: string, email: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Intentando obtener perfil para ${userId} (intento ${i + 1})...`);
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!profileError && data) {
          const profile = data as Profile;
          return {
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            phone: profile.phone || undefined,
            role: appRoleToUserRole(profile.role),
            is2FAEnabled: false,
          };
        }

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is 'no rows'
          console.error('Error al obtener perfil:', profileError);
        } else {
          console.warn('Perfil no encontrado aún, reintentando...');
        }
      } catch (err) {
        console.error('Error inesperado al obtener perfil:', err);
      }
      
      // Esperar un poco antes de reintentar (aumentar con cada intento)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      console.log('Iniciando verificación de autenticación...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          console.log('Sesión inicial encontrada, obteniendo perfil...');
          const appUser = await fetchProfile(session.user.id, session.user.email || '');
          if (isMounted && appUser) {
            setUser(appUser);
          }
        } else {
          console.log('No hay sesión inicial activa');
        }
      } catch (err) {
        console.error('Error durante initAuth:', err);
      } finally {
        if (isMounted) {
          console.log('Finalizada carga inicial de autenticación');
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Cambio de estado Auth:', event);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') && session?.user) {
        // Si ya tenemos el usuario y el ID es el mismo, no hace falta re-obtener (opcional)
        const appUser = await fetchProfile(session.user.id, session.user.email || '');
        if (isMounted) setUser(appUser);
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) setUser(null);
      }
    });

    return () => {
      isMounted = false;
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
