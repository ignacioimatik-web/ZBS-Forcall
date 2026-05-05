
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

interface SelectedMember {
  name: string;
  role: UserRole;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);
  const [passcode, setPasscode] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const staffCodes: Record<string, string> = {
    "Dra. Elena Benages": "0000",
    "Dra. Delia Mestre": "1234",
    "Dr. Fernando Sierra": "2345",
    "Dr. Jorge Ramón": "3456",
    "Dr. Frank Castillo": "4567",
    "Dr. Ilie Popov": "6789",
    "Invitado": "0000",
    "Xelo Carbó": "9999",
    "Rosa": "9876",
    "Maite": "8765",
    "Joan": "1111"
  };

  const doctors = [
    "Dra. Elena Benages",
    "Dra. Delia Mestre",
    "Dr. Fernando Sierra",
    "Dr. Jorge Ramón",
    "Dr. Frank Castillo",
    "Dr. Ilie Popov",
    "Invitado"
  ];

  const nurses = [
    "Xelo Carbó",
    "Rosa",
    "Maite"
  ];

  const admins = [
    "Joan"
  ];

  useEffect(() => {
    if (selectedMember && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [selectedMember]);

  const handleMemberSelect = (name: string, role: UserRole) => {
    setSelectedMember({ name, role });
    setPasscode(['', '', '', '']);
    setError(false);
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newPasscode = [...passcode];
    newPasscode[index] = value;
    setPasscode(newPasscode);
    setError(false);

    if (value !== '' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (newPasscode.every(digit => digit !== '')) {
      verifyPasscode(newPasscode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && passcode[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const verifyPasscode = (code: string) => {
    setIsLoading(true);
    setTimeout(() => {
      if (selectedMember && staffCodes[selectedMember.name] === code) {
        // Asignación de rol de Coordinación o Administración
        let finalRole: UserRole = selectedMember.role;
        if (selectedMember.name === "Dra. Elena Benages" || selectedMember.name === "Xelo Carbó") {
          finalRole = "Coordinador";
        } else if (selectedMember.name === "Joan") {
          finalRole = "Administrador";
        }
        
        onLoginSuccess(
          'email', 
          `${selectedMember.name.toLowerCase().replace(/\s/g, '.')}@forcall.salud.es`, 
          finalRole, 
          '600000000'
        );
      } else {
        setError(true);
        setPasscode(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
      setIsLoading(false);
    }, 600);
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
        {!selectedMember ? (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl font-bold text-gray-800 text-center">Identificación de Usuario</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-black text-emerald-700 uppercase tracking-widest ml-1">
                  <span className="material-symbols-outlined text-sm">stethoscope</span>
                  Personal de Medicina / Otros
                </label>
                <div className="relative group">
                  <select 
                    onChange={(e) => handleMemberSelect(e.target.value, 'Médico')}
                    defaultValue=""
                    className="w-full appearance-none bg-emerald-50 border border-emerald-100 text-gray-800 py-3 px-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="" disabled>Selecciona facultativo...</option>
                    {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">expand_more</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-black text-rose-700 uppercase tracking-widest ml-1">
                  <span className="material-symbols-outlined text-sm">vaccines</span>
                  Personal de Enfermería
                </label>
                <div className="relative group">
                  <select 
                    onChange={(e) => handleMemberSelect(e.target.value, 'Enfermera')}
                    defaultValue=""
                    className="w-full appearance-none bg-rose-50 border border-rose-100 text-gray-800 py-3 px-4 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="" disabled>Selecciona enfermero/a...</option>
                    {nurses.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-rose-600">expand_more</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-widest ml-1">
                  <span className="material-symbols-outlined text-sm">badge</span>
                  Personal Administrativo
                </label>
                <div className="relative group">
                  <select 
                    onChange={(e) => handleMemberSelect(e.target.value, 'Administrador')}
                    defaultValue=""
                    className="w-full appearance-none bg-blue-50 border border-blue-100 text-gray-800 py-3 px-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="" disabled>Selecciona administrativo...</option>
                    {admins.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">expand_more</span>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-400 text-center leading-relaxed font-medium">
              Acceso restringido a personal sanitario de la ZBS Forcall.
            </p>
          </div>
        ) : (
          <div className="animate-slide-in-up text-center space-y-8">
            <div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="mb-4 text-forcall-700 flex items-center gap-1 mx-auto text-xs font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Cambiar de usuario
              </button>
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 ${selectedMember.role === 'Médico' ? 'bg-emerald-100 text-emerald-700' : selectedMember.role === 'Enfermera' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                <span className="material-symbols-outlined text-3xl">
                  {selectedMember.name === 'Joan' ? 'badge' : (selectedMember.role === 'Médico' ? (selectedMember.name === 'Invitado' ? 'person' : 'stethoscope') : 'vaccines')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{selectedMember.name}</h2>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-black">
                {selectedMember.name === "Dra. Elena Benages" || selectedMember.name === "Xelo Carbó" ? "Coordinación" : (selectedMember.name === 'Joan' ? 'Administrativo' : (selectedMember.name === 'Invitado' ? 'Acceso Invitado' : selectedMember.role))}
              </p>
            </div>

            <div className="space-y-6">
              <label className="block text-sm font-medium text-gray-600">Introduce el código de seguridad</label>
              
              <div className="flex justify-center gap-4">
                {passcode.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="password"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-14 h-16 text-center text-3xl font-bold rounded-2xl border-2 transition-all outline-none ${
                      error 
                        ? 'border-red-500 bg-red-50 text-red-600 animate-shake' 
                        : digit 
                          ? 'border-forcall-500 bg-forcall-50 text-forcall-800' 
                          : 'border-gray-200 focus:border-forcall-400 bg-gray-50'
                    }`}
                    placeholder="-"
                  />
                ))}
              </div>

              {error && (
                <div className="text-red-600 text-xs font-bold flex items-center justify-center gap-1 animate-fade-in">
                  <span className="material-symbols-outlined text-sm">error</span>
                  Código incorrecto. Inténtalo de nuevo.
                </div>
              )}

              {isLoading && (
                <div className="flex justify-center">
                  <span className="material-symbols-outlined animate-spin text-forcall-600">progress_activity</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <p className="relative z-10 mt-12 text-[10px] text-white/70 font-black uppercase tracking-[0.2em]">
        &copy; 2026 Zona Basica de Salud Forcall. Els Ports.
      </p>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}} />
    </div>
  );
};
