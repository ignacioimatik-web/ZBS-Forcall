import React from 'react';
import { useT } from '../lib/i18n';
import { AppSettings, WaveType, ColorScheme, Intensity, COLOR_SCHEMES, WAVE_LABELS } from '../lib/settings';

interface SettingsViewProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const WAVE_ICONS: Record<WaveType, string> = {
  none: 'block',
  subtle: 'waves',
  dynamic: 'blur_on',
  radial: 'circle',
  particles: 'grain',
};

const INTENSITY_ICONS: Record<Intensity, string> = {
  low: 'low_density',
  medium: 'density_medium',
  high: 'density_large',
};

const WAVE_TYPES: WaveType[] = ['none', 'subtle', 'dynamic', 'radial', 'particles'];
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
            <span className="material-symbols-outlined text-lg text-forcall-600">auto_awesome</span>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Fondos con ondas</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {WAVE_TYPES.map(wt => {
              const sc = COLOR_SCHEMES[settings.colorScheme];
              const isActive = settings.waveType === wt;
              return (
                <button
                  key={wt}
                  onClick={() => update({ waveType: wt })}
                  className={`relative rounded-2xl p-4 border-2 transition-all ${
                    isActive
                      ? 'border-forcall-500 bg-forcall-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="h-12 rounded-xl mb-2 overflow-hidden relative" style={{
                    background: wt === 'none' ? '#f3f4f6' : `linear-gradient(135deg, ${sc.c1}, ${sc.c2}, ${sc.c3})`,
                    opacity: wt === 'none' ? 1 : 0.3,
                  }}>
                    {wt === 'subtle' && <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)', backgroundSize: '200% 200%' }} />}
                    {wt === 'dynamic' && <><div className="absolute w-3/4 h-3/4 rounded-full top-1/4 -left-1/4 opacity-40" style={{ background: sc.c1 }} /><div className="absolute w-1/2 h-1/2 rounded-full bottom-0 right-0 opacity-30" style={{ background: sc.c2 }} /></>}
                    {wt === 'radial' && <div className="absolute inset-2 rounded-full border-2" style={{ borderColor: sc.c1, opacity: 0.5 }} />}
                    {wt === 'particles' && <><div className="absolute w-1.5 h-1.5 rounded-full top-2 left-3" style={{ background: sc.c1 }} /><div className="absolute w-1 h-1 rounded-full top-4 left-6" style={{ background: sc.c2 }} /><div className="absolute w-2 h-2 rounded-full top-1 left-8" style={{ background: sc.c3 }} /></>}
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="material-symbols-outlined text-sm" style={{ color: isActive ? sc.accent : '#9ca3af' }}>{WAVE_ICONS[wt]}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>{WAVE_LABELS[wt]}</span>
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
                    isActive ? 'border-forcall-500 bg-forcall-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
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
                    isActive ? 'border-forcall-500 bg-forcall-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl ${isActive ? 'text-forcall-600' : 'text-gray-400'}`}>{INTENSITY_ICONS[int]}</span>
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
          <div className="rounded-2xl overflow-hidden border border-gray-200 h-40 relative" id="settings-preview">
            <div className="w-full h-full relative" style={{
              background: settings.waveType === 'none' ? '#f9fafb' : COLOR_SCHEMES[settings.colorScheme].bg,
            }}>
              {settings.waveType !== 'none' && (
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, ${COLOR_SCHEMES[settings.colorScheme].c1}, ${COLOR_SCHEMES[settings.colorScheme].c2}, ${COLOR_SCHEMES[settings.colorScheme].c3})`,
                    backgroundSize: '200% 200%',
                    animation: 'wave-drift 8s ease-in-out infinite',
                    opacity: settings.intensity === 'low' ? 0.08 : settings.intensity === 'high' ? 0.25 : 0.15,
                  }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-sm border border-white/50">
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
