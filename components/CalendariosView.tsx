import React, { useState, useMemo, useEffect } from 'react';
import { UnifiedCalendar } from './UnifiedCalendar';
import { Meeting, User, Guardia, Libranza, Dobla, ManualHoliday, AuditLog } from '../types';
import { exportCalendarToPDF } from '../lib/pdfExport';
import { canManageGuardiaCategory } from '../lib/guardiaPermissions';

interface CalendariosViewProps {
  meetings: Meeting[]; guardias: Guardia[]; libranzas: Libranza[]; doblas: Dobla[]; manualHolidays: ManualHoliday[];
  onAddGuardia: (guardia: Guardia) => void; onDeleteGuardia: (id: string) => void;
  onAddLibranza: (libranza: Libranza) => void; onDeleteLibranza: (id: string) => void;
  onAddDobla: (dobla: Dobla) => void; onDeleteDobla: (id: string) => void;
  onAddMeeting: (meeting: Meeting) => void;
  onSwapGuardias: (event1: Guardia & { _kind?: string }, event2: Guardia & { _kind?: string }) => Promise<boolean>;
  user: User | null;
}

export const CalendariosView: React.FC<CalendariosViewProps> = (props) => {
  const [activeSub, setActiveSub] = useState<'Medicina' | 'Enfermería' | 'Libranzas' | 'Refuerzo'>('Medicina');
  const [bulkPersonnel, setBulkPersonnel] = useState<string | null>(null);
  const [bulkDates, setBulkDates] = useState<Date[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [swapMode, setSwapMode] = useState(false);

  const doctors = ["Dra. Elena Benages", "Dra. Delia Mestre", "Dr. Fernando Sierra", "Dr. Jorge Ramón", "Dr. Frank Castillo", "Dr. Ilie Popov", "Dr. Martínez"];
  const nurses = ["Xelo Carbó", "Rosa", "Maite", "Enf. Sara", "Enf. María Pilar", "Enf. Jose Vicente", "Enf. Silvia Mir", "Enf. Carlos Giner"];
  const currentPersonnel = activeSub === 'Enfermería' ? nurses : activeSub === 'Medicina' ? doctors : [...doctors, ...nurses];
  const isGuardiaCategory = activeSub === 'Medicina' || activeSub === 'Enfermería';
  const canManageActiveCategory = isGuardiaCategory ? canManageGuardiaCategory(props.user, activeSub) : false;

  useEffect(() => {
    const initLog: AuditLog = { 
      id: Math.random().toString(), 
      type: 'VALIDACION', 
      user: 'Sistema', 
      timestamp: new Date(), 
      description: `Iniciada sesión de gestión en categoría: ${activeSub}`, 
      category: activeSub 
    };
    setAuditLogs(prev => [initLog, ...prev.slice(0, 49)]);
  }, [activeSub]);

  const toggleBulkDate = (date: Date) => {
    setBulkDates(prev => prev.find(d => d.toDateString() === date.toDateString()) ? prev.filter(d => d.toDateString() !== date.toDateString()) : [...prev, date]);
  };

  const handleSaveBulk = () => {
    if (!bulkPersonnel || bulkDates.length === 0 || !canManageActiveCategory) return;
    const isNurse = nurses.includes(bulkPersonnel);
    const personnelType = isNurse ? 'Enfermería' : 'Médica';
    bulkDates.forEach(date => {
      const common = { id: Math.random().toString(36).substr(2, 9), date, personnelName: bulkPersonnel, isChange: false, modifiedBy: props.user?.name || null, modifiedAt: new Date() };
      if (activeSub === 'Medicina') props.onAddGuardia({ ...common, type: 'Médica' } as any);
      else if (activeSub === 'Enfermería') props.onAddGuardia({ ...common, type: 'Enfermería' } as any);
      else if (activeSub === 'Libranzas') props.onAddLibranza({ ...common, id: 'lib-' + common.id, type: personnelType } as any);
      else if (activeSub === 'Refuerzo') props.onAddDobla({ ...common, id: 'dob-' + common.id, type: personnelType } as any);
    });
    setAuditLogs(prev => [{ id: Date.now().toString(), type: 'CAMBIO', user: props.user?.name || 'Usuario', timestamp: new Date(), description: `Asignación masiva: ${bulkPersonnel} (${bulkDates.length} turnos) en ${activeSub}.`, category: activeSub }, ...prev]);
    setBulkDates([]); setBulkPersonnel(null);
  };

  const handleSwapEvents = async (ev1: any, ev2: any) => {
    const p1 = ev1.personnelName;
    const p2 = ev2.personnelName;
    const swapped = await props.onSwapGuardias(ev1, ev2);
    if (!swapped) return;

    const newLog: AuditLog = { 
      id: Date.now().toString(), 
      type: 'PERMUTA', 
      user: props.user?.name || 'Usuario', 
      timestamp: new Date(), 
      description: `Intercambio confirmado entre ${p1} y ${p2}.`, 
      category: activeSub, 
      details: { from: p1, to: p2, date1: ev1.date, date2: ev2.date } 
    };
    setAuditLogs(prev => [newLog, ...prev]);
    setSwapMode(false);
  };

  const handleDownloadRegistry = () => {
    exportCalendarToPDF({
      elementId: 'registro-permutas-container',
      filename: `Registro_Permutas_Forcall_${new Date().toLocaleDateString('es-ES', { month: 'long' })}.pdf`
    });
  };

  const handleDownloadActiveCalendar = () => {
    exportCalendarToPDF({
      elementId: 'view-calendar',
      filename: `Calendario_${activeSub}_Forcall_${new Date().toLocaleDateString('es-ES', { month: 'long' })}.pdf`
    });
  };

  const subNav = [
    { id: 'Medicina', icon: 'stethoscope', activeClass: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-200 ring-blue-500/20' },
    { id: 'Enfermería', icon: 'vaccines', activeClass: 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-red-200 ring-red-500/20' },
    { id: 'Libranzas', icon: 'beach_access', activeClass: 'bg-gradient-to-br from-green-500 to-green-700 text-white shadow-green-200 ring-green-500/20' },
    { id: 'Refuerzo', icon: 'dynamic_feed', activeClass: 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-orange-200 ring-orange-500/20' }
  ];

  const permutaHistory = useMemo(() => auditLogs.filter(log => log.type === 'PERMUTA'), [auditLogs]);

  return (
    <div className="flex flex-col gap-4 md:gap-8 animate-fade-in pb-16">
      {/* Selector Categoría Superior con DEGRADADOS */}
      <div className="flex overflow-x-auto gap-2 no-scrollbar px-4 pb-2 md:justify-center">
        {subNav.map(item => (
          <button 
            key={item.id} 
            onClick={() => { setActiveSub(item.id as any); setBulkPersonnel(null); setBulkDates([]); setSwapMode(false); }}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all whitespace-nowrap shadow-sm ${
              activeSub === item.id 
                ? `${item.activeClass} ring-4 shadow-xl scale-105 z-10 border-transparent` 
                : 'bg-gray-100 text-gray-400 border-transparent hover:bg-gray-200/50'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            <span className="text-[12px] font-black uppercase tracking-widest">{item.id}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* PANEL DE HERRAMIENTAS - IZQUIERDA */}
        <aside className="w-full lg:w-80 space-y-4 lg:order-1 no-print px-4 md:px-0">
          <button 
            onClick={handleDownloadActiveCalendar} 
            className="w-full p-6 rounded-[2rem] bg-indigo-50 text-indigo-700 border-2 border-indigo-100 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-4 group hover:bg-indigo-100 hover:border-indigo-200"
          >
             <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">picture_as_pdf</span>
             <div className="text-left">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none">Descargar Calendario</span>
               <span className="text-[9px] opacity-70 font-bold uppercase mt-1 block">{activeSub} - PDF</span>
             </div>
          </button>
          
          <button 
            onClick={() => { setSwapMode(!swapMode); setBulkPersonnel(null); }} 
            className={`w-full p-6 rounded-[2.5rem] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 border-2 ${swapMode ? 'bg-indigo-700 text-white border-indigo-900 ring-4 ring-indigo-500/20 animate-pulse' : 'bg-white text-indigo-700 border-indigo-50 hover:border-indigo-200 shadow-indigo-100/20 shadow-lg'}`}
          >
             <span className="material-symbols-outlined text-3xl">{swapMode ? 'sync_alt' : 'swap_calls'}</span>
             <div className="text-left">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none">{swapMode ? 'PERMUTA ACTIVA' : 'PEDIR PERMUTA'}</span>
               <span className="text-[9px] opacity-70 font-bold uppercase mt-1 block">Toca 2 nombres para cruzar</span>
             </div>
          </button>

          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">person_search</span>
              Gestión: {activeSub}
            </h4>
            <select 
              value={bulkPersonnel || ''} 
              disabled={swapMode || !canManageActiveCategory} 
              onChange={(e) => { setBulkPersonnel(e.target.value); setBulkDates([]); }} 
              className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] font-black text-xs uppercase focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer hover:bg-gray-100"
            >
              <option value="">-- SELECCIONAR PROFESIONAL --</option>
              {currentPersonnel.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {!canManageActiveCategory && isGuardiaCategory && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-[10px] text-amber-900 font-bold leading-relaxed text-center shadow-inner">
                Solo la coordinación de la categoría puede añadir o quitar guardias. El resto del equipo solo puede hacer permutas.
              </div>
            )}
            {bulkPersonnel && (
              <div className="space-y-4 animate-slide-in-up">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-[10px] text-amber-900 font-bold leading-relaxed text-center shadow-inner">
                  {bulkDates.length === 0 ? `Toca días en el calendario para ${bulkPersonnel}` : `${bulkDates.length} días seleccionados para asignar`}
                </div>
                {bulkDates.length > 0 && (
                  <button 
                    onClick={handleSaveBulk} 
                    className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 hover:bg-black transition-colors"
                  >
                    CONFIRMAR ASIGNACIÓN
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CALENDARIO - DERECHA */}
        <main className="flex-1 lg:order-2">
          <UnifiedCalendar 
            id="view-calendar"
            meetings={props.meetings} guardias={props.guardias} libranzas={props.libranzas} doblas={props.doblas}
            onAddGuardia={props.onAddGuardia} onDeleteGuardia={props.onDeleteGuardia}
            onAddLibranza={props.onAddLibranza} onDeleteLibranza={props.onDeleteLibranza}
            onAddDobla={props.onAddDobla} onDeleteDobla={props.onDeleteDobla}
            onSwapEvents={handleSwapEvents}
            currentUser={props.user}
            activeCategory={activeSub as any} availablePersonnel={currentPersonnel}
            bulkMode={!!bulkPersonnel} selectedBulkDates={bulkDates} onToggleBulkDate={toggleBulkDate}
            swapMode={swapMode} onCancelSwap={() => setSwapMode(false)}
          />
        </main>
      </div>

      {/* Registro de Permutas */}
      <div id="registro-permutas-container" className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 md:p-8 bg-gray-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><span className="material-symbols-outlined">history</span></div>
             <div><h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Historial de Permutas</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Control ZBS Forcall</p></div>
           </div>
           <button onClick={handleDownloadRegistry} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 no-print shadow-lg active:scale-95"><span className="material-symbols-outlined text-sm">picture_as_pdf</span> Descargar (PDF)</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Categoría</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Intercambio</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Días</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-right">Autorizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {permutaHistory.length > 0 ? (
                permutaHistory.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5"><div className="flex flex-col"><span className="text-sm font-black text-gray-800">{log.timestamp.toLocaleDateString('es-ES')}</span></div></td>
                    <td className="px-6 py-5"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${log.category === 'Medicina' ? 'bg-blue-50 text-blue-700 border-blue-100' : log.category === 'Enfermería' ? 'bg-red-50 text-red-700 border-red-100' : log.category === 'Libranzas' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>{log.category}</span></td>
                    <td className="px-6 py-5"><div className="flex items-center gap-3"><span className="text-sm font-black text-indigo-700">{log.details?.from}</span><span className="material-symbols-outlined text-gray-300 text-sm">sync_alt</span><span className="text-sm font-black text-indigo-700">{log.details?.to}</span></div></td>
                    <td className="px-6 py-5"><div className="flex gap-2"><span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">Día {log.details?.date1.getDate()}</span><span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">Día {log.details?.date2.getDate()}</span></div></td>
                    <td className="px-6 py-5 text-right"><span className="text-xs font-black text-gray-600 uppercase tracking-tighter">{log.user}</span></td>
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
