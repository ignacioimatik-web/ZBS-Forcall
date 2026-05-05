
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { signIn, signUp, error: authError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'medico' | 'enfermera'>('medico');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.success) {
          onLoginSuccess();
        } else {
          setError(result.error || 'Error al iniciar sesión');
        }
      } else {
        const result = await signUp(email, password, fullName, role, phone || undefined);
        if (result.success) {
          onLoginSuccess();
        } else {
          setError(result.error || 'Error al registrarse');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center scale-110"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070")',
          filter: 'blur(8px)'
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/30" />

      <div className="relative z-10 mb-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center p-4 bg-white/90 backdrop-blur border border-white/20 rounded-full mb-4 shadow-xl">
          <span className="material-symbols-outlined text-4xl text-earth-800">landscape</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">Zona Básica de Salud</h1>
        <p className="text-white/90 mt-2 font-bold uppercase tracking-widest text-xs drop-shadow-sm">Gestión Equipo Forcall</p>
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 p-8 transition-all duration-500 animate-slide-in-up">
        <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
              mode === 'login' ? 'bg-white text-forcall-700 shadow-md' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
              mode === 'register' ? 'bg-white text-forcall-700 shadow-md' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forcall-500 focus:border-transparent transition-all"
                placeholder="Tu nombre completo"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forcall-500 focus:border-transparent transition-all"
              placeholder="tu.email@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forcall-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                  Rol
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'medico' | 'enfermera')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forcall-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="medico">Médico/a</option>
                  <option value="enfermera">Enfermera/o</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Los roles de coordinación se asignan posteriormente
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forcall-500 focus:border-transparent transition-all"
                  placeholder="600 000 000"
                />
              </div>
            </>
          )}

          {(error || authError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all shadow-lg ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-forcall-600 hover:bg-forcall-700 hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                {mode === 'login' ? 'Iniciando sesión...' : 'Registrando...'}
              </span>
            ) : (
              mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            {mode === 'login' ? '¿Primera vez aquí?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-forcall-600 font-bold hover:underline"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 text-center text-white/70 text-xs">
        <p>© 2026 ZBS Forcall - Gestión Sanitaria</p>
      </div>
    </div>
  );
};


