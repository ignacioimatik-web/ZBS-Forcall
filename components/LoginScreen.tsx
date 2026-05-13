import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIES, getUsersByCategory } from '../lib/users';
import { VERSION_STRING } from '../lib/version';
import { useT } from '../lib/i18n';
import type { Lang } from '../lib/i18n/types';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

type Step = 'category' | 'user' | 'pin';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { t, lang, setLang } = useT();
  const { signIn, error: authError } = useAuth();
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitWave, setExitWave] = useState(false);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setError(null);
    setStep('user');
  };

  const handleUserSelect = (userId: string, userName: string, userEmail: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSelectedUserEmail(userEmail);
    setPin('');
    setError(null);
    setStep('pin');
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 6) return;
    setError(null);
    setIsLoading(true);
    try {
      if (!selectedUserEmail) {
        setError(t('login.userNotFound'));
        return;
      }

      const result = await signIn(selectedUserEmail, pin);
      if (result.success) {
        setExitWave(true);
        setTimeout(() => onLoginSuccess(), 600);
      } else {
        setError(result.error || t('login.wrongPin'));
        setPin('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 'pin') {
      setStep('user');
      setPin('');
    } else if (step === 'user') {
      setStep('category');
      setSelectedCategory('');
    }
  };

  const categoryUsers = selectedCategory ? getUsersByCategory(selectedCategory) : [];

  const categoryColors: Record<string, string> = {
    Medicina: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800',
    enfermeria: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800',
    Administrativos: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800',
  };
  const categoryIconColors: Record<string, string> = {
    Medicina: 'text-blue-500',
    enfermeria: 'text-green-500',
    Administrativos: 'text-amber-500',
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center scale-110"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070")',
          filter: 'blur(8px)',
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/35" />

      {/* Exit wave overlay */}
      {exitWave && (
        <div className="absolute inset-0 z-50 animate-wave-in flex items-center justify-center bg-forcall-600">
          <div className="text-center text-white animate-stagger">
            <div className="inline-flex items-center justify-center p-4 bg-white/20 backdrop-blur rounded-full mb-4">
              <span className="material-symbols-outlined text-5xl">landscape</span>
            </div>
              <p className="text-lg font-black uppercase tracking-widest">{t('login.bienvenido')}</p>
            <p className="text-2xl font-black mt-1">{selectedUserName}</p>
          </div>
        </div>
      )}

      {/* Logo */}
      <div className="relative z-10 mb-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center p-4 bg-white/90 backdrop-blur border border-white/20 rounded-full mb-4 shadow-xl">
          <span className="material-symbols-outlined text-4xl text-earth-800">landscape</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
          {t('login.title')}
        </h1>
        <p className="text-white/90 mt-2 font-bold uppercase tracking-widest text-xs drop-shadow-sm">
          {t('login.subtitle')}
        </p>
      </div>

      {/* Card */}
      <div className="relative z-10 bg-white/97 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/20">
        {/* Card Header with back button */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step !== 'category' && (
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            )}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                {step === 'category' && t('login.access')}
                {step === 'user' && selectedCategory}
                {step === 'pin' && selectedUserName}
              </p>
              <h2 className="text-lg font-black text-gray-800 leading-tight">
                {step === 'category' && t('login.selectGroup')}
                {step === 'user' && t('login.selectName')}
                {step === 'pin' && t('login.enterPin')}
              </h2>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-3">
            {(['category', 'user', 'pin'] as Step[]).map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-forcall-600'
                    : step === 'pin' && s !== 'pin'
                    ? 'w-2 bg-forcall-300'
                    : step === 'user' && s === 'category'
                    ? 'w-2 bg-forcall-300'
                    : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Step 1: Category */}
          {step === 'category' && (
            <div key="category" className="animate-wave-in animate-stagger space-y-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 font-semibold text-left transition-all shadow-sm hover:shadow-md ${
                    categoryColors[cat.id] || 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-2xl ${
                      categoryIconColors[cat.id] || 'text-gray-400'
                    }`}
                  >
                    {cat.icon}
                  </span>
                  <span className="text-base font-bold">{cat.label}</span>
                  <span className="material-symbols-outlined text-lg ml-auto opacity-40">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: User selection */}
          {step === 'user' && (
            <div key="user" className="animate-wave-in animate-stagger space-y-2">
              {categoryUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="material-symbols-outlined text-4xl block mb-2">person_off</span>
                  <p className="text-sm">{t('login.noUsers')}</p>
                </div>
              ) : (
                categoryUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleUserSelect(u.id, u.name, u.email)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-forcall-50 hover:border-forcall-300 font-semibold text-left transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full bg-forcall-100 flex items-center justify-center text-forcall-700 font-black text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-gray-800 font-bold">{u.name}</span>
                    <span className="material-symbols-outlined text-lg ml-auto text-gray-300 group-hover:text-forcall-400 transition-colors">
                      chevron_right
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 3: PIN entry */}
          {step === 'pin' && (
            <div key="pin" className="animate-wave-in animate-stagger">
              {/* PIN display */}
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                      i < pin.length
                        ? 'border-forcall-500 bg-forcall-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {i < pin.length ? (
                      <div className="w-3 h-3 rounded-full bg-forcall-600" />
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Numeric keypad */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    onClick={() => handlePinDigit(d)}
                    disabled={pin.length === 6 || isLoading}
                    className="h-14 rounded-xl bg-gray-50 border border-gray-200 text-xl font-bold text-gray-800 hover:bg-forcall-50 hover:border-forcall-300 active:scale-95 transition-all disabled:opacity-40"
                  >
                    {d}
                  </button>
                ))}
                <div /> {/* empty cell */}
                <button
                  onClick={() => handlePinDigit('0')}
                  disabled={pin.length === 6 || isLoading}
                  className="h-14 rounded-xl bg-gray-50 border border-gray-200 text-xl font-bold text-gray-800 hover:bg-forcall-50 hover:border-forcall-300 active:scale-95 transition-all disabled:opacity-40"
                >
                  0
                </button>
                <button
                  onClick={handlePinDelete}
                  className="h-14 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xl">backspace</span>
                </button>
              </div>

              {/* Error message */}
              {(error || authError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm text-center mb-3">
                  {error || authError}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handlePinSubmit}
                disabled={pin.length !== 6 || isLoading}
                className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-md ${
                  pin.length === 6 && !isLoading
                    ? 'bg-forcall-600 hover:bg-forcall-700 hover:shadow-lg'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {t('login.verifying')}
                  </span>
                ) : (
                  t('login.enter')
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-6 text-center text-white/60 text-xs space-y-2 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-3">
          <button
            onClick={() => setLang('es')}
            className={`px-3 py-1 rounded-lg font-bold uppercase tracking-wider transition-all ${lang === 'es' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            ES
          </button>
          <span className="text-white/20">|</span>
          <button
            onClick={() => setLang('ca')}
            className={`px-3 py-1 rounded-lg font-bold uppercase tracking-wider transition-all ${lang === 'ca' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            VA
          </button>
        </div>
        <p>© 2026 ZBS Forcall — {VERSION_STRING}</p>
        <button
          onClick={() => {
            document.cookie.split(';').forEach(c => {
              document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=; path=/; max-age=0');
            });
            localStorage.clear();
            sessionStorage.clear();
            if ('caches' in window) {
              caches.keys().then(names => names.forEach(n => caches.delete(n)));
            }
            window.location.reload();
          }}
          className="text-white/40 hover:text-white/80 underline underline-offset-2 transition-colors"
        >
          {t('login.clearData')}
        </button>
      </div>
    </div>
  );
};
