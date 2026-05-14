import React from 'react';
import { useT } from '../lib/i18n';
import { AppSettings, TransitionEffect, ColorScheme, Intensity, COLOR_SCHEMES, EFFECT_LABELS, EFFECT_ICONS } from '../lib/settings';

interface SettingsViewProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const EFFECTS: TransitionEffect[] = ['none', 'gradient', 'blobs', 'rings', 'particles', 'glow', 'aurora', 'shimmer'];
const COLOR_KEYS: ColorScheme[] = ['forcall', 'ocean', 'sunset', 'forest', 'night', 'lavender'];
const INTENSITIES: Intensity[] = ['low', 'medium', 'high'];

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChange }) => {
  const { t } = useT();

  const update = (partial: Partial<AppSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-forcall-600">settings</span>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">{t('sidebar.configuracion')}</h2>
            <p className="text-[10px] text-gray-400 font-medium">Personaliza la apariencia de la aplicación</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-lg text-forcall-600">slideshow</span>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Efectos de transición</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EFFECTS.map(ef => {
              const sc = COLOR_SCHEMES[settings.colorScheme];
              const isActive = settings.effect === ef;
              return (
                <button
                  key={ef}
                  onClick={() => update({ effect: ef })}
                  className={`relative rounded-2xl p-3 border-2 transition-all ${
                    isActive
                      ? 'border-forcall-500 bg-forcall-50 shadow-md ring-2 ring-forcall-200'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="h-10 rounded-xl mb-2 overflow-hidden relative flex items-center justify-center" style={{
                    background: ef === 'none' ? '#f3f4f6' : `linear-gradient(135deg, ${sc.c1}, ${sc.c2})`,
                  }}>
                    {ef === 'gradient' && <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.4) 50%, transparent 80%)', backgroundSize: '200% 200%' }} />}
                    {ef === 'blobs' && <><div className="absolute w-8 h-8 rounded-full opacity-40" style={{ background: sc.c1, left: '-8px', top: '6px' }} /><div className="absolute w-6 h-6 rounded-full opacity-30" style={{ background: sc.c2, right: '-4px', bottom: '-4px' }} /></>}
                    {ef === 'rings' && <div className="absolute inset-1 rounded-full border-2" style={{ borderColor: sc.c1, opacity: 0.5 }} />}
                    {ef === 'particles' && <><div className="absolute w-1.5 h-1.5 rounded-full" style={{ background: sc.c1, top: '4px', left: '6px' }} /><div className="absolute w-1 h-1 rounded-full" style={{ background: sc.c2, top: '12px', right: '8px' }} /><div className="absolute w-2 h-2 rounded-full" style={{ background: sc.c3, bottom: '4px', left: '12px' }} /></>}
                    {ef === 'glow' && <div className="w-4 h-4 rounded-full animate-ping opacity-40" style={{ background: sc.c1 }} />}
                    {ef === 'aurora' && <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(45deg, ${sc.c1}, transparent, ${sc.c3})` }} />}
                    {ef === 'shimmer' && <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)`, backgroundSize: '200% 100%' }} />}
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className={`material-symbols-outlined text-sm ${isActive ? 'text-forcall-600' : 'text-gray-400'}`}>{EFFECT_ICONS[ef]}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>{EFFECT_LABELS[ef]}</span>
                  </div>
                  {isActive && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-forcall-600 text-white flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined text-[10px]">check</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-lg text-forcall-600">palette</span>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Esquema de color</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {COLOR_KEYS.map(ck => {
              const sc = COLOR_SCHEMES[ck];
              const isActive = settings.colorScheme === ck;
              return (
                <button
                  key={ck}
                  onClick={() => update({ colorScheme: ck })}
                  className={`relative rounded-2xl p-3 border-2 transition-all ${
                    isActive ? 'border-forcall-500 bg-forcall-50 shadow-md ring-2 ring-forcall-200' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="h-10 rounded-xl mb-2 flex gap-0.5 overflow-hidden">
                    <div className="flex-1" style={{ background: sc.c1 }} />
                    <div className="flex-1" style={{ background: sc.c2 }} />
                    <div className="flex-1" style={{ background: sc.c3 }} />
                  </div>
                  <span className={`block text-center text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                    {sc.name}
                  </span>
                  {isActive && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-forcall-600 text-white flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined text-[10px]">check</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-lg text-forcall-600">tune</span>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Intensidad del efecto</h3>
          </div>
          <div className="flex gap-3 max-w-sm">
            {INTENSITIES.map(int => {
              const isActive = settings.intensity === int;
              return (
                <button
                  key={int}
                  onClick={() => update({ intensity: int })}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-2xl p-4 border-2 transition-all ${
                    isActive ? 'border-forcall-500 bg-forcall-50 shadow-md ring-2 ring-forcall-200' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl ${isActive ? 'text-forcall-600' : 'text-gray-400'}`}>
                    {int === 'low' ? 'low_density' : int === 'medium' ? 'density_medium' : 'density_large'}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                    {int === 'low' ? 'Sutil' : int === 'medium' ? 'Media' : 'Fuerte'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-lg text-forcall-600">visibility</span>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Vista previa</h3>
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200 h-44 relative">
            <div className="w-full h-full relative overflow-hidden" style={{
              background: settings.effect === 'none' ? '#f9fafb' : COLOR_SCHEMES[settings.colorScheme].bg,
            }}>
              {settings.effect !== 'none' && (
                <div
                  className={`absolute inset-0`}
                  style={{
                    background: `linear-gradient(135deg, ${COLOR_SCHEMES[settings.colorScheme].c1}, ${COLOR_SCHEMES[settings.colorScheme].c2}, ${COLOR_SCHEMES[settings.colorScheme].c3})`,
                    backgroundSize: '400% 400%',
                    animation: 'eff-gradient 10s ease infinite',
                    opacity: settings.intensity === 'low' ? 0.08 : settings.intensity === 'high' ? 0.25 : 0.15,
                  }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-sm border border-white/50">
                  <p className="text-xs font-bold text-gray-600">Vista previa del fondo</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
