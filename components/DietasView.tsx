import React, { useState, useEffect, useCallback } from 'react';

interface Town {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Visit {
  id: string;
  townId: string;
  patient: string;
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
  visits: Visit[];
  startTownId: string;
  endTownId: string;
}

const TOWNS: Town[] = [
  { id: 'forcall', name: 'Forcall', lat: 40.646, lng: -0.200 },
  { id: 'cinctorres', name: 'Cinctorres', lat: 40.583, lng: -0.217 },
  { id: 'villores', name: 'Villores', lat: 40.667, lng: -0.200 },
  { id: 'portell', name: 'Portell de Morella', lat: 40.533, lng: -0.263 },
  { id: 'la_mata', name: 'La Mata de Morella', lat: 40.617, lng: -0.283 },
  { id: 'todolella', name: 'Todolella', lat: 40.650, lng: -0.246 },
  { id: 'olocau', name: 'Olocau del Rey', lat: 40.633, lng: -0.350 },
  { id: 'zorita', name: 'Zorita del Maestrazgo', lat: 40.728, lng: -0.167 },
  { id: 'palanques', name: 'Palanques', lat: 40.633, lng: -0.183 },
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

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
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

export const DietasView: React.FC = () => {
  const [date, setDate] = useState(todayStr());
  const [startTownId, setStartTownId] = useState('forcall');
  const [endTownId, setEndTownId] = useState('forcall');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [newTownId, setNewTownId] = useState(TOWNS[1]?.id || '');
  const [newPatient, setNewPatient] = useState('');
  const [legs, setLegs] = useState<RouteLeg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDates, setSavedDates] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setSavedDates(loadSavedDates());
    const data = loadDayData(date);
    if (data) {
      setStartTownId(data.startTownId);
      setEndTownId(data.endTownId);
      setVisits(data.visits);
      setLegs([]);
    } else {
      setStartTownId('forcall');
      setEndTownId('forcall');
      setVisits([]);
      setLegs([]);
    }
  }, [date]);

  const addVisit = () => {
    if (!newTownId) return;
    setVisits(prev => [...prev, { id: generateId(), townId: newTownId, patient: newPatient }]);
    setNewPatient('');
    setLegs([]);
  };

  const removeVisit = (id: string) => {
    setVisits(prev => prev.filter(v => v.id !== id));
    setLegs([]);
  };

  const toggleComputable = (index: number) => {
    setLegs(prev => prev.map((leg, i) => i === index ? { ...leg, computable: !leg.computable } : leg));
  };

  const calculateRoute = useCallback(async () => {
    if (visits.length === 0) {
      setError('Añade al menos una visita antes de calcular.');
      return;
    }

    setLoading(true);
    setError(null);

    const startTown = getTown(startTownId);
    const endTown = getTown(endTownId);
    if (!startTown || !endTown) { setError('Configura inicio y fin de jornada.'); setLoading(false); return; }

    const points: { id: string; name: string; lat: number; lng: number }[] = [
      { id: startTownId, name: startTown.name, ...startTown },
      ...visits.map(v => {
        const t = getTown(v.townId);
        return t ? { id: v.townId, name: t.name, ...t } : null;
      }).filter(Boolean) as { id: string; name: string; lat: number; lng: number }[],
      { id: endTownId, name: endTown.name, ...endTown },
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
        computable: i < points.length - 2,
      }));

      setLegs(routeLegs);
    } catch {
      const routeLegs: RouteLeg[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        const d = haversineKm(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
        routeLegs.push({
          fromId: points[i].id,
          toId: points[i + 1].id,
          fromName: points[i].name,
          toName: points[i + 1].name,
          distanceKm: Math.round(d * 1.3 * 10) / 10,
          computable: i < points.length - 2,
        });
      }
      setLegs(routeLegs);
      setError('No se pudo calcular la ruta real. Distancias estimadas (línea recta × 1.3).');
    } finally {
      setLoading(false);
    }
  }, [startTownId, endTownId, visits]);

  const saveSession = () => {
    saveDayData(date, { startTownId, endTownId, visits });
    setSavedDates(loadSavedDates());
  };

  const deleteSession = () => {
    deleteDayData(date);
    setStartTownId('forcall');
    setEndTownId('forcall');
    setVisits([]);
    setLegs([]);
    setSavedDates(loadSavedDates());
  };

  const totalComputable = legs.filter(l => l.computable).reduce((sum, l) => sum + l.distanceKm, 0);
  const totalKm = legs.reduce((sum, l) => sum + l.distanceKm, 0);

  const navigateDate = (offset: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setDate(todayStr());
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-lg">flag</span>
                Inicio jornada
              </p>
              <select
                value={startTownId}
                onChange={e => { setStartTownId(e.target.value); setLegs([]); }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {TOWNS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-lg">flag</span>
                Fin jornada
              </p>
              <select
                value={endTownId}
                onChange={e => { setEndTownId(e.target.value); setLegs([]); }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {TOWNS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-stone-50 border-b border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Itinerario</p>
              <h3 className="text-lg font-black text-gray-900 mt-1">Visitas a domicilio</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={newTownId}
                  onChange={e => setNewTownId(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {TOWNS.filter(t => !visits.some(v => v.townId === t.id)).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                  {TOWNS.filter(t => visits.some(v => v.townId === t.id)).map(t => (
                    <option key={t.id} value={t.id} disabled>{t.name} (ya añadido)</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newPatient}
                  onChange={e => setNewPatient(e.target.value)}
                  placeholder="Paciente (opcional)"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-gray-300"
                />
                <button
                  onClick={addVisit}
                  disabled={!newTownId}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Añadir
                </button>
              </div>

              {visits.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">pin_drop</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">Añade las visitas del día</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visits.map((v, i) => {
                    const town = getTown(v.townId);
                    return (
                      <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                        <span className="material-symbols-outlined text-gray-400 text-lg">location_on</span>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-800">{town?.name || v.townId}</p>
                          {v.patient && <p className="text-[10px] font-bold text-gray-500">{v.patient}</p>}
                        </div>
                        <button onClick={() => removeVisit(v.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-all text-gray-300 hover:text-red-500">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={calculateRoute}
            disabled={visits.length === 0 || loading}
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
    </div>
  );
};
