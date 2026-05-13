
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { useAvisos } from '../hooks/useAvisos';
import { useT } from '../lib/i18n';

interface AvisosViewProps {
  currentUser: User | null;
}

export const AvisosView: React.FC<AvisosViewProps> = ({ currentUser }) => {
  const { t } = useT();
  const { avisos: messages, addAviso, isLoading } = useAvisos('avisos');
  const [inputText, setInputText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNotification, setShowNotification] = useState<{title: string, msg: string} | null>(null);
  const [permisoEstado, setPermisoEstado] = useState<NotificationPermission>('default');
  const scrollRef = useRef<HTMLDivElement>(null);

  const canSend = currentUser?.role === 'Coordinador' || currentUser?.role === 'Administrador';

  // --- FUNCIONES NATIVAS SOLICITADAS ---
  
  /**
   * Solicita permiso al usuario para mostrar notificaciones.
   * Compatible con Escritorio y Móviles (Safari 16.4+).
   */
  const solicitarPermisos = async () => {
    if (!('Notification' in window)) {
      alert(t('avisos.notSupported'));
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermisoEstado(permission);
      if (permission === 'granted') {
        enviarAvisoGrupo(t('avisos.systemActivated'));
      }
    } catch (error) {
      console.error("Error al solicitar permisos:", error);
    }
  };

  /**
   * Dispara una notificación nativa local.
   * @param mensaje Cuerpo de la notificación.
   */
  const enviarAvisoGrupo = (mensaje: string) => {
    if (Notification.permission === 'granted') {
      const options = {
        body: mensaje,
        icon: 'https://www.aemet.es/favicon.ico', // Icono oficial o representativo
        badge: 'https://www.aemet.es/favicon.ico',
        vibrate: [200, 100, 200],
        tag: 'aviso-urgente-forcall',
        renotify: true
      };
      
      try {
        new Notification(t('avisos.criticalNotice'), options);
      } catch (e) {
        // Fallback para algunos navegadores móviles que requieren Service Workers para notificaciones
        console.warn("La notificación nativa requiere Service Worker en este dispositivo.");
      }
    }
  };

  // --- FIN FUNCIONES NATIVAS ---

  useEffect(() => {
    if ('Notification' in window) {
      setPermisoEstado(Notification.permission);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || !canSend) return;

    setIsSending(true);

    const result = await addAviso(inputText, isUrgent);
    
    if (result && isUrgent) {
      enviarAvisoGrupo(inputText);
      setShowNotification({ 
        title: t('avisos.urgentEmitted'), 
        msg: t('avisos.pushSent') 
      });
      setTimeout(() => setShowNotification(null), 5000);
    }

    setInputText('');
    setIsSending(false);
    setIsUrgent(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-fade-in relative">
      {showNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-slide-in-up no-print">
           <span className="material-symbols-outlined text-green-400">check_circle</span>
           <div>
             <h4 className="font-bold text-xs uppercase tracking-widest">{showNotification.title}</h4>
             <p className="text-sm opacity-90">{showNotification.msg}</p>
           </div>
        </div>
      )}

      {/* CABECERA DE IMPRESIÓN */}
      <div className="print-only mb-6 border-b-2 border-gray-900 pb-4">
        <h1 className="text-2xl font-black uppercase">{t('avisos.commLog')}</h1>
        <p className="text-lg font-bold text-gray-700">{t('avisos.commLogSubtitle')}</p>
        <p className="text-xs text-gray-500 mt-1 uppercase font-black">{`${t('avisos.historyGenerated')} ${new Date().toLocaleDateString()}`}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full print:border-0 print:shadow-none">
        <div className="p-4 bg-gradient-to-r from-earth-900 to-earth-800 text-white flex justify-between items-center shadow-md no-print">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-lg">
                <span className="material-symbols-outlined">campaign</span>
             </div>
             <div>
                <h3 className="font-bold">{t('avisos.center')}</h3>
                <p className="text-[10px] opacity-70 uppercase tracking-tighter">{t('avisos.officialChannel')}</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <button 
               onClick={handlePrint}
               className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 transition-all font-bold flex items-center gap-1"
             >
                <span className="material-symbols-outlined text-sm">print</span> {t('avisos.print')}
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 print:bg-white print:overflow-visible">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
               <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm border print:max-w-full print:rounded-none print:shadow-none print:border-0 print:border-l-4 ${
                 msg.isUrgent 
                   ? 'bg-red-50 border-red-200 text-red-900 ring-2 ring-red-100 print:bg-white print:border-red-600' 
                   : msg.senderId === currentUser?.id ? 'bg-forcall-600 text-white border-transparent print:bg-white print:text-black print:border-gray-300' : 'bg-white border-gray-200 text-gray-800 print:border-gray-200'
               }`}>
                  <div className="flex justify-between items-center mb-1 gap-4">
                    <span className={`text-[10px] font-black uppercase ${msg.isUrgent ? 'text-red-600' : msg.senderId === currentUser?.id ? 'text-white/70' : 'text-gray-400'} print:text-black`}>
                      {msg.senderName} {msg.isUrgent && `• ${t('avisos.urgentNotice')}`}
                    </span>
                    <span className={`text-[9px] ${msg.senderId === currentUser?.id ? 'text-white/60' : 'text-gray-400'} print:text-black`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {msg.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
               </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-100 space-y-3 no-print">
          {canSend ? (
            <>
              {/* PANEL DE CONFIGURACIÓN DE NOTIFICACIONES */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-2">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined ${permisoEstado === 'granted' ? 'text-green-600' : 'text-blue-600'}`}>
                    {permisoEstado === 'granted' ? 'notifications_active' : 'notifications_off'}
                  </span>
                  <div>
                    <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
                      {t('avisos.pushStatus')}
                    </p>
                    <p className="text-[9px] text-blue-700 font-bold">
                      {permisoEstado === 'granted' ? t('avisos.systemActive') : t('avisos.systemPending')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={solicitarPermisos}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    permisoEstado === 'granted' 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {permisoEstado === 'granted' ? t('avisos.systemConfigured') : t('avisos.activateApi')}
                </button>
              </div>

              <div className="flex items-center gap-4 px-2">
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={isUrgent} 
                      onChange={(e) => setIsUrgent(e.target.checked)} 
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-xs font-bold transition-colors ${isUrgent ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                      {t('avisos.markUrgent')}
                    </span>
                 </label>
              </div>

              <form onSubmit={handleSend} className="flex gap-3">
                 <input 
                   type="text" 
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('avisos.writeHere')}
                   className={`flex-1 bg-gray-50 border rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${isUrgent ? 'border-red-200 focus:ring-red-500' : 'border-gray-200 focus:ring-forcall-500'}`}
                 />
                 <button 
                   type="submit"
                   disabled={!inputText.trim() || isSending}
                   className={`px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-black'}`}
                 >
                    {isSending ? (
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">{isUrgent ? 'emergency' : 'send'}</span>
                        <span>{isUrgent ? t('avisos.sendUrgent') : t('avisos.warn')}</span>
                      </>
                    )}
                 </button>
              </form>
            </>
          ) : (
            <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
              <span className="material-symbols-outlined text-gray-300 text-3xl mb-2">lock_person</span>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                {t('avisos.restrictedCoord')}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {t('avisos.onlyElena')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-start gap-3 no-print">
         <span className="material-symbols-outlined text-blue-600 text-lg">info</span>
          <p className="text-xs text-blue-800 leading-tight">
            {t('avisos.pushInfo1')} <strong>{t('avisos.pushInfoBold')}</strong> {t('avisos.pushInfo2')}
          </p>
      </div>
    </div>
  );
};
