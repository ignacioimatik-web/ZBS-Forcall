
import React, { useState, useEffect } from 'react';
import { useT } from '../lib/i18n';

interface WeatherPoint {
  id: string;
  town: string;
  lat: number;
  lng: number;
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Snow' | 'Wind' | 'Fog';
  humidity: number;
  windSpeed: number;
  gusts?: number;
  alertLevel?: 'Verde' | 'Amarillo' | 'Naranja' | 'Rojo';
  alertDesc?: string;
}

interface ForecastDay {
  date: Date;
  min: number;
  max: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Snow';
}

export const WeatherView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { t } = useT();
  
  // Datos rigurosos al estilo AEMET (Agencia Estatal de Meteorología)
  const [currentWeather] = useState<WeatherPoint[]>([
    { id: '1', town: 'Forcall', lat: 40.6433, lng: -0.2300, temp: 12.4, condition: 'Sunny', humidity: 40, windSpeed: 10, alertLevel: 'Verde' },
    { id: '2', town: 'Morella', lat: 40.6186, lng: -0.1017, temp: 8.2, condition: 'Wind', humidity: 35, windSpeed: 40, gusts: 65, alertLevel: 'Verde' },
    { id: '3', town: 'Cinctorres', lat: 40.5833, lng: -0.2300, temp: 10.1, condition: 'Cloudy', humidity: 50, windSpeed: 15, alertLevel: 'Verde' },
    { id: '4', town: 'Portell de Morella', lat: 40.5333, lng: -0.2633, temp: 7.5, condition: 'Fog', humidity: 85, windSpeed: 5, alertLevel: 'Verde' },
    { id: '5', town: 'Villores', lat: 40.6700, lng: -0.2000, temp: 13.0, condition: 'Sunny', humidity: 38, windSpeed: 12, alertLevel: 'Verde' }
  ]);

  const forecast: ForecastDay[] = [
    { date: new Date(new Date().setDate(new Date().getDate() + 1)), min: 4, max: 14, condition: 'Sunny' },
    { date: new Date(new Date().setDate(new Date().getDate() + 2)), min: 2, max: 11, condition: 'Cloudy' },
    { date: new Date(new Date().setDate(new Date().getDate() + 3)), min: -1, max: 8, condition: 'Snow' }
  ];

  const protocols = [
    {
      id: 'hypothermia',
      title: t('weather.protocolHypothermiaTitle'),
      icon: 'medical_services',
      color: 'text-blue-600',
      content: t('weather.protocolHypothermiaContent')
    },
    {
      id: 'wind',
      title: t('weather.protocolWindTitle'),
      icon: 'air',
      color: 'text-teal-600',
      content: t('weather.protocolWindContent')
    },
    {
      id: 'logistics',
      title: t('weather.protocolLogisticsTitle'),
      icon: 'ac_unit',
      color: 'text-indigo-600',
      content: t('weather.protocolLogisticsContent')
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getIconData = (condition: string) => {
    switch (condition) {
      case 'Sunny': return { icon: 'sunny', color: 'text-amber-500', bg: 'bg-amber-100' };
      case 'Cloudy': return { icon: 'cloud', color: 'text-gray-500', bg: 'bg-gray-100' };
      case 'Rain': return { icon: 'rainy', color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'Snow': return { icon: 'ac_unit', color: 'text-cyan-500', bg: 'bg-cyan-50' };
      case 'Wind': return { icon: 'air', color: 'text-teal-600', bg: 'bg-teal-100' };
      case 'Fog': return { icon: 'foggy', color: 'text-slate-400', bg: 'bg-slate-100' };
      default: return { icon: 'thermostat', color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  const getRoadSafetyConfig = () => {
    const level = 'Normal' as 'Normal' | 'Amarilla' | 'Naranja' | 'Roja';
    switch (level) {
      case 'Amarilla':
        return { 
          bg: 'bg-yellow-400', 
          text: 'text-yellow-950', 
          icon: 'warning', 
          labelKey: 'weather.roadLevelYellow',
          msgKey: 'weather.roadMsgAmarilla'
        };
      case 'Naranja':
        return { 
          bg: 'bg-orange-500', 
          text: 'text-white', 
          icon: 'ac_unit', 
          labelKey: 'weather.roadLevelOrange',
          msgKey: 'weather.roadMsgNaranja'
        };
      case 'Roja':
        return { 
          bg: 'bg-red-600', 
          text: 'text-white', 
          icon: 'dangerous', 
          labelKey: 'weather.roadLevelRed',
          msgKey: 'weather.roadMsgRoja'
        };
      default:
        return { 
          bg: 'bg-emerald-600', 
          text: 'text-white', 
          icon: 'check_circle', 
          labelKey: 'weather.roadLevelGreen',
          msgKey: 'weather.roadMsgDefault'
        };
    }
  };

  const roadConfig = getRoadSafetyConfig();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-forcall-600 text-4xl">progress_activity</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header AEMET */}
      <div className="bg-gradient-to-r from-blue-800 to-sky-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">cloud_sync</span>
              {t('weather.observatory')}
            </h2>
            <p className="opacity-90 mt-1 text-sm">{t('weather.disclaimer')}</p>
          </div>
          <div className="flex items-center gap-3">
             <a href="https://www.aemet.es" target="_blank" rel="noopener noreferrer" className="bg-white p-1 rounded-full border border-white/20">
                <img src="https://www.aemet.es/favicon.ico" alt="AEMET" className="w-6 h-6" />
             </a>
          </div>
        </div>
      </div>

      {/* Alerta de Vialidad */}
      <div className={`${roadConfig.bg} ${roadConfig.text} p-5 rounded-2xl shadow-md border border-white/10 flex flex-col md:flex-row items-center gap-4 transition-all`}>
        <div className="bg-white/20 p-3 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl">{roadConfig.icon}</span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-bold uppercase tracking-wide">{t('weather.roadStatus')}: {t(roadConfig.labelKey)}</h3>
          <p className="text-sm opacity-90 font-medium leading-relaxed">{t(roadConfig.msgKey)}</p>
        </div>
        <a 
          href="https://etraffic.dgt.es/etrafficWEB/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full md:w-auto px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-bold text-xs uppercase tracking-widest border border-white/20 flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          {t('weather.roadStatus')}
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <h3 className="font-bold text-gray-700 flex items-center gap-2 px-2">
             <span className="material-symbols-outlined text-amber-500">thermometer</span>
             {t('weather.realTimeStations')}
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {currentWeather.map((p) => {
               const style = getIconData(p.condition);
               return (
                 <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className={`p-4 rounded-full ${style.bg} ${style.color}`}>
                       <span className="material-symbols-outlined text-3xl">{style.icon}</span>
                    </div>
                    <div className="flex-1">
                       <h4 className="font-bold text-gray-800 text-lg">{p.town}</h4>
                       <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                         <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">humidity_percentage</span> {p.humidity}%</span>
                         <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">air</span> {p.windSpeed}km/h</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="text-3xl font-black text-gray-900">{p.temp.toFixed(1)}°</span>
                    </div>
                 </div>
               );
             })}
           </div>

            {/* Información Adicional de AEMET */}
            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-center gap-4">
               <span className="material-symbols-outlined text-blue-600 text-4xl">info</span>
               <div>
                 <h4 className="font-bold text-blue-900">{t('weather.infoNote')}</h4>
                 <p className="text-sm text-blue-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('weather.infoNoteText') }} />
               </div>
            </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-600">policy</span>
              {t('weather.actionProtocols')}
            </h3>
            <div className="space-y-3">
              {protocols.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined ${p.color}`}>{p.icon}</span>
                    <span className="font-bold text-sm text-gray-800">{p.title}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{p.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100">
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-sky-800 uppercase tracking-widest">{t('weather.forecast3Days')}</h4>
                <span className="text-[10px] text-sky-600 font-bold bg-white px-1.5 py-0.5 rounded border border-sky-200">{t('weather.aemetData')}</span>
             </div>
             <div className="space-y-4">
                {forecast.map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-white/50 p-2 rounded-lg">
                    <span className="text-gray-700 font-bold w-12">{f.date.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-sky-500">{getIconData(f.condition).icon}</span>
                    </div>
                    <span className="font-bold text-gray-900">{f.max}° <span className="text-gray-400 font-normal mx-1">/</span> <span className="text-sky-600">{f.min}°</span></span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
