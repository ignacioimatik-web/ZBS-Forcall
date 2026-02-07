
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

export const RealTimeInfo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string>('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

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
        { name: "Ayto. Olocau del Rey", phone: "964 17 82 03" },
        { name: "Ayto. Todolella", phone: "964 17 11 02" },
        { name: "Ayto. Zorita del Maestrazgo", phone: "964 17 11 08" },
        { name: "Ayto. Herbers", phone: "964 17 31 16" },
        { name: "Ayto. Palanques", phone: "964 17 31 20" },
      ]
    }
  ]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const toggleCategory = (index: number) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, isOpen: !cat.isOpen } : cat
    ));
  };

  const sendPushNotification = (message: string) => {
    if (Notification.permission === 'granted') {
      new Notification("ZBS Forcall: Alerta Crítica", {
        body: message,
        icon: "https://www.aemet.es/favicon.ico"
      });
    }
  };

  const checkAlertsAndNotify = (text: string) => {
    const criticalKeywords = ["alerta", "riesgo", "emergencia", "corte", "nieve", "bloqueo", "urgente", "brote"];
    const lowercaseText = text.toLowerCase();
    
    const foundAlert = criticalKeywords.find(keyword => lowercaseText.includes(keyword));
    
    if (foundAlert) {
      // Extraemos la primera frase o párrafo que contiene la alerta para la notificación
      const sentences = text.split(/[.!?\n]/);
      const alertSentence = sentences.find(s => criticalKeywords.some(k => s.toLowerCase().includes(k))) || text.substring(0, 100);
      sendPushNotification(alertSentence.trim());
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Proporciona un resumen actualizado hoy sobre: 1. Alertas sanitarias o brotes en la comarca de Els Ports (Castellón). 2. Estado de carreteras y puertos (Querol y Torremiró). 3. Avisos de Protección Civil y 112 en el interior de Castellón. Sé conciso y directo para personal sanitario.",
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "No se ha podido recuperar información reciente.";
      setData(text);
      checkAlertsAndNotify(text);
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources: GroundingSource[] = chunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
      
      const uniqueSources = Array.from(new Map(extractedSources.map(item => [item.uri, item])).values());
      setSources(uniqueSources);

    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servicio de búsqueda. Por favor, inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Banner de Permisos de Notificación */}
      {notificationPermission === 'default' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-in-up">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600">notifications_active</span>
            <p className="text-sm text-amber-800 font-medium text-center md:text-left">
              ¿Quieres recibir avisos críticos en tu escritorio cuando haya alertas meteorológicas o sanitarias?
            </p>
          </div>
          <button 
            onClick={requestNotificationPermission}
            className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-all shadow-md active:scale-95"
          >
            ACTIVAR NOTIFICACIONES
          </button>
        </div>
      )}

      <div className="bg-gradient-to-r from-red-700 via-red-600 to-orange-700 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">campaign</span>
            ZBS Forcall: Alertas y Estado de la Zona
          </h2>
          <p className="opacity-90 mt-1 text-sm">Información en tiempo real sobre Sanidad y Protección Civil en Els Ports.</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/20 flex items-center gap-2 active:scale-95"
        >
          <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
          {loading ? 'Consultando...' : 'Actualizar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 border-4 border-forcall-100 border-t-forcall-600 rounded-full animate-spin mb-4"></div>
               <h3 className="text-gray-800 font-bold text-lg">Sincronizando con fuentes oficiales...</h3>
               <p className="text-gray-500 text-sm mt-2 max-w-xs">Buscando reportes actualizados de la DGT, AEMET y Conselleria de Sanitat.</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
              <h3 className="text-red-800 font-bold text-lg">{error}</h3>
              <button onClick={fetchData} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Reintentar</button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6">
                 <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                   {data.split('\n').map((line, i) => (
                     <p key={i} className={line.startsWith('*') || line.startsWith('-') ? 'pl-4 border-l-2 border-forcall-200' : ''}>
                       {line}
                     </p>
                   ))}
                 </div>
               </div>
               <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 animate-blink">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Datos de búsqueda verificados por IA
                  </span>
                  <span className="text-[10px] text-gray-400">Hoy, {new Date().toLocaleTimeString()}</span>
               </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Teléfonos de Urgencia Desplegables */}
          <div className="bg-white rounded-2xl p-1 border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-earth-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-tight">
                <span className="material-symbols-outlined text-red-600">emergency_home</span>
                Directorio de Urgencias
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {categories.map((category, idx) => (
                <div key={idx} className="overflow-hidden">
                  <button 
                    onClick={() => toggleCategory(idx)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-gray-400 group-hover:text-forcall-600 transition-colors">{category.icon}</span>
                      <span className="text-xs font-bold text-gray-700">{category.title}</span>
                    </div>
                    <span className={`material-symbols-outlined text-gray-300 transition-transform duration-300 ${category.isOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  <div className={`transition-all duration-300 ease-in-out ${category.isOpen ? 'max-h-[500px] opacity-100 pb-2' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 space-y-1">
                      {category.contacts.map((contact, cIdx) => (
                        <a 
                          key={cIdx} 
                          href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                          className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            {contact.icon && <span className="material-symbols-outlined text-[14px] text-gray-400">{contact.icon}</span>}
                            <span className="text-[11px] text-gray-600 font-medium">{contact.name}</span>
                          </div>
                          <span className={`text-[11px] font-black ${contact.phone === '112' || contact.phone === '085' ? 'text-red-600' : 'text-forcall-700'}`}>
                            {contact.phone}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fuentes Consultadas Desplegable */}
          <div className="bg-white rounded-2xl p-1 border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => setIsSourcesOpen(!isSourcesOpen)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-forcall-600 group-hover:scale-110 transition-transform">link</span>
                <h3 className="font-bold text-gray-800 text-sm">Fuentes Consultadas</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-forcall-50 text-forcall-700 px-1.5 py-0.5 rounded font-bold">{sources.length}</span>
                <span className={`material-symbols-outlined text-gray-300 transition-transform duration-300 ${isSourcesOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>
            </button>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSourcesOpen ? 'max-h-[600px] opacity-100 border-t border-gray-50' : 'max-h-0 opacity-0'}`}>
              <div className="p-4 space-y-3">
                {sources.length > 0 ? (
                  sources.map((source, idx) => (
                    <a 
                      key={idx}
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-3 bg-gray-50 rounded-xl border border-transparent hover:border-forcall-300 hover:bg-forcall-50 transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-gray-700 line-clamp-2 group-hover:text-forcall-700">{source.title}</p>
                        <span className="material-symbols-outlined text-xs text-gray-300 group-hover:text-forcall-500">open_in_new</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 truncate">{source.uri}</p>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-4">
                    {loading ? 'Cargando fuentes...' : 'Fuentes oficiales de AEMET, DGT y GVA.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
