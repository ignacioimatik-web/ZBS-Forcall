
import React, { useState, useMemo } from 'react';
import { Meeting, MeetingType, Guardia, User, Libranza, Dobla } from '../types';
import { getHolidayName } from '../utils';

declare var html2pdf: any;

interface UnifiedCalendarProps {
  meetings: Meeting[];
  guardias: Guardia[];
  libranzas?: Libranza[];
  doblas?: Dobla[];
  onAddGuardia: (guardia: Guardia) => void;
  onDeleteGuardia: (id: string) => void;
  onAddLibranza: (libranza: Libranza) => void;
  onDeleteLibranza: (id: string) => void;
  onAddDobla: (dobla: Dobla) => void;
  onDeleteDobla: (id: string) => void;
  onSwapEvents?: (event1: any, event2: any) => void;
  currentUser: User | null;
  isReadOnly?: boolean;
  activeCategory?: 'Medicina' | 'Enfermería' | 'Libranzas' | 'Refuerzo' | 'Todo';
  availablePersonnel?: string[];
  bulkMode?: boolean;
  selectedBulkDates?: Date[];
  onToggleBulkDate?: (date: Date) => void;
  swapMode?: boolean;
  onCancelSwap?: () => void;
  hideHeader?: boolean;
  id?: string;
}

export const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({ 
  meetings, guardias, libranzas = [], doblas = [],
  onAddGuardia, onDeleteGuardia, onAddLibranza, onDeleteLibranza, onAddDobla, onDeleteDobla,
  onSwapEvents, currentUser, activeCategory = 'Todo',
  availablePersonnel = [], bulkMode = false, selectedBulkDates = [], onToggleBulkDate,
  swapMode = false, onCancelSwap, hideHeader = false, id = "calendar-container"
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [personnelName, setPersonnelName] = useState('');
  const [firstSwapTarget, setFirstSwapTarget] = useState<any | null>(null);

  const isCoordinator = currentUser?.role === 'Coordinador';
  const canEdit = currentUser && currentUser.role !== 'Administrador';

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1));
  }, [currentMonth]);

  const startingEmptyCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    return firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  }, [currentMonth]);

  const getEventsForDay = (date: Date) => {
    const dStr = date.toDateString();
    let events: any[] = [];
    if (activeCategory === 'Todo') {
      events = [
        ...guardias.filter(g => g.date.toDateString() === dStr),
        ...libranzas.filter(l => l.date.toDateString() === dStr),
        ...doblas.filter(d => d.date.toDateString() === dStr),
        ...meetings.filter(m => m.date.toDateString() === dStr)
      ];
    } else if (activeCategory === 'Medicina') {
      events = guardias.filter(g => g.date.toDateString() === dStr && g.type === 'Médica');
    } else if (activeCategory === 'Enfermería') {
      events = guardias.filter(g => g.date.toDateString() === dStr && g.type === 'Enfermería');
    } else if (activeCategory === 'Libranzas') {
      events = libranzas.filter(l => l.date.toDateString() === dStr);
    } else if (activeCategory === 'Refuerzo') {
      events = doblas.filter(d => d.date.toDateString() === dStr);
    }
    return { events, holiday: getHolidayName(date) };
  };

  const getEventStyle = (ev: any) => {
    if (firstSwapTarget?.id === ev.id) return 'bg-indigo-700 text-white border-indigo-900 ring-4 ring-indigo-200 animate-pulse z-50';
    if (ev.isChange) return 'bg-orange-600 text-white border-orange-700 shadow-md ring-1 ring-orange-200';
    if (ev.type === 'Médica') return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    if (ev.type === 'Enfermería') return 'bg-rose-100 text-rose-900 border-rose-300';
    if (ev.id && String(ev.id).includes('lib')) return 'bg-blue-100 text-blue-900 border-blue-300';
    if (ev.id && String(ev.id).includes('dob')) return 'bg-orange-100 text-orange-900 border-orange-300';
    return 'bg-sky-100 text-sky-900 border-sky-300';
  };

  const handleEntryClick = (e: React.MouseEvent, ev: any) => {
    if (swapMode && onSwapEvents) {
      e.stopPropagation();
      if (!firstSwapTarget) {
        setFirstSwapTarget(ev);
      } else {
        if (firstSwapTarget.id !== ev.id) {
          onSwapEvents(firstSwapTarget, ev);
          setFirstSwapTarget(null);
        }
      }
    }
  };

  const handleCellClick = (date: Date) => {
    if (swapMode) return;
    if (!canEdit || activeCategory === 'Todo') return;
    if (bulkMode && onToggleBulkDate) { onToggleBulkDate(date); return; }
    setSelectedDate(date);
    setPersonnelName(availablePersonnel[0] || '');
    setIsModalOpen(true);
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !personnelName) return;
    const common = {
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDate,
      personnelName,
      isChange: !isCoordinator,
      modifiedBy: currentUser?.name,
      modifiedAt: new Date()
    };
    if (activeCategory === 'Medicina') onAddGuardia({ ...common, type: 'Médica' } as any);
    else if (activeCategory === 'Enfermería') onAddGuardia({ ...common, type: 'Enfermería' } as any);
    else if (activeCategory === 'Libranzas') onAddLibranza({ ...common, id: 'lib-' + common.id } as any);
    else if (activeCategory === 'Refuerzo') onAddDobla({ ...common, id: 'dob-' + common.id } as any);
    setIsModalOpen(false);
  };

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(next);
  };

  return (
    <div id={id} className="w-full space-y-4 bg-gray-50/10 p-1 rounded-3xl">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-3 md:p-4 rounded-3xl shadow-sm border border-gray-100 no-print sticky top-0 z-40 gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><span className="material-symbols-outlined text-gray-400">chevron_left</span></button>
            <div className="flex flex-col items-center min-w-[120px] sm:min-w-[180px]">
              <h2 className="text-sm md:text-lg font-black text-gray-800 uppercase tracking-tighter text-center leading-none">
                {currentMonth.toLocaleDateString('es-ES', { month: 'long' })}
              </h2>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentMonth.getFullYear()}</span>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><span className="material-symbols-outlined text-gray-400">chevron_right</span></button>
            <button onClick={() => setCurrentMonth(new Date())} className="ml-2 px-3 py-1.5 bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest border border-gray-100 rounded-lg hover:bg-gray-100">Hoy</button>
          </div>
          <div className="flex items-center gap-2">
             {swapMode && (
               <button onClick={() => { setFirstSwapTarget(null); onCancelSwap?.(); }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95">CANCELAR PERMUTA</button>
             )}
             <span className={`text-[10px] font-black px-4 py-2 rounded-xl border ${isCoordinator ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
               {isCoordinator ? 'GESTIÓN' : 'CONSULTA'}
             </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="hidden md:block text-center text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] p-2">{d}</div>
        ))}
        {Array.from({ length: startingEmptyCells }).map((_, i) => (
          <div key={`empty-${i}`} className="hidden md:block min-h-[140px] bg-gray-50/20 rounded-2xl border border-transparent" />
        ))}
        {daysInMonth.map((date, i) => {
          const { events, holiday } = getEventsForDay(date);
          const isToday = new Date().toDateString() === date.toDateString();
          const isSelected = selectedBulkDates?.some(d => d.toDateString() === date.toDateString());
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isFestivo = !!holiday;
          
          if (events.length === 0 && window.innerWidth < 768 && !canEdit && !bulkMode) return null;
          
          return (
            <div 
              key={i} 
              onClick={() => handleCellClick(date)} 
              className={`flex md:flex-col gap-3 md:gap-0 p-4 rounded-3xl border transition-all relative group md:min-h-[180px]
                ${isToday ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 
                  isFestivo ? 'bg-gradient-to-br from-white via-red-50 to-red-100/40 border-red-100 shadow-inner' : 
                  isWeekend ? 'bg-gradient-to-br from-white via-slate-50 to-slate-100/50 border-gray-100 shadow-sm' : 
                  'bg-white border-gray-100'} 
                ${canEdit && !swapMode ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md' : ''} 
                ${isSelected ? 'ring-4 ring-amber-500 border-amber-500 bg-amber-50 z-10 shadow-xl' : ''}`}
            >
              <div className="flex flex-col items-center justify-center md:justify-between md:items-start md:flex-row md:mb-3 min-w-[50px]">
                <span className={`text-2xl font-black leading-none ${isToday ? 'text-indigo-600' : isFestivo ? 'text-red-600' : isWeekend ? 'text-slate-400' : 'text-gray-300'}`}>{date.getDate()}</span>
                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">{date.toLocaleDateString('es', {weekday: 'short'})}</span>
                {isFestivo && <span className="hidden md:block w-3 h-3 bg-red-500 rounded-full shadow-sm animate-pulse" title={holiday}></span>}
              </div>
              <div className="flex-1 space-y-2 md:space-y-1.5 overflow-hidden">
                {events.map((ev: any, idx) => (
                  <div key={idx} onClick={(e) => handleEntryClick(e, ev)} className={`px-4 py-3 md:px-3 md:py-2 rounded-2xl text-[14px] md:text-[11px] font-black border leading-tight transition-all relative flex items-center justify-between shadow-sm ${getEventStyle(ev)} ${swapMode ? 'cursor-pointer hover:brightness-110 active:scale-95' : ''}`}>
                    <span className="whitespace-normal break-words pr-2">{ev.personnelName || ev.title}</span>
                    {canEdit && !bulkMode && !swapMode && (
                      <button onClick={(e) => { e.stopPropagation(); if (ev.type) onDeleteGuardia(ev.id); else if (String(ev.id).includes('lib')) onDeleteLibranza(ev.id); else if (String(ev.id).includes('dob')) onDeleteDobla(ev.id); }} className="md:opacity-0 group-hover:opacity-100 text-inherit hover:text-red-600 transition-opacity shrink-0 p-1">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    )}
                  </div>
                ))}
                {events.length === 0 && canEdit && !swapMode && (
                  <div className="hidden md:flex flex-1 items-center justify-center text-gray-100 italic text-[10px] font-bold uppercase tracking-[0.2em]">Libre</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 animate-slide-in-up">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <span className={`p-2 rounded-xl text-white ${isCoordinator ? 'bg-emerald-600' : 'bg-orange-600'} material-symbols-outlined`}>{isCoordinator ? 'add_circle' : 'swap_horiz'}</span>
              {isCoordinator ? 'Asignar' : 'Pedir Cambio'}
            </h3>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{activeCategory}</p>
                <p className="font-black text-gray-800 text-lg uppercase tracking-tight">{selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <select required value={personnelName} onChange={(e) => setPersonnelName(e.target.value)} className="w-full px-6 py-4 bg-gray-100 border-none rounded-2xl font-black text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500">
                <option value="" disabled>Seleccionar profesional...</option>
                {availablePersonnel.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors">Cerrar</button>
                <button type="submit" className={`flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${isCoordinator ? 'bg-emerald-600' : 'bg-orange-600'}`}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
