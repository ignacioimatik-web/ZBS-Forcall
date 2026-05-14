import React, { useEffect, useState } from 'react';
import { useT } from '../lib/i18n';

interface PhoneCategory {
  title: string;
  icon: string;
  isOpen: boolean;
  contacts: { name: string; phone: string; icon?: string }[];
}

interface WeatherPoint {
  id: string;
  town: string;
  lat: number;
  lng: number;
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Snow' | 'Wind' | 'Fog';
  humidity: number;
  windSpeed: number;
  alertLevel?: 'Verde' | 'Amarillo' | 'Naranja' | 'Rojo';
}

interface ForecastDay {
  date: Date;
  min: number;
  max: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Snow';
}

const TOWNS = [
  { id: 'forcall', town: 'Forcall', lat: 40.646, lng: -0.200 },
  { id: 'morella', town: 'Morella', lat: 40.620, lng: -0.100 },
  { id: 'cinctorres', town: 'Cinctorres', lat: 40.583, lng: -0.217 },
  { id: 'portell', town: 'Portell de Morella', lat: 40.533, lng: -0.263 },
  { id: 'villores', town: 'Villores', lat: 40.667, lng: -0.200 },
  { id: 'la_mata', town: 'La Mata de Morella', lat: 40.617, lng: -0.283 },
  { id: 'olocau', town: 'Olocau del Rey', lat: 40.633, lng: -0.350 },
];

function wmoToCondition(code: number): WeatherPoint['condition'] {
  if (code === 0) return 'Sunny';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain';
  return 'Rain';
}

function wmoToForecastCondition(code: number): ForecastDay['condition'] {
  if (code === 0) return 'Sunny';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Cloudy';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  return 'Rain';
}

interface VostPost {
  title: string;
  content: string;
  pubDate: string;
  link: string;
}

interface CivilProtectionBrief {
  title: string;
  summary: string;
  url: string;
}

interface CivilProtectionMap {
  id: string;
  label: string;
  imageUrl: string;
  sourceUrl: string;
}

interface CivilProtectionUpdate {
  headline: string;
  summary: string;
  level: 'Verde' | 'Amarillo' | 'Naranja' | 'Rojo';
  territory: string;
  fetchedAt: string;
  sourceUrl: string;
  briefs: CivilProtectionBrief[];
  maps: CivilProtectionMap[];
}

const fallbackCivilProtection: CivilProtectionUpdate = {
  headline: 'Protección Civil Els Ports',
  summary:
    'Consulta el mapa oficial de 112 Comunitat Valenciana para revisar en tiempo real las alertas activas, las preemergencias y las emergencias meteorológicas aplicables a Els Ports y al interior norte de Castellón.',
  level: 'Verde',
  territory: 'Els Ports / interior norte de Castellón',
  fetchedAt: 'Consulta manual requerida',
  sourceUrl: 'https://www.112cv.gva.es/es/preemergencias-meteorologicas',
  briefs: [],
  maps: [
    {
      id: 'alertas',
      label: 'Alertas población',
      imageUrl: 'https://www.112cv.gva.es/WebPublica-MapasOnLineV2/send/getMapaGeoserver?mapa=alertas',
      sourceUrl: 'https://www.112cv.gva.es/es/alertas-poblacion',
    },
    {
      id: 'preemergencias',
      label: 'Preemergencias',
      imageUrl: 'https://www.112cv.gva.es/WebPublica-MapasOnLineV2/send/getMapaGeoserver?mapa=preemergencias',
      sourceUrl: 'https://www.112cv.gva.es/es/preemergencias-meteorologicas',
    },
    {
      id: 'emergencias',
      label: 'Emergencias',
      imageUrl: 'https://www.112cv.gva.es/WebPublica-MapasOnLineV2/send/getMapaGeoserver?mapa=emergencias',
      sourceUrl: 'https://www.112cv.gva.es/es/emergencias-meteorologicas',
    },
  ],
};

export const AlertasView: React.FC = () => {
  const { t } = useT();
  const [civilProtectionLoading, setCivilProtectionLoading] = useState(false);
  const [civilProtectionError, setCivilProtectionError] = useState<string | null>(null);
  const [civilProtectionUpdate, setCivilProtectionUpdate] = useState<CivilProtectionUpdate | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherPoint[]>([]);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);

  const [vostPosts, setVostPosts] = useState<VostPost[]>([]);
  const [vostLoading, setVostLoading] = useState(true);

  const [categories, setCategories] = useState<PhoneCategory[]>([
    {
      title: "Emergencias y Sanitarios",
      icon: "medical_services",
      isOpen: true,
      contacts: [
        { name: "Emergencias GVA", phone: "112", icon: "emergency" },
        { name: "Cruz Roja Morella", phone: "964 16 02 02", icon: "add_circle" },
      ]
    },
    {
      title: "Seguridad y Rescate",
      icon: "policy",
      isOpen: false,
      contacts: [
        { name: "Guardia Civil Morella", phone: "964 16 00 13", icon: "shield" },
        { name: "Bomberos Morella", phone: "964 16 01 01", icon: "fire_truck" },
        { name: "Protección Civil Els Ports", phone: "964 12 34 56", icon: "support" },
      ]
    },
    {
      title: "Ayuntamientos Els Ports",
      icon: "account_balance",
      isOpen: false,
      contacts: [
        { name: "Ayto. Forcall", phone: "964 17 10 01" },
        { name: "Ayto. Morella", phone: "964 16 00 34" },
        { name: "Ayto. Cinctorres", phone: "964 18 10 01" },
        { name: "Ayto. Villores", phone: "964 17 10 85" },
        { name: "Ayto. Castellfort", phone: "964 44 57 81" },
        { name: "Ayto. Portell de Morella", phone: "964 17 87 79" },
        { name: "Ayto. La Mata de Morella", phone: "964 18 00 01" },
        { name: "Ayto. Todolella", phone: "964 17 11 78" },
        { name: "Ayto. Olocau del Rey", phone: "964 17 84 17" },
        { name: "Ayto. Zorita del Maestrazgo", phone: "964 17 70 70" },
        { name: "Ayto. Herbers", phone: "978 85 66 02" },
        { name: "Ayto. Palanques", phone: "964 17 13 06" },
        { name: "Ayto. Vallibona", phone: "964 17 20 20" }
      ]
    }
  ]);

  const protocols = [
    { id: 'wind', title: 'Aviso Viento', icon: 'air', content: 'Precaución en N-232 y CV-125.' },
  ];

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    fetchWeather();
    fetchCivilProtectionStatus();
    fetchVostPosts();
  }, []);

  const fetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const results = await Promise.all(TOWNS.map(async (t) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${t.lat}&longitude=${t.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=5&timezone=Europe/Madrid`;
        const res = await fetch(url);
        const data = await res.json();
        const c = data.current;
        return { town: t, current: c, daily: data.daily };
      }));

      const points: WeatherPoint[] = results.map(r => ({
        id: r.town.id,
        town: r.town.town,
        lat: r.town.lat,
        lng: r.town.lng,
        temp: r.current.temperature_2m,
        condition: wmoToCondition(r.current.weather_code),
        humidity: r.current.relative_humidity_2m,
        windSpeed: r.current.wind_speed_10m,
      }));
      setCurrentWeather(points);

      if (results.length > 0) {
        const first = results[0];
        const days: ForecastDay[] = first.daily.time.map((dateStr: string, i: number) => ({
          date: new Date(dateStr),
          min: first.daily.temperature_2m_min[i],
          max: first.daily.temperature_2m_max[i],
          condition: wmoToForecastCondition(first.daily.weather_code[i]),
        }));
        setForecast(days);
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
      setWeatherError('No se ha podido obtener los datos meteorológicos.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchVostPosts = async () => {
    setVostLoading(true);
    try {
      const res = await fetch(`/api/vost-rss?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`VOST respondió ${res.status}`);
      const data = await res.json();
      setVostPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching VOST posts:', err);
    } finally {
      setVostLoading(false);
    }
  };

  const fetchCivilProtectionStatus = async () => {
    setCivilProtectionLoading(true);
    setCivilProtectionError(null);

    try {
      const response = await fetch(`/api/protection-civil?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const parsed = await response.json();
      setCivilProtectionUpdate(parsed);
    } catch {
      setCivilProtectionError('No se ha podido actualizar la información oficial de Protección Civil.');
      setCivilProtectionUpdate(fallbackCivilProtection);
    } finally {
      setCivilProtectionLoading(false);
    }
  };

  const toggleCategory = (index: number) => {
    setCategories(prev => prev.map((cat, i) =>
      i === index ? { ...cat, isOpen: !cat.isOpen } : cat
    ));
  };

  const getIconStyle = (condition: string) => {
    switch (condition) {
      case 'Sunny': return { icon: 'sunny', color: 'text-amber-500', bg: 'bg-amber-100' };
      case 'Cloudy': return { icon: 'cloud', color: 'text-gray-500', bg: 'bg-gray-100' };
      case 'Rain': return { icon: 'rainy', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'Snow': return { icon: 'ac_unit', color: 'text-cyan-500', bg: 'bg-cyan-50' };
      case 'Fog': return { icon: 'foggy', color: 'text-gray-400', bg: 'bg-gray-200' };
      case 'Wind': return { icon: 'air', color: 'text-teal-600', bg: 'bg-teal-100' };
      default: return { icon: 'thermostat', color: 'text-gray-400', bg: 'bg-gray-100' };
    }
  };

  const getLevelClasses = (level: CivilProtectionUpdate['level']) => {
    switch (level) {
      case 'Rojo':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Naranja':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Amarillo':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-forcall-600">campaign</span>
            {t('alertas.alertsAndStatus')}
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">{t('alertas.emergencyEdition')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button onClick={fetchCivilProtectionStatus} disabled={civilProtectionLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-forcall-600 hover:bg-forcall-50 border border-gray-200 bg-white transition-all">
            <span className={`material-symbols-outlined text-lg ${civilProtectionLoading ? 'animate-spin' : ''}`}>refresh</span>
            {t('alertas.civilProtection')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 items-start">
        <section className="2xl:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{t('alertas.cover')}</p>
                <h3 className="text-lg font-black text-gray-900 mt-1">{t('alertas.officialCivilProtection')}</h3>
              </div>
              {civilProtectionUpdate && (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getLevelClasses(civilProtectionUpdate.level)}`}>
                  {civilProtectionUpdate.level}
                </span>
              )}
            </div>

            <div className="p-6 space-y-5">
              {civilProtectionError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-[10px] font-bold text-red-700">
                  {civilProtectionError}
                </div>
              )}

              {civilProtectionUpdate && (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                    <div className="xl:col-span-3 space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{t('alertas.mainHeadline')}</p>
                        <h4 className="text-2xl font-black text-gray-900 leading-tight mt-2">{civilProtectionUpdate.headline}</h4>
                        <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                          <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200">{civilProtectionUpdate.territory}</span>
                          <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200">Actualizado {civilProtectionUpdate.fetchedAt}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {civilProtectionUpdate.briefs.length > 0 ? civilProtectionUpdate.briefs.map((brief, index) => (
                          <a
                            key={`${brief.url}-${index}`}
                            href={brief.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-[1.75rem] border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-all"
                          >
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-2">{t('alertas.pressRelease')} {index + 1}</p>
                            <h5 className="text-sm font-black text-gray-900 leading-snug">{brief.title}</h5>
                            <p className="text-xs text-gray-600 mt-2 leading-relaxed">{brief.summary}</p>
                          </a>
                        )) : (
                          <div className="md:col-span-2 rounded-[1.75rem] border border-gray-200 bg-white p-4 text-xs font-bold text-gray-500">
                            {t('alertas.noBriefs')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="xl:col-span-2 space-y-3">
                      {civilProtectionUpdate.maps.map((map) => (
                        <a
                          key={map.id}
                          href={map.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-[1.75rem] border border-gray-200 overflow-hidden hover:shadow-md transition-all bg-white"
                        >
                          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">{map.label}</p>
                          </div>
                          <img src={map.imageUrl} alt={map.label} className="w-full h-40 object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <a
                      href={civilProtectionUpdate.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-2xl bg-forcall-50 text-forcall-700 border border-forcall-100 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-forcall-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      {t('alertas.officialSource')}
                    </a>
                    <a
                      href="https://www.112cv.gva.es/WebPublica-MapasOnLineV2/portadaCastellano.jsf"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-2xl bg-orange-50 text-orange-700 border border-orange-100 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">map</span>
                      {t('alertas.map112')}
                    </a>
                    <button
                      onClick={fetchCivilProtectionStatus}
                      disabled={civilProtectionLoading}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900 text-white border border-gray-900 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-60"
                    >
                      <span className={`material-symbols-outlined text-sm ${civilProtectionLoading ? 'animate-spin' : ''}`}>refresh</span>
                      {t('alertas.refreshBlock')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="2xl:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{t('alertas.teletype')}</p>
              <h3 className="text-lg font-black text-gray-900 mt-1">{t('alertas.operationalNotes')}</h3>
            </div>
            <div className="p-4 space-y-2">
              {protocols.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl border-l-4 border-l-sky-500 shadow-sm border border-gray-200">
                  <h4 className="text-[10px] font-black text-gray-800 uppercase mb-1 tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-500 text-sm">{p.icon}</span>
                    {p.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{p.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">emergency</span> {t('alertas.emergencies')}
              </h3>
            </div>
            <div className="p-1 space-y-0.5 max-h-[520px] overflow-y-auto no-scrollbar">
              {categories.map((cat, idx) => (
                <div key={idx} className="border-b border-gray-50 last:border-0">
                  <button
                    onClick={() => toggleCategory(idx)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-400 text-lg">{cat.icon}</span>
                      <span className="text-[10px] font-black uppercase text-gray-600 tracking-wider">{cat.title}</span>
                    </div>
                    <span className={`material-symbols-outlined text-gray-300 transition-transform ${cat.isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                  {cat.isOpen && (
                    <div className="px-2 pb-2 space-y-1">
                      {cat.contacts.map((c, i) => (
                        <a key={i} href={`tel:${c.phone}`} className="flex justify-between items-center p-2.5 hover:bg-gray-50 rounded-xl transition-all border border-transparent">
                          <span className="text-[10px] font-bold text-gray-700">{c.name}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${c.phone === '112' ? 'text-red-600 bg-red-50' : 'text-forcall-700 bg-forcall-50'}`}>{c.phone}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{t('alertas.socialNetwork')}</p>
              <h3 className="text-lg font-black text-gray-900 mt-1">@VOSTcvalenciana</h3>
            </div>
            <div className="p-4 space-y-3">
              {vostLoading ? (
                <div className="flex items-center gap-2 py-4 text-gray-400">
                  <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('alertas.loadingPosts')}</span>
                </div>
              ) : vostPosts.length === 0 ? (
                <div className="py-4 text-[10px] font-bold text-gray-500 text-center">
                  {t('alertas.noPosts')}
                </div>
              ) : (
                vostPosts.slice(0, 2).map((post, i) => (
                  <a
                    key={i}
                    href={post.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-gray-200 p-4 hover:bg-gray-50 transition-all"
                  >
                    <p className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>
                    <p className="text-[8px] text-gray-400 mt-2">
                      {new Date(post.pubDate).toLocaleDateString('es', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </a>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col md:flex-row items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
          <div className="flex-1">
            <h3 className="font-black uppercase text-sm tracking-widest text-gray-900">{t('alertas.roadStatus')}</h3>
            <p className="text-sm text-gray-600 font-medium">Condiciones favorables para la actividad asistencial.</p>
          </div>
          <a href="https://etraffic.dgt.es" target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-black transition-all">{t('alertas.consultDGT')}</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('alertas.currentWeather')}</h3>
              <div className="flex gap-2">
                {weatherError && <span className="text-[8px] text-red-500 font-bold self-center">{weatherError}</span>}
                <button onClick={fetchWeather} disabled={weatherLoading} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 text-[9px] font-black uppercase tracking-widest transition-all">
                  <span className={`material-symbols-outlined text-sm ${weatherLoading ? 'animate-spin' : ''}`}>refresh</span>
                  {t('alertas.refresh')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {weatherLoading && currentWeather.length === 0 ? (
                <div className="sm:col-span-2 flex items-center justify-center py-12 text-gray-400">
                  <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('alertas.loadingWeather')}</span>
                </div>
              ) : null}
              {currentWeather.map(p => {
                const s = getIconStyle(p.condition);
                return (
                  <div key={p.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${s.bg} ${s.color}`}>
                      <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-gray-800">{p.town}</h4>
                      <p className="text-[10px] font-bold text-gray-400">{p.windSpeed}km/h • {p.humidity}% hum.</p>
                    </div>
                    <span className="text-2xl font-black text-gray-900">{p.temp.toFixed(1)}°</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-[10px] font-black text-sky-800 uppercase tracking-widest mb-4">{t('alertas.forecast5Days')}</h3>
              <div className="space-y-3">
                {forecast.map((f, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/50 p-2 rounded-xl text-xs font-bold">
                    <span className="w-8 uppercase">{f.date.toLocaleDateString('es', { weekday: 'short' })}</span>
                    <span className="material-symbols-outlined text-sky-500">{getIconStyle(f.condition).icon}</span>
                    <span className="text-gray-900">{f.max}° / <span className="text-sky-600">{f.min}°</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};