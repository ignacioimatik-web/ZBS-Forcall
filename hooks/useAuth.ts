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
          return {
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            phone: profile.phone || undefined,
            role: appRoleToUserRole(profile.role),
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
        is2FAEnabled: false,
      };
    }
    
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: any = null;

    const initAuth = async () => {
      console.log('--- Auth Init Started ---');
      
      timeoutId = setTimeout(() => {
        if (isMounted && isLoading) {
          console.warn('Auth init timeout reached, forcing loading state to false');
          setIsLoading(false);
        }
      }, 5000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Session found for user:', session.user.id);
          const appUser = await fetchProfile(session.user.id, session.user.email || '');
          if (isMounted) {
            setUser(appUser);
          }
        } else {
          console.log('No active session found');
        }
      } catch (err) {
        console.error('Critical error in initAuth:', err);
      } finally {
        if (isMounted) {
          console.log('Auth Init Finished');
          setIsLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth State Change Event:', event);
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
    const supabasePassword = transformPin(password);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: supabasePassword,
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          const localUser = USERS.find(u => u.email === email);
          
          if (localUser && localUser.pin === password) {
            console.log('Auto-registrando usuario en Supabase...');
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password: supabasePassword,
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

            console.log('Registro OK, iniciando sesión automáticamente...');
            const { data: signInData, error: secondSignInError } = await supabase.auth.signInWithPassword({
              email,
              password: supabasePassword,
            });

            if (secondSignInError) {
              setError(secondSignInError.message);
              return { success: false, error: secondSignInError.message };
            }

            // Actualizar usuario directamente después del login
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

      // Actualizar usuario directamente después del login
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
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  // Temporizador de inactividad (1 hora = 3600000 ms)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT = 3600000; // 1 hora
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.log('Sesión cerrada por inactividad (1 hora)');
        signOut();
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user, signOut]);

  return { user, isLoading, error, signIn, signOut };
}
