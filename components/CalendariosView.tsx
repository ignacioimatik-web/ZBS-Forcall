import React, { useState, useMemo, useEffect } from 'react';
import { UnifiedCalendar } from './UnifiedCalendar';
import { Meeting, User, Guardia, Libranza, Dobla, Vacacion, ManualHoliday, AuditLog } from '../types';
import { downloadCalendarPDF, PDFCalendarData } from '../lib/pdfExport';
import { generateICS, downloadICS } from '../lib/calendarExport';
import { NotificationToast } from './NotificationToast';
import { canManageGuardiaCategory, canManagePlanningType, canManageVacaciones } from '../lib/guardiaPermissions';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CalendariosViewProps {
  meetings: Meeting[]; guardias: Guardia[]; libranzas: Libranza[]; doblas: Dobla[]; vacaciones: Vacacion[]; manualHolidays: ManualHoliday[];
  onAddGuardia: (guardia: Guardia) => void; onDeleteGuardia: (id: string) => void;
  onAddLibranza: (libranza: Libranza) => void; onDeleteLibranza: (id: string) => void;
  onAddDobla: (dobla: Dobla) => void; onDeleteDobla: (id: string) => void;
  onAddVacacion: (vacacion: Vacacion) => void; onDeleteVacacion: (id: string) => void;
  onAddMeeting: (meeting: Meeting) => void;
  onSwapGuardias: (event1: Guardia & { _kind?: string }, event2: Guardia & { _kind?: string }) => Promise<boolean>;
  onUndoSwap?: (log: AuditLog) => Promise<boolean>;
  user: User | null;
}

function safeFormatDate(value: any): string {
  if (value instanceof Date && !isNaN(value.getTime())) return value.toLocaleDateString('es-ES');
  if (value != null) { const d = new Date(value); if (!isNaN(d.getTime())) return d.toLocaleDateString('es-ES'); }
  return '-';
}
function safeDayLabel(value: any): string {
  if (value instanceof Date && !isNaN(value.getTime())) return `Día ${value.getDate()}`;
  if (value != null) { const d = new Date(value); if (!isNaN(d.getTime())) return `Día ${d.getDate()}`; }
  return '-';
}

export const CalendariosView: React.FC<CalendariosViewProps> = (props) => {
  const { guardias, libranzas, doblas, vacaciones, meetings } = props;
  const [activeSub, setActiveSub] = useState<'Medicina' | 'enfermeria' | 'Libranzas' | 'Refuerzo' | 'Vacaciones'>('Medicina');
  const [bulkPersonnel, setBulkPersonnel] = useState<string | null>(null);
  const [bulkDates, setBulkDates] = useState<Date[]>([]);
  const { logs: auditLogs, addLog, deleteLog } = useAuditLogs();
  const [swapMode, setSwapMode] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const doctors = ["Elena Benages", "Delia Mestre", "Frank Castillo", "Fernando Sierra", "Jorge Ramón", "Ilie Popov", "Externo/a"];
  const nurses = ["Xelo García", "Yolanda Lainez", "Maite Beltrán", "Yolanda García", "Rosa Carbó", "Externo/a"];
  const planningPersonnel =
    canManagePlanningType(props.user, 'medica') && canManagePlanningType(props.user, 'enfermeria')
      ? [...doctors, ...nurses]
      : canManagePlanningType(props.user, 'medica')
        ? doctors
        : canManagePlanningType(props.user, 'enfermeria')
          ? nurses
          : [];
  const isVacacionesCategory = activeSub === 'Vacaciones';
  const vacacionesPersonnel = isVacacionesCategory
    ? canManageVacaciones(props.user, 'medica') && canManageVacaciones(props.user, 'enfermeria')
      ? [...doctors, ...nurses]
      : canManageVacaciones(props.user, 'medica')
        ? doctors
        : canManageVacaciones(props.user, 'enfermeria')
          ? nurses
          : []
    : [];
  const currentPersonnel =
    activeSub === 'enfermeria'
      ? nurses
      : activeSub === 'Medicina'
        ? doctors
        : activeSub === 'Refuerzo'
          ? planningPersonnel
          : activeSub === 'Libranzas'
            ? planningPersonnel
            : isVacacionesCategory
              ? vacacionesPersonnel
              : [...doctors, ...nurses];
  const isGuardiaCategory = activeSub === 'Medicina' || activeSub === 'enfermeria';
  const isPlanningCategory = activeSub === 'Libranzas' || activeSub === 'Refuerzo';
  const canManageActiveCategory = isGuardiaCategory
    ? canManageGuardiaCategory(props.user, activeSub)
    : isPlanningCategory
      ? planningPersonnel.length > 0
      : isVacacionesCategory
        ? vacacionesPersonnel.length > 0
        : false;

  useEffect(() => {
    const initLog = { 
      type: 'VALIDACION' as const, 
      user: 'Sistema', 
      description: `Iniciada sesión de gestión en categoría: ${activeSub}`, 
      category: activeSub 
    };
    addLog(initLog);
  }, [activeSub, addLog]);

  const toggleBulkDate = (date: Date) => {
    setBulkDates(prev => prev.find(d => d.toDateString() === date.toDateString()) ? prev.filter(d => d.toDateString() !== date.toDateString()) : [...prev, date]);
  };

  const handleSaveBulk = () => {
    if (!bulkPersonnel || bulkDates.length === 0 || !canManageActiveCategory) return;
    const isNurse = nurses.includes(bulkPersonnel);
    const personnelType = isNurse ? 'enfermeria' : 'medica';
    bulkDates.forEach(date => {
      const common = { id: Math.random().toString(36).substr(2, 9), date, personnelName: bulkPersonnel, isChange: false, modifiedBy: props.user?.id || null, modifiedAt: new Date() };
      if (activeSub === 'Medicina') props.onAddGuardia({ ...common, type: 'medica' } as any);
      else if (activeSub === 'enfermeria') props.onAddGuardia({ ...common, type: 'enfermeria' } as any);
      else if (activeSub === 'Libranzas') props.onAddLibranza({ ...common, id: 'lib-' + common.id, type: personnelType } as any);
      else if (activeSub === 'Refuerzo') props.onAddDobla({ ...common, id: 'dob-' + common.id, type: personnelType } as any);
      else if (activeSub === 'Vacaciones') props.onAddVacacion({ ...common, id: 'vac-' + common.id, type: personnelType } as any);
    });
    addLog({ type: 'CAMBIO', user: props.user?.name || 'Usuario', description: `Asignación masiva: ${bulkPersonnel} (${bulkDates.length} turnos) en ${activeSub}.`, category: activeSub });
    setBulkDates([]); setBulkPersonnel(null);
  };

    const handleSwapEvents = async (ev1: any, ev2: any) => {
    const p1 = ev1.personnelName;
    const p2 = ev2.personnelName;
    const swapped = await props.onSwapGuardias(ev1, ev2);
    if (!swapped) return;

    // Crear log manual de PERMUTA con detalles de la permuta
    const newLog = { 
      type: 'PERMUTA' as const, 
      user: props.user?.name || 'Usuario', 
      description: `Intercambio confirmado entre ${p1} y ${p2}.`, 
      category: activeSub, 
      details: { from: p1, to: p2, date1: ev1.date, date2: ev2.date } 
    };
    addLog(newLog);
    setSwapMode(false);
  };

  const handleDownloadUserCalendar = () => {
    if (!props.user) return;
    const userName = props.user.name;
    const events = [
      ...props.guardias
        .filter(g => g.personnelName === userName)
        .map(g => ({
          summary: `${g.type}: ${g.personnelName}`,
          start: g.date,
          description: `Guardia en ZBS Forcall`
        })),
      ...props.libranzas
        .filter(l => l.personnelName === userName)
        .map(l => ({
          summary: `Libranza ${l.type}: ${l.personnelName}`,
          start: l.date,
          description: `Libranza en ZBS Forcall`
        })),
      ...props.doblas
        .filter(d => d.personnelName === userName)
        .map(d => ({
          summary: `Dobla ${d.type}: ${d.personnelName}`,
          start: d.date,
          description: `Refuerzo en ZBS Forcall`
        })),
    ];
    const icsContent = generateICS(events);
    downloadICS(icsContent, `mis-guardias-${userName}.ics`);
  };

  const handleDownloadRegistry = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Registro de Permutas - ZBS Forcall', 10, 13);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageW - 10, 13, { align: 'right' });

    const rows = permutaHistory.map(log => [
      safeFormatDate(log.timestamp),
      log.category,
      log.details?.from || '',
      log.details?.to || '',
      log.user
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Categoría', 'De', 'A', 'Autorizado']],
      body: rows,
      startY: 26,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 10, right: 10 },
    });

    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(0.5);
    doc.line(10, doc.internal.pageSize.getHeight() - 12, pageW - 10, doc.internal.pageSize.getHeight() - 12);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('ZBS Forcall - Gestión Sanitaria', 10, doc.internal.pageSize.getHeight() - 7);
    doc.text(`Página 1 de 1`, pageW - 10, doc.internal.pageSize.getHeight() - 7, { align: 'right' });

    doc.save(`Registro_Permutas_Forcall_${new Date().toLocaleDateString('es-ES', { month: 'long' })}.pdf`);
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const handleDownloadActiveCalendar = async () => {
    setIsDownloading(true);
    const entries: PDFCalendarData['entries'] = [];
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    if (activeSub === 'Medicina') {
      guardias.filter(g => g.type === 'medica').forEach(g => {
        entries.push({ date: g.date, personnel: [g.personnelName], type: g.type, kind: 'M' });
      });
    } else if (activeSub === 'enfermeria') {
      guardias.filter(g => g.type === 'enfermeria').forEach(g => {
        entries.push({ date: g.date, personnel: [g.personnelName], type: g.type, kind: 'E' });
      });
    } else if (activeSub === 'Libranzas') {
      libranzas.forEach(l => {
        entries.push({ date: l.date, personnel: [l.personnelName], type: l.type, kind: 'L' });
      });
    } else if (activeSub === 'Refuerzo') {
      doblas.forEach(d => {
        entries.push({ date: d.date, personnel: [d.personnelName], type: d.type, kind: 'R' });
      });
    } else if (activeSub === 'Vacaciones') {
      vacaciones.forEach(v => {
        entries.push({ date: v.date, personnel: [v.personnelName], type: v.type, kind: 'V' });
      });
    }
    const data: PDFCalendarData = {
      title: `Calendario ${activeSub} Forcall`,
      subtitle: `${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      month,
      year,
      entries,
    };
    const filename = `Calendario_${activeSub}_Forcall_${new Date().toLocaleDateString('es-ES', { month: 'long' })}.pdf`;
    try {
      downloadCalendarPDF(data, filename);
      setDownloadMsg('PDF descargado correctamente');
    } catch (e) {
      console.error(e);
      setDownloadMsg('Error al generar PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const subNav = [
    { id: 'Medicina', icon: 'stethoscope', activeClass: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-200 ring-blue-500/20' },
    { id: 'enfermeria', icon: 'vaccines', activeClass: 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-red-200 ring-red-500/20' },
    { id: 'Libranzas', icon: 'beach_access', activeClass: 'bg-gradient-to-br from-green-500 to-green-700 text-white shadow-green-200 ring-green-500/20' },
    { id: 'Refuerzo', icon: 'dynamic_feed', activeClass: 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-orange-200 ring-orange-500/20' },
    { id: 'Vacaciones', icon: 'flight', activeClass: 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-purple-200 ring-purple-500/20' }
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
          <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <span className="material-symbols-outlined text-gray-400">chevron_left</span>
              </button>
              <span className="font-black text-gray-800 text-xs capitalize text-center">
                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>
            </div>
            <button 
              onClick={handleDownloadActiveCalendar} 
              className="w-full p-5 rounded-[2rem] bg-indigo-50 text-indigo-700 border-2 border-indigo-100 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3 group hover:bg-indigo-100 hover:border-indigo-200"
            >
               <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">picture_as_pdf</span>
               <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none">Descargar Calendario</span>
                  <span className="text-[9px] opacity-70 font-bold uppercase mt-1 block">{activeSub} - {currentMonth.toLocaleDateString('es-ES', { month: 'long' })}</span>
               </div>
            </button>
           </div>
           
           {/* BOTÓN PERSONALIZADO - SOLO MIS GUARDIAS */}
           <div className="bg-emerald-50/50 rounded-[2rem] p-4 border-2 border-emerald-100">
             <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
               <span className="material-symbols-outlined text-[14px]">person</span>
               Solo mis guardias
             </p>
             <button 
               onClick={handleDownloadUserCalendar} 
               className="w-full p-5 rounded-[1.5rem] bg-emerald-600 text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 group hover:bg-emerald-700"
             >
                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">calendar_today</span>
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none">Descargar Mi Calendario</span>
                  <span className="text-[9px] opacity-70 font-bold uppercase mt-1 block">Formato .ics (Apple/Google)</span>
                </div>
             </button>
           </div>

          {props.user?.role !== 'Administrador' && (
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
          )}

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
            {!canManageActiveCategory && isPlanningCategory && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-[10px] text-amber-900 font-bold leading-relaxed text-center shadow-inner">
                En libranzas y refuerzo solo Elena Benages puede gestionar Medicina y Xelo García puede gestionar enfermeria.
              </div>
            )}
            {!canManageActiveCategory && isVacacionesCategory && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-[10px] text-amber-900 font-bold leading-relaxed text-center shadow-inner">
                Solo Elena Benages puede gestionar vacaciones de Medicina y Xelo García de enfermeria.
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
            meetings={props.meetings} guardias={props.guardias} libranzas={props.libranzas} doblas={props.doblas} vacaciones={props.vacaciones}
            onAddGuardia={props.onAddGuardia} onDeleteGuardia={props.onDeleteGuardia}
            onAddLibranza={props.onAddLibranza} onDeleteLibranza={props.onDeleteLibranza}
            onAddDobla={props.onAddDobla} onDeleteDobla={props.onDeleteDobla}
            onAddVacacion={props.onAddVacacion} onDeleteVacacion={props.onDeleteVacacion}
            onSwapEvents={handleSwapEvents}
            currentUser={props.user}
            activeCategory={activeSub as any} availablePersonnel={currentPersonnel}
            bulkMode={!!bulkPersonnel} selectedBulkDates={bulkDates} onToggleBulkDate={toggleBulkDate}
            swapMode={swapMode} onCancelSwap={() => setSwapMode(false)}
            currentMonth={currentMonth} onMonthChange={setCurrentMonth}
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
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {permutaHistory.length > 0 ? (
                permutaHistory.map(log => {
                  const ts = safeFormatDate(log.timestamp);
                  const d1 = log.details ? safeDayLabel((log.details as any).date1) : '-';
                  const d2 = log.details ? safeDayLabel((log.details as any).date2) : '-';
                  return (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5"><div className="flex flex-col"><span className="text-sm font-black text-gray-800">{ts}</span></div></td>
                    <td className="px-6 py-5"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${log.category === 'Medicina' ? 'bg-blue-50 text-blue-700 border-blue-100' : log.category === 'enfermeria' ? 'bg-red-50 text-red-700 border-red-100' : log.category === 'Libranzas' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>{log.category}</span></td>
                    <td className="px-6 py-5"><div className="flex items-center gap-3"><span className="text-sm font-black text-indigo-700">{log.details?.from}</span><span className="material-symbols-outlined text-gray-300 text-sm">sync_alt</span><span className="text-sm font-black text-indigo-700">{log.details?.to}</span></div></td>
                    <td className="px-6 py-5"><div className="flex gap-2"><span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{d1}</span><span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{d2}</span></div></td>
                    <td className="px-6 py-5 text-right"><span className="text-xs font-black text-gray-600 uppercase tracking-tighter">{log.user}</span></td>
                    <td className="px-6 py-5 text-right">
                      {canManageActiveCategory && props.onUndoSwap && (
                        <button
                          onClick={async () => {
                            if (!confirm('¿Deshacer esta permuta? Se intercambiarán los profesionales de nuevo.')) return;
                            const ok = await props.onUndoSwap!(log);
                            if (ok) deleteLog(log.id);
                          }}
                          className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-all active:scale-95"
                        >
                          Deshacer
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                }))
              : (
                <tr><td colSpan={6} className="px-6 py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">Sin registros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {downloadMsg && <NotificationToast message={downloadMsg} onClose={() => setDownloadMsg(null)} />}
    </div>
  );
};
