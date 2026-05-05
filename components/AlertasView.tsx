
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface GroundingSource {
  title?: string;
  uri?: string;
}

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

export const AlertasView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string>('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Weather States
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [currentWeather] = useState<WeatherPoint[]>([
    { id: '1', town: 'Forcall', lat: 40.6433, lng: -0.2300, temp: 12.4, condition: 'Sunny', humidity: 40, windSpeed: 10, alertLevel: 'Verde' },
    { id: '2', town: 'Morella', lat: 40.6186, lng: -0.1017, temp: 8.2, condition: 'Wind', humidity: 35, windSpeed: 40, alertLevel: 'Verde' },
    { id: '3', town: 'Cinctorres', lat: 40.5833, lng: -0.2300, temp: 10.1, condition: 'Cloudy', humidity: 50, windSpeed: 15, alertLevel: 'Verde' },
    { id: '4', town: 'Portell de Morella', lat: 40.5333, lng: -0.2633, temp: 7.5, condition: 'Fog', humidity: 85, windSpeed: 5, alertLevel: 'Verde' },
    { id: '5', town: 'Villores', lat: 40.6700, lng: -0.2000, temp: 13.0, condition: 'Sunny', humidity: 38, windSpeed: 12, alertLevel: 'Verde' }
  ]);

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
        { name: "Ayto. Cinctorres", phone: "964 18 10 19" },
        { name: "Ayto. Villores", phone: "964 17 11 12" },
        { name: "Ayto. Castellfort", phone: "964 44 59 01" },
        { name: "Ayto. Portell de Morella", phone: "964 17 80 00" },
        { name: "Ayto. La Mata de Morella", phone: "964 17 10 66" },
        { name: "Ayto. Todolella", phone: "964 17 11 02" },
        { name: "Ayto. Olocau del Rey", phone: "964 17 82 03" },
        { name: "Ayto. Zorita del Maestrazgo", phone: "964 17 11 08" },
        { name: "Ayto. Herbers", phone: "964 17 31 16" },
        { name: "Ayto. Palanques", phone: "964 17 31 20" },
        { name: "Ayto. Vallibona", phone: "964 17 04 22" }
      ]
    }
  ]);

  const forecast: ForecastDay[] = [
    { date: new Date(new Date().setDate(new Date().getDate() + 1)), min: 4, max: 14, condition: 'Sunny' },
    { date: new Date(new Date().setDate(new Date().getDate() + 2)), min: 2, max: 11, condition: 'Cloudy' },
    { date: new Date(new Date().setDate(new Date().getDate() + 3)), min: -1, max: 8, condition: 'Snow' }
  ];

  const protocols = [
    { id: 'wind', title: 'Aviso Viento', icon: 'air', color: 'text-teal-600', content: 'Precaución en N-232 y CV-125.' },
  ];

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    const timer = setTimeout(() => setWeatherLoading(false), 500);
    fetchAlerts();
    return () => clearTimeout(timer);
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: "Resumen de alertas sanitarias, vialidad (Puertos Querol y Torremiró) y avisos 112 en la comarca de Els Ports (Castellón) para hoy.",
        config: { tools: [{ googleSearch: {} }] },
      });

      setData(response.text || "No hay alertas críticas reportadas.");
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources = chunks.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
      setSources(Array.from(new Map(extractedSources.map((item: any) => [item.uri, item])).values()));
    } catch (err) {
      setError("Error al sincronizar alertas.");
    } finally {
      setLoading(false);
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
      case 'Snow': return { icon: 'ac_unit', color: 'text-cyan-500', bg: 'bg-cyan-50' };
      case 'Wind': return { icon: 'air', color: 'text-teal-600', bg: 'bg-teal-100' };
      default: return { icon: 'thermostat', color: 'text-gray-400', bg: 'bg-gray-100' };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* SECTION: ALERTS & SEARCH */}
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-orange-700 rounded-3xl p-6 text-white shadow-lg flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl">campaign</span>
              Alertas y Estado de la Zona
            </h2>
            <p className="opacity-90 mt-1 text-sm font-medium">Información en tiempo real: Sanidad y Protección Civil Els Ports.</p>
          </div>
          <button onClick={fetchAlerts} disabled={loading} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black transition-all border border-white/20 flex items-center gap-2">
            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            ACTUALIZAR
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 border-4 border-forcall-100 border-t-red-600 rounded-full animate-spin mb-4"></div>
                <h3 className="text-gray-800 font-bold">Consultando fuentes oficiales...</h3>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed font-medium">
                  {data.split('\n').map((l, i) => <p key={i} className="mb-2">{l}</p>)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* AVISOS OPERATIVOS (MOVING HERE) */}
            <div className="space-y-2">
              {protocols.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-3xl border-l-4 border-l-sky-500 shadow-sm border border-gray-200">
                   <h4 className="text-[10px] font-black text-gray-800 uppercase mb-1 tracking-widest flex items-center gap-2">
                     <span className="material-symbols-outlined text-sky-500 text-sm">{p.icon}</span>
                     {p.title}
                   </h4>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{p.content}</p>
                </div>
              ))}
            </div>

            {/* DIRECTORIO DE URGENCIAS */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="p-4 bg-gray-50 border-b border-gray-100">
                 <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
                   <span className="material-symbols-outlined text-red-600">emergency</span> Urgencias
                 </h3>
               </div>
               <div className="p-1 space-y-0.5 max-h-[500px] overflow-y-auto no-scrollbar">
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
            
            <button onClick={() => setIsSourcesOpen(!isSourcesOpen)} className="w-full bg-white rounded-3xl p-4 border border-gray-200 shadow-sm flex justify-between items-center">
               <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Fuentes ({sources.length})</span>
               <span className={`material-symbols-outlined transition-transform ${isSourcesOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {isSourcesOpen && (
              <div className="space-y-2 animate-slide-in-up">
                {sources.map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" className="block p-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-bold text-forcall-700 truncate hover:bg-forcall-50">
                    {s.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: WEATHER */}
      <div className="space-y-6">
        {/* Alerta de Vialidad (Weather) */}
        <div className="bg-emerald-600 text-white p-5 rounded-3xl shadow-md border border-white/10 flex flex-col md:flex-row items-center gap-4">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
          <div className="flex-1">
            <h3 className="font-black uppercase text-sm tracking-widest">Estado Carreteras: Nivel Verde</h3>
            <p className="text-sm opacity-90 font-medium">Condiciones favorables para la actividad asistencial.</p>
          </div>
          <a href="https://etraffic.dgt.es" target="_blank" className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-white/20">CONSULTAR DGT</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {currentWeather.map(p => {
                 const s = getIconStyle(p.condition);
                 return (
                   <div key={p.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
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
            <div className="bg-sky-50 rounded-3xl p-6 border border-sky-100">
               <h3 className="text-[10px] font-black text-sky-800 uppercase tracking-widest mb-4">Previsión 3 Días</h3>
               <div className="space-y-3">
                 {forecast.map((f, i) => (
                   <div key={i} className="flex justify-between items-center bg-white/50 p-2 rounded-xl text-xs font-bold">
                     <span className="w-8 uppercase">{f.date.toLocaleDateString('es', {weekday: 'short'})}</span>
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
