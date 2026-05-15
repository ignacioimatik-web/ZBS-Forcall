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
      <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/30 shadow-black/10">
        {/* Card Header with back button */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100/80">
          <div className="flex items-center gap-3 min-h-[44px]">
            {step !== 'category' && (
              <button
                onClick={handleBack}
                className="p-1.5 -ml-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            )}
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] font-bold">
                {step === 'category' && t('login.access')}
                {step === 'user' && selectedCategory}
                {step === 'pin' && selectedUserName}
              </p>
              <h2 className="text-lg font-black text-gray-900 leading-tight mt-0.5">
                {step === 'category' && t('login.selectGroup')}
                {step === 'user' && t('login.selectName')}
                {step === 'pin' && t('login.enterPin')}
              </h2>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-3">
            {(['category', 'user', 'pin'] as Step[]).map((s, idx) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-500 ease-out ${
                  s === step
                    ? 'w-6 bg-forcall-600'
                    : idx < ['category', 'user', 'pin'].indexOf(step)
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
            <div key="category" className="animate-wave-in animate-stagger space-y-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4.5 rounded-2xl border-2 font-semibold text-left transition-all duration-200 shadow-xs hover:shadow-lg active:scale-[0.98] ${
                    categoryColors[cat.id] || 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <span className={`p-2.5 rounded-xl bg-white/80 shadow-sm ${categoryIconColors[cat.id] || 'text-gray-400'}`}>
                    <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                  </span>
                  <span className="text-base font-bold flex-1">{t(`login.${({ Medicina: 'medicina', enfermeria: 'enfermeria', Administrativos: 'administrativos' } as Record<string, string>)[cat.id]}`)}</span>
                  <span className="material-symbols-outlined text-lg text-gray-300 group-hover:text-gray-500 transition-colors">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: User selection */}
          {step === 'user' && (
            <div key="user" className="animate-wave-in animate-stagger space-y-1.5">
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
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-200/80 bg-white hover:bg-forcall-50 hover:border-forcall-300 hover:shadow-md font-semibold text-left transition-all duration-200 group active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forcall-500 to-forcall-700 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-gray-800 font-bold flex-1">{u.name}</span>
                    <span className="material-symbols-outlined text-lg text-gray-300 group-hover:text-forcall-500 transition-colors">
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
                    className={`w-11 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${
                      i < pin.length
                        ? 'border-forcall-500 bg-forcall-50 shadow-sm scale-105'
                        : pin.length === i
                        ? 'border-forcall-300 bg-gray-50 animate-pulse'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {i < pin.length ? (
                      <div className="w-3 h-3 rounded-full bg-forcall-600 transition-all duration-200 scale-100" />
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Numeric keypad */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    onClick={() => handlePinDigit(d)}
                    disabled={pin.length === 6 || isLoading}
                    className="h-14 rounded-2xl bg-white border border-gray-200/80 text-xl font-bold text-gray-800 shadow-xs hover:bg-forcall-50 hover:border-forcall-300 hover:shadow-md active:scale-90 active:bg-forcall-100 transition-all duration-150 disabled:opacity-30 disabled:active:scale-100"
                  >
                    {d}
                  </button>
                ))}
                <div /> {/* empty cell */}
                <button
                  onClick={() => handlePinDigit('0')}
                  disabled={pin.length === 6 || isLoading}
                  className="h-14 rounded-2xl bg-white border border-gray-200/80 text-xl font-bold text-gray-800 shadow-xs hover:bg-forcall-50 hover:border-forcall-300 hover:shadow-md active:scale-90 active:bg-forcall-100 transition-all duration-150 disabled:opacity-30 disabled:active:scale-100"
                >
                  0
                </button>
                <button
                  onClick={handlePinDelete}
                  className="h-14 rounded-2xl bg-white border border-gray-200/80 text-gray-500 shadow-xs hover:bg-red-50 hover:border-red-200 hover:text-red-600 hover:shadow-md active:scale-90 transition-all duration-150 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xl">backspace</span>
                </button>
              </div>

              {/* Error message */}
              {(error || authError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm text-center mb-3 font-medium shadow-xs">
                  {error || authError}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handlePinSubmit}
                disabled={pin.length !== 6 || isLoading}
                className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all duration-200 shadow-md active:scale-[0.97] ${
                  pin.length === 6 && !isLoading
                    ? 'bg-gradient-to-r from-forcall-600 to-forcall-700 hover:from-forcall-700 hover:to-forcall-800 hover:shadow-lg'
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
        <div className="flex items-center justify-center gap-1 p-0.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 mb-3">
          <button
            onClick={() => setLang('es')}
            className={`px-4 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-all duration-200 ${
              lang === 'es' ? 'bg-white/25 text-white shadow-sm' : 'text-white/50 hover:text-white/80'
            }`}
          >
            ES
          </button>
          <button
            onClick={() => setLang('ca')}
            className={`px-4 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-all duration-200 ${
              lang === 'ca' ? 'bg-white/25 text-white shadow-sm' : 'text-white/50 hover:text-white/80'
            }`}
          >
            VA
          </button>
        </div>
        <p>{t('login.footer').replace('{version}', VERSION_STRING)}</p>
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
