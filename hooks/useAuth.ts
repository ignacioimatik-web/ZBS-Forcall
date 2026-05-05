import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User as AuthUser, Session, AuthError } from '@supabase/supabase-js';
import type { Profile, User, AppRole, appRoleToUserRole } from '../types';
import { appRoleToUserRole as convertRole } from '../types';

interface UseAuthResult {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, role: 'medico' | 'enfermera', phone?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar perfil desde base de datos
  const loadProfile = useCallback(async (authUser: AuthUser): Promise<Profile | null> => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        setError(`Error al cargar perfil: ${profileError.message}`);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error loading profile:', err);
      setError('Error inesperado al cargar perfil');
      return null;
    }
  }, []);

  // Convertir Profile a User legacy
  const profileToUser = useCallback((prof: Profile): User => {
    return {
      id: prof.id,
      name: prof.full_name,
      email: prof.email,
      phone: prof.phone || undefined,
      role: convertRole(prof.role),
      is2FAEnabled: false, // TODO: integrar con MFA de Supabase
      avatarUrl: undefined
    };
  }, []);

  // Cargar sesión inicial y suscribirse a cambios
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError(`Error al obtener sesión: ${sessionError.message}`);
          setIsLoading(false);
          return;
        }

        if (initialSession?.user && mounted) {
          const prof = await loadProfile(initialSession.user);
          if (prof && mounted) {
            setProfile(prof);
            setUser(profileToUser(prof));
            setSession(initialSession);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Error al inicializar autenticación');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Suscripción a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      console.log('Auth state change:', event);

      if (event === 'SIGNED_IN' && currentSession?.user) {
        const prof = await loadProfile(currentSession.user);
        if (prof && mounted) {
          setProfile(prof);
          setUser(profileToUser(prof));
          setSession(currentSession);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setUser(null);
        setSession(null);
      } else if (event === 'TOKEN_REFRESHED' && currentSession) {
        setSession(currentSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, profileToUser]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return { success: false, error: signInError.message };
      }

      if (data.user) {
        const prof = await loadProfile(data.user);
        if (prof) {
          setProfile(prof);
          setUser(profileToUser(prof));
          setSession(data.session);
          return { success: true };
        }
      }

      return { success: false, error: 'No se pudo cargar el perfil' };
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al iniciar sesión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [loadProfile, profileToUser]);

  // Sign up
  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: 'medico' | 'enfermera',
    phone?: string
  ) => {
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            phone: phone || null
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        return { success: false, error: signUpError.message };
      }

      if (data.user) {
        // Esperar un momento para que el trigger cree el perfil
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const prof = await loadProfile(data.user);
        if (prof) {
          setProfile(prof);
          setUser(profileToUser(prof));
          setSession(data.session);
          return { success: true };
        }
      }

      return { success: false, error: 'No se pudo crear el perfil' };
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al registrarse';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [loadProfile, profileToUser]);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        console.error('Error signing out:', signOutError);
      }
      setProfile(null);
      setUser(null);
      setSession(null);
    } catch (err: any) {
      console.error('Unexpected error signing out:', err);
      setError(err?.message || 'Error al cerrar sesión');
    }
  }, []);

  // Refrescar perfil manualmente
  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const prof = await loadProfile(session.user);
    if (prof) {
      setProfile(prof);
      setUser(profileToUser(prof));
    }
  }, [session, loadProfile, profileToUser]);

  return {
    user,
    profile,
    session,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile
  };
}
