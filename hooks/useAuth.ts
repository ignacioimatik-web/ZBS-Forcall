import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Profile } from '../types';
import { appRoleToUserRole, userRoleToAppRole } from '../types';
import { USERS } from '../lib/users';

const STORAGE_KEY = 'zbs_forcall_user';

function clearSupabaseSession() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith('sb-')) {
      sessionStorage.removeItem(key);
    }
  }
}

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

  const fetchProfile = useCallback(async (userId: string, email: string, retries = 1) => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!profileError && data) {
          const profile = data as Profile;
          // Si hay perfil en Supabase, usarlo; si full_name es null, usar fallback local
          const localUser = USERS.find(u => u.email === email);
          return {
            id: profile.id,
            name: profile.full_name || localUser?.name || email,
            email: profile.email,
            phone: profile.phone || localUser?.phone || undefined,
            role: appRoleToUserRole(profile.role),
            staffGroup: profile.staff_group || (localUser?.category === 'enfermeria' ? 'enfermeria' : localUser?.category === 'Medicina' ? 'medico' : null),
            is2FAEnabled: false,
          };
        }

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error al obtener perfil:', profileError);
        }
      } catch (err) {
        console.error('Error inesperado al obtener perfil:', err);
      }
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const localUser = USERS.find(u => u.email === email);
    if (localUser) {
      return {
        id: userId,
        name: localUser.name,
        email: localUser.email,
        phone: localUser.phone || undefined,
        role: localUser.role,
        staffGroup: localUser.category === 'enfermeria' ? 'enfermeria' : localUser.category === 'Medicina' ? 'medico' : null,
        is2FAEnabled: false,
      };
    }
    
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: any = null;

    const initAuth = async () => {
      timeoutId = setTimeout(() => {
        if (isMounted && isLoading) {
          setIsLoading(false);
        }
      }, 5000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const appUser = await fetchProfile(session.user.id, session.user.email || '');
          if (isMounted) {
            if (appUser) {
              setUser(appUser);
            } else {
              await supabase.auth.signOut();
              clearSupabaseSession();
            }
          }
        } else {
          clearSupabaseSession();
        }
      } catch (err) {
        // Silently handle auth errors
      } finally {
        if (isMounted) {
          setIsLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') && session?.user) {
        const appUser = await fetchProfile(session.user.id, session.user.email || '');
        if (isMounted) {
          setUser(appUser);
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const transformPin = (pin: string) => `pin${pin}#`;

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    clearSupabaseSession();
    // Forzar cierre de cualquier sesión previa (aunque el signOut anterior fallara por timeout)
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
      ]);
    } catch {
      // Ignorar error — lo importante es limpiar la sesión local
    }
    clearSupabaseSession();
    const supabasePassword = transformPin(password);

    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms)),
      ]);

    try {
      const { data, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password: supabasePassword }),
        12000
      );

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          const localUser = USERS.find(u => u.email === email);
          
          if (localUser && localUser.pin === password) {
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password: supabasePassword,
              options: {
                data: {
                  full_name: localUser.name,
                  role: userRoleToAppRole(localUser.role, localUser.category === 'enfermeria')
                }
              }
            });

            if (signUpError) {
              setError(signUpError.message);
              return { success: false, error: signUpError.message };
            }

            const { data: signInData, error: secondSignInError } = await withTimeout(
              supabase.auth.signInWithPassword({ email, password: supabasePassword }),
              12000
            );

            if (secondSignInError) {
              setError(secondSignInError.message);
              return { success: false, error: secondSignInError.message };
            }

            if (signInData?.user) {
              const appUser = await fetchProfile(signInData.user.id, signInData.user.email || '');
              setUser(appUser);
              setIsLoading(false);
            }

            return { success: true, message: 'Cuenta creada e iniciada sesión' };
          }
        }

        setError(signInError.message);
        return { success: false, error: signInError.message };
      }

      if (data?.user) {
        const appUser = await fetchProfile(data.user.id, data.user.email || '');
        setUser(appUser);
        setIsLoading(false);
      }

      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Error al iniciar sesión';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    setUser(null);
    setError(null);
    setIsLoading(false);
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
    } catch {
      // Ignore timeout/errors — clear local state regardless
    }
    clearSupabaseSession();
  }, []);

  // Temporizador de inactividad (1 hora = 3600000 ms)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT = 3600000; // 1 hora
    const WARNING_BEFORE = 60000; // 1 minuto antes
    let inactivityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;

    const doSignOut = () => {
      signOut();
    };

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      warningTimer = setTimeout(() => {
        clearTimeout(inactivityTimer);
        if (window.confirm('¿Todavía estás ahí? Pulsa OK para mantener la sesión activa.')) {
          resetTimer();
        } else {
          doSignOut();
        }
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE);
      inactivityTimer = setTimeout(doSignOut, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user, signOut]);

  return { user, isLoading, error, signIn, signOut };
}
