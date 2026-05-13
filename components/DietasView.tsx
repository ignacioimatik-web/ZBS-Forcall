import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';

interface Town {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface RouteLeg {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  distanceKm: number;
  computable: boolean;
}

interface DayData {
  townId: string;
  patient: string;
}

interface DietaEntry {
  date: string;
  townId: string;
  townName: string;
  patient: string;
  savedBy: string;
  savedById: string;
  totalKm: number;
  computableKm: number;
  timestamp: string;
}

const TOWNS: Town[] = [
  { id: 'forcall', name: 'Forcall', lat: 40.64609, lng: -0.19957 },
  { id: 'cinctorres', name: 'Cinctorres', lat: 40.57646, lng: -0.21857 },
  { id: 'villores', name: 'Villores', lat: 40.67630, lng: -0.20068 },
  { id: 'portell', name: 'Portell de Morella', lat: 40.53280, lng: -0.26218 },
  { id: 'la_mata', name: 'La Mata de Morella', lat: 40.61643, lng: -0.27953 },
  { id: 'todolella', name: 'Todolella', lat: 40.64698, lng: -0.24676 },
  { id: 'olocau', name: 'Olocau del Rey', lat: 40.63763, lng: -0.33988 },
  { id: 'zorita', name: 'Zorita del Maestrazgo', lat: 40.72871, lng: -0.16628 },
  { id: 'palanques', name: 'Palanques', lat: 40.71737, lng: -0.17905 },
];

function getTown(id: string): Town | undefined {
  return TOWNS.find(t => t.id === id);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const STORAGE_KEY = 'zbs_dietas_sessions';

function loadSavedDates(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadDayData(dateStr: string): DayData | null {
  try {
    const raw = localStorage.getItem(`zbs_dietas_${dateStr}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDayData(dateStr: string, data: DayData) {
  localStorage.setItem(`zbs_dietas_${dateStr}`, JSON.stringify(data));
  const dates = loadSavedDates();
  if (!dates.includes(dateStr)) {
    dates.unshift(dateStr);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dates.slice(0, 365)));
  }
}

function deleteDayData(dateStr: string) {
  localStorage.removeItem(`zbs_dietas_${dateStr}`);
  const dates = loadSavedDates().filter(d => d !== dateStr);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
}

const REGISTRY_KEY = 'zbs_dietas_registry';

function loadRegistry(): DietaEntry[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRegistryEntry(entry: DietaEntry) {
  const registry = loadRegistry();
  const idx = registry.findIndex(e => e.date === entry.date);
  if (idx >= 0) {
    registry[idx] = entry;
  } else {
    registry.unshift(entry);
  }
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry.slice(0, 365)));
}

function removeRegistryEntry(dateStr: string) {
  const registry = loadRegistry().filter(e => e.date !== dateStr);
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

export const DietasView: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
  const [date, setDate] = useState(todayStr());
  const [townId, setTownId] = useState(TOWNS[1]?.id || '');
  const [patient, setPatient] = useState('');
  const [legs, setLegs] = useState<RouteLeg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDates, setSavedDates] = useState<string[]>([]);
  const [registry, setRegistry] = useState<DietaEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setSavedDates(loadSavedDates());
    setRegistry(loadRegistry());
    const data = loadDayData(date);
    if (data) {
      setTownId(data.townId);
      setPatient(data.patient);
      setLegs([]);
    } else {
      setTownId(TOWNS[1]?.id || '');
      setPatient('');
      setLegs([]);
    }
  }, [date]);

  const toggleComputable = (index: number) => {
    setLegs(prev => prev.map((leg, i) => i === index ? { ...leg, computable: !leg.computable } : leg));
  };

  const calculateRoute = useCallback(async () => {
    const town = getTown(townId);
    if (!town) { setError('Selecciona un pueblo.'); return; }

    setLoading(true);
    setError(null);

    const forcall = getTown('forcall')!;
    const points = [
      { id: 'forcall', name: forcall.name, ...forcall },
      { id: townId, name: town.name, ...town },
      { id: 'forcall', name: forcall.name, ...forcall },
    ];

    try {
      const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`);
      if (!res.ok) throw new Error(`OSRM ${res.status}`);
      const data = await res.json();
      if (data.code !== 'Ok') throw new Error(data.message || 'Error de ruta');

      const routeLegs: RouteLeg[] = data.routes[0].legs.map((leg: { distance: number }, i: number) => ({
        fromId: points[i].id,
        toId: points[i + 1].id,
        fromName: points[i].name,
        toName: points[i + 1].name,
        distanceKm: Math.round((leg.distance / 1000) * 10) / 10,
        computable: true,
      }));

      setLegs(routeLegs);
    } catch {
      const d1 = haversineKm(forcall.lat, forcall.lng, town.lat, town.lng);
      setLegs([
        { fromId: 'forcall', toId: townId, fromName: 'Forcall', toName: town.name, distanceKm: Math.round(d1 * 1.3 * 10) / 10, computable: true },
        { fromId: townId, toId: 'forcall', fromName: town.name, toName: 'Forcall', distanceKm: Math.round(d1 * 1.3 * 10) / 10, computable: true },
      ]);
      setError('No se pudo calcular la ruta real. Distancia estimada (línea recta × 1.3).');
    } finally {
      setLoading(false);
    }
  }, [townId]);

  const saveSession = () => {
    const town = getTown(townId);
    saveDayData(date, { townId, patient });
    saveRegistryEntry({
      date,
      townId,
      townName: town?.name || townId,
      patient,
      savedBy: currentUser?.name || 'Usuario',
      savedById: currentUser?.id || '',
      totalKm: Math.round(totalKm * 10) / 10,
      computableKm: Math.round(totalComputable * 10) / 10,
      timestamp: new Date().toISOString(),
    });
    setSavedDates(loadSavedDates());
    setRegistry(loadRegistry());
  };

  const deleteSession = () => {
    deleteDayData(date);
    removeRegistryEntry(date);
    setTownId(TOWNS[1]?.id || '');
    setPatient('');
    setLegs([]);
    setSavedDates(loadSavedDates());
    setRegistry(loadRegistry());
  };

  const totalComputable = legs.filter(l => l.computable).reduce((sum, l) => sum + l.distanceKm, 0);
  const totalKm = legs.reduce((sum, l) => sum + l.distanceKm, 0);

  const navigateDate = (offset: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-80">Dietas</p>
          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2 mt-2">
            <span className="material-symbols-outlined text-3xl">route</span>
            Kilometraje — Hoja de dietas
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(!showHistory)} className="bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-2xl text-xs font-black transition-all border border-white/30 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">history</span>
            HISTORIAL
          </button>
        </div>
      </div>

      {showHistory && savedDates.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-stone-50 border-b border-gray-100">
            <h3 className="text-sm font-black text-gray-900">Días guardados</h3>
          </div>
          <div className="p-2 max-h-60 overflow-y-auto no-scrollbar">
            {savedDates.map(d => (
              <button
                key={d}
                onClick={() => { setDate(d); setShowHistory(false); }}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-colors ${d === date ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                {formatDateDisplay(d)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 items-start">
        <div className="2xl:col-span-8 space-y-6">
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <span className="material-symbols-outlined text-gray-500">chevron_left</span>
              </button>
              <span className="text-sm font-black text-gray-800">{formatDateDisplay(date)}</span>
              <button onClick={() => navigateDate(1)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <span className="material-symbols-outlined text-gray-500">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-stone-50 border-b border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Itinerario único</p>
              <h3 className="text-lg font-black text-gray-900 mt-1">Selecciona el destino</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="material-symbols-outlined text-emerald-600">home</span>
                <span className="text-sm font-black text-emerald-800">Forcall</span>
                <span className="material-symbols-outlined text-emerald-300">arrow_forward</span>
                <span className="material-symbols-outlined text-emerald-600">location_on</span>
                <span className="text-sm font-black text-emerald-800 flex-1">{getTown(townId)?.name || '—'}</span>
                <span className="material-symbols-outlined text-emerald-300">arrow_forward</span>
                <span className="material-symbols-outlined text-emerald-600">home</span>
                <span className="text-sm font-black text-emerald-800">Forcall</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={townId}
                  onChange={e => { setTownId(e.target.value); setLegs([]); }}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {TOWNS.filter(t => t.id !== 'forcall').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={patient}
                  onChange={e => setPatient(e.target.value)}
                  placeholder="Paciente (opcional)"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>

          <button
            onClick={calculateRoute}
            disabled={!townId || townId === 'forcall' || loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-md"
          >
            <span className={`material-symbols-outlined text-2xl ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'refresh' : 'calculate'}
            </span>
            {loading ? 'Calculando ruta...' : 'Calcular ruta y kilometraje'}
          </button>

          {error && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-[10px] font-bold text-amber-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">warning</span>
              {error}
            </div>
          )}
        </div>

        <div className="2xl:col-span-4 space-y-6">
          {legs.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-stone-50 border-b border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Resultado</p>
                <h3 className="text-lg font-black text-gray-900 mt-1">Desglose del trayecto</h3>
              </div>
              <div className="p-4 space-y-2">
                {legs.map((leg, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${leg.computable ? 'border-emerald-100 bg-emerald-50' : 'border-gray-100 bg-gray-50'} transition-all`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tramo {i + 1}</span>
                      <button
                        onClick={() => toggleComputable(i)}
                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg transition-all ${leg.computable ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}
                      >
                        {leg.computable ? 'Computable' : 'No computable'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <span>{leg.fromName}</span>
                      <span className="material-symbols-outlined text-gray-300 text-lg">arrow_forward</span>
                      <span>{leg.toName}</span>
                    </div>
                    <p className="text-right text-lg font-black text-gray-900 mt-1">{leg.distanceKm.toFixed(1)} km</p>
                  </div>
                ))}

                <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
                  <div className="flex justify-between items-center px-3">
                    <span className="text-[10px] font-bold text-gray-500">Total computable</span>
                    <span className="text-xl font-black text-emerald-700">{totalComputable.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between items-center px-3">
                    <span className="text-[10px] font-bold text-gray-400">Total recorrido</span>
                    <span className="text-sm font-bold text-gray-500">{totalKm.toFixed(1)} km</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={saveSession}
              className="flex-1 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              Guardar día
            </button>
            <button
              onClick={deleteSession}
              className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Registro de Dietas */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 bg-gray-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg"><span className="material-symbols-outlined">fact_check</span></div>
            <div><h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Historial de Dietas</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Control ZBS Forcall</p></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Itinerario</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Paciente</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-right">Km comp.</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-right">Registrado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registry.length > 0 ? (
                registry.map((entry) => (
                  <tr key={entry.date + entry.timestamp} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-gray-800">{formatDateDisplay(entry.date)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700">Forcall</span>
                        <span className="material-symbols-outlined text-gray-300 text-sm">arrow_forward</span>
                        <span className="text-xs font-black text-gray-800">{entry.townName}</span>
                        <span className="material-symbols-outlined text-gray-300 text-sm">arrow_forward</span>
                        <span className="text-xs font-bold text-emerald-700">Forcall</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-600">{entry.patient || '—'}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-black text-emerald-700">{entry.computableKm.toFixed(1)} km</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">{entry.savedBy}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">Sin registros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
