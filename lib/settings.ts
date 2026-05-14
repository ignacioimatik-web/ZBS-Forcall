export type WaveType = 'none' | 'subtle' | 'dynamic' | 'radial' | 'particles';
export type ColorScheme = 'forcall' | 'ocean' | 'sunset' | 'forest' | 'night' | 'lavender';
export type Intensity = 'low' | 'medium' | 'high';

export interface AppSettings {
  waveType: WaveType;
  colorScheme: ColorScheme;
  intensity: Intensity;
}

const STORAGE_KEY = 'zbs_app_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  waveType: 'subtle',
  colorScheme: 'forcall',
  intensity: 'medium',
};

export interface SchemeColors {
  name: string;
  bg: string;
  sidebar: string;
  c1: string;
  c2: string;
  c3: string;
  accent: string;
}

export const COLOR_SCHEMES: Record<ColorScheme, SchemeColors> = {
  forcall: { name: 'Forcall', bg: '#f0f9ff', sidebar: '#0c4a6e', c1: '#0ea5e9', c2: '#0284c7', c3: '#0369a1', accent: '#0284c7' },
  ocean: { name: 'Océano', bg: '#f0fdfa', sidebar: '#115e59', c1: '#2dd4bf', c2: '#14b8a6', c3: '#0f766e', accent: '#14b8a6' },
  sunset: { name: 'Atardecer', bg: '#fff7ed', sidebar: '#9a3412', c1: '#fb923c', c2: '#f97316', c3: '#ea580c', accent: '#f97316' },
  forest: { name: 'Bosque', bg: '#f0fdf4', sidebar: '#166534', c1: '#4ade80', c2: '#22c55e', c3: '#16a34a', accent: '#22c55e' },
  night: { name: 'Noche', bg: '#0f172a', sidebar: '#1e1b4b', c1: '#818cf8', c2: '#6366f1', c3: '#4f46e5', accent: '#6366f1' },
  lavender: { name: 'Lavanda', bg: '#faf5ff', sidebar: '#581c87', c1: '#c084fc', c2: '#a855f7', c3: '#9333ea', accent: '#a855f7' },
};

export const WAVE_LABELS: Record<WaveType, string> = {
  none: 'Sin ondas',
  subtle: 'Olas sutiles',
  dynamic: 'Ondas dinámicas',
  radial: 'Ondas radiales',
  particles: 'Partículas',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { }
}
