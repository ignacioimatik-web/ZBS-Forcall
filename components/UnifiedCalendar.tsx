
import React, { useState, useMemo, useEffect } from 'react';
import { Meeting, MeetingType, Guardia, User, Libranza, Dobla, Vacacion } from '../types';
import { getHolidayName } from '../utils';
import { canManageGuardiaCategory, canManageGuardiaType, canManagePlanningType, canManageVacaciones } from '../lib/guardiaPermissions';
import { ConfirmationModal } from './ConfirmationModal';
import { useT } from '../lib/i18n';

declare var html2pdf: any;

interface CalendarEvent {
  _kind: string;
  id: string;
  date: Date;
  personnelName?: string;
  title?: string;
  type?: string;
  isChange?: boolean;
  modifiedBy?: string | null;
  modifiedAt?: Date;
}

interface UnifiedCalendarProps {
  meetings: Meeting[];
  guardias: Guardia[];
  libranzas?: Libranza[];
  doblas?: Dobla[];
  vacaciones?: Vacacion[];
  onAddGuardia: (guardia: Guardia) => void;
  onDeleteGuardia: (id: string) => void;
  onAddLibranza: (libranza: Libranza) => void;
  onDeleteLibranza: (id: string) => void;
  onAddDobla: (dobla: Dobla) => void;
  onDeleteDobla: (id: string) => void;
  onAddVacacion?: (vacacion: Vacacion) => void;
  onDeleteVacacion?: (id: string) => void;
  onSwapEvents?: (event1: CalendarEvent, event2: CalendarEvent) => void;
  currentUser: User | null;
  isReadOnly?: boolean;
  activeCategory?: 'Medicina' | 'enfermeria' | 'Libranzas' | 'Refuerzo' | 'Vacaciones' | 'Todo';
  availablePersonnel?: string[];
  bulkMode?: boolean;
  selectedBulkDates?: Date[];
  onToggleBulkDate?: (date: Date) => void;
  swapMode?: boolean;
  onCancelSwap?: () => void;
  getPersonnelType?: (name: string) => 'medica' | 'enfermeria';
  hideHeader?: boolean;
  id?: string;
  currentMonth?: Date;
  onMonthChange?: (month: Date) => void;
  noteDates?: string[];
  onCellNoteClick?: (date: Date) => void;
}

export const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({ 
  meetings, guardias, libranzas = [], doblas = [], vacaciones = [],
  onAddGuardia, onDeleteGuardia, onAddLibranza, onDeleteLibranza, onAddDobla, onDeleteDobla,
  onAddVacacion, onDeleteVacacion,
  onSwapEvents, currentUser, activeCategory = 'Todo',
  availablePersonnel = [], bulkMode = false, selectedBulkDates = [], onToggleBulkDate,
  swapMode = false, onCancelSwap, hideHeader = false, id = "calendar-container", isReadOnly = false,
  currentMonth: externalMonth, onMonthChange, getPersonnelType, noteDates = [], onCellNoteClick
}) => {
  const { t } = useT();
  const [internalMonth, setInternalMonth] = useState(new Date());
  const currentMonth = externalMonth ?? internalMonth;
  const setCurrentMonth = (m: Date) => {
    onMonthChange?.(m);
    if (!externalMonth) setInternalMonth(m);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [personnelName, setPersonnelName] = useState('');
  const [firstSwapTarget, setFirstSwapTarget] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isGuardiaCategory = activeCategory === 'Medicina' || activeCategory === 'enfermeria';
  const isPlanningCategory = activeCategory === 'Libranzas' || activeCategory === 'Refuerzo';
  const isVacacionesCategory = activeCategory === 'Vacaciones';
  const planningType = activeCategory === 'Libranzas' || activeCategory === 'Refuerzo'
    ? (availablePersonnel.some((person) => person.includes('Elena') || person.includes('Delia') || person.includes('Fran') || person.includes('Fernando') || person.includes('Jorge') || person.includes('Ilie')) ? 'medica' : 'enfermeria')
    : 'medica';
  const vacacionesType = availablePersonnel.some(p => p.includes('Elena') || p.includes('Delia') || p.includes('Fran') || p.includes('Fernando') || p.includes('Jorge') || p.includes('Ilie')) ? 'medica' : 'enfermeria';
  const canManageActiveCategory = !isReadOnly && isGuardiaCategory
    ? canManageGuardiaCategory(currentUser, activeCategory)
    : !isReadOnly && isPlanningCategory
      ? canManagePlanningType(currentUser, planningType)
      : !isReadOnly && isVacacionesCategory
        ? canManageVacaciones(currentUser, vacacionesType)
        : false;
  const canSwapInActiveCategory = !isReadOnly && isGuardiaCategory && !!currentUser;

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
    let events: CalendarEvent[] = [];
    if (activeCategory === 'Todo') {
      events = [
        ...guardias.filter(g => g.date.toDateString() === dStr).map(g => ({ ...g, _kind: 'guardia' })),
        ...libranzas.filter(l => l.date.toDateString() === dStr).map(l => ({ ...l, _kind: 'libranza' })),
        ...doblas.filter(d => d.date.toDateString() === dStr).map(d => ({ ...d, _kind: 'dobla' })),
        ...vacaciones.filter(v => v.date.toDateString() === dStr).map(v => ({ ...v, _kind: 'vacacion' })),
        ...meetings.filter(m => m.date.toDateString() === dStr).map(m => ({ ...m, _kind: 'meeting' }))
      ];
    } else if (activeCategory === 'Medicina') {
      events = guardias.filter(g => g.date.toDateString() === dStr && g.type === 'medica').map(g => ({ ...g, _kind: 'guardia' }));
    } else if (activeCategory === 'enfermeria') {
      events = guardias.filter(g => g.date.toDateString() === dStr && g.type === 'enfermeria').map(g => ({ ...g, _kind: 'guardia' }));
    } else if (activeCategory === 'Libranzas') {
      events = libranzas.filter(l => l.date.toDateString() === dStr).map(l => ({ ...l, _kind: 'libranza' }));
    } else if (activeCategory === 'Refuerzo') {
      events = doblas.filter(d => d.date.toDateString() === dStr).map(d => ({ ...d, _kind: 'dobla' }));
    } else if (activeCategory === 'Vacaciones') {
      events = vacaciones.filter(v => v.date.toDateString() === dStr).map(v => ({ ...v, _kind: 'vacacion' }));
    }
    return { events, holiday: getHolidayName(date) };
  };

  const getEventStyle = (ev: CalendarEvent) => {
    // Swap target siempre tiene prioridad visual
    if (firstSwapTarget?.id === ev.id) return 'bg-indigo-700 text-white border-indigo-900 ring-4 ring-indigo-200 animate-pulse z-50';
    
    // Discriminar por _kind primero (libranzas y doblas)
    if (ev._kind === 'libranza') {
      const base = 'bg-green-100 text-green-900 border-green-300';
      return ev.isChange ? `${base} ring-2 ring-orange-400` : base;
    }
    if (ev._kind === 'dobla') {
      const base = 'bg-orange-100 text-orange-900 border-orange-300';
      return ev.isChange ? `${base} ring-2 ring-orange-400` : base;
    }
    if (ev._kind === 'meeting') {
      return 'bg-sky-100 text-sky-900 border-sky-300';
    }
    if (ev._kind === 'vacacion') {
      return 'bg-purple-100 text-purple-900 border-purple-300';
    }
    
    // Guardias: discriminar por type
    if (ev.type === 'medica') {
      const base = 'bg-blue-100 text-blue-900 border-blue-300';
      return ev.isChange ? `${base} ring-2 ring-orange-400` : base;
    }
    if (ev.type === 'enfermeria') {
      const base = 'bg-red-100 text-red-900 border-red-300';
      return ev.isChange ? `${base} ring-2 ring-orange-400` : base;
    }
    
    // Fallback
    return 'bg-sky-100 text-sky-900 border-sky-300';
  };

  const handleEntryClick = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    if (bulkMode) return;
    if (swapMode && canSwapInActiveCategory && onSwapEvents) {
      if (!firstSwapTarget) {
        setFirstSwapTarget(ev);
      } else {
        if (firstSwapTarget.id !== ev.id) {
          onSwapEvents(firstSwapTarget, ev);
          setFirstSwapTarget(null);
        }
      }
      return;
    }
    const canDelete = (ev._kind === 'guardia' && canManageGuardiaType(currentUser, ev.type)) ||
      ((ev._kind === 'libranza' || ev._kind === 'dobla') && canManagePlanningType(currentUser, ev.type)) ||
      (ev._kind === 'vacacion' && canManageVacaciones(currentUser, ev.type));
    if (canDelete) {
      setDeleteTarget(ev);
    }
  };

  const handleCellClick = (date: Date) => {
    if (swapMode) return;
    if (onCellNoteClick) {
      onCellNoteClick(date);
      return;
    }
    if (!canManageActiveCategory || activeCategory === 'Todo') return;
    if (bulkMode && onToggleBulkDate) { onToggleBulkDate(date); return; }
    setSelectedDate(date);
    setPersonnelName(availablePersonnel[0] || '');
    setIsModalOpen(true);
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !personnelName) return;
    const common = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11),
      date: selectedDate,
      personnelName,
      isChange: false,
      modifiedBy: currentUser?.id,
      modifiedAt: new Date()
    };
    const personType = getPersonnelType ? getPersonnelType(personnelName) : 'medica';
    if (activeCategory === 'Medicina') onAddGuardia({ ...common, type: 'medica' });
    else if (activeCategory === 'enfermeria') onAddGuardia({ ...common, type: 'enfermeria' });
    else if (activeCategory === 'Libranzas') onAddLibranza({ ...common, id: 'lib-' + common.id, type: personType });
    else if (activeCategory === 'Refuerzo') onAddDobla({ ...common, id: 'dob-' + common.id, type: personType });
    else if (activeCategory === 'Vacaciones') onAddVacacion?.({ ...common, id: 'vac-' + common.id, type: personType });
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
            <button onClick={() => setCurrentMonth(new Date())} className="ml-2 px-3 py-1.5 bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest border border-gray-100 rounded-lg hover:bg-gray-100">{t('common.hoy')}</button>
          </div>
          <div className="flex items-center gap-2">
             {swapMode && (
                <button onClick={() => { setFirstSwapTarget(null); onCancelSwap?.(); }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95">{t('unifiedCalendar.cancelSwap')}</button>
             )}
              <span className={`text-[10px] font-black px-4 py-2 rounded-xl border ${(canManageActiveCategory || isGuardiaCategory) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                {(canManageActiveCategory || isGuardiaCategory) ? t('common.gestion') : t('common.consulta')}
              </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3">
        {[t('unifiedCalendar.mon'), t('unifiedCalendar.tue'), t('unifiedCalendar.wed'), t('unifiedCalendar.thu'), t('unifiedCalendar.fri'), t('unifiedCalendar.sat'), t('unifiedCalendar.sun')].map(d => (
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
          
          if (events.length === 0 && !canManageActiveCategory && !bulkMode) {
            if (isMobile) return null;
            return (
              <div key={i} className={`flex md:flex-col items-center md:pt-4 md:pb-0 ${onCellNoteClick ? 'cursor-pointer' : ''}`} onClick={() => onCellNoteClick?.(date)}>
                <div className="flex items-center gap-1">
                  <span className={`text-2xl font-black leading-none ${isToday ? 'text-indigo-600' : isFestivo ? 'text-red-600' : isWeekend ? 'text-slate-400' : 'text-gray-300'}`}>{date.getDate()}</span>
                  {noteDates.includes(date.toDateString()) && (
                    <span className="material-symbols-outlined text-amber-500 text-lg">sticky_note_2</span>
                  )}
                  {onCellNoteClick && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onCellNoteClick(date); }}
                      className={`p-0.5 rounded-md transition-all opacity-0 group-hover:opacity-100 ${noteDates.includes(date.toDateString()) ? 'text-amber-500 opacity-100' : 'text-gray-300 hover:text-amber-400'}`}
                      title="Nota"
                    >
                      <span className="material-symbols-outlined text-base">{noteDates.includes(date.toDateString()) ? 'edit_note' : 'note_add'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          }
          
          return (
            <div 
              key={i} 
              onClick={() => handleCellClick(date)} 
              className={`flex md:flex-col gap-3 md:gap-0 p-4 rounded-3xl border transition-all relative group md:min-h-[200px]
                ${isToday ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 
                  isFestivo ? 'bg-gradient-to-br from-white via-red-50 to-red-100/40 border-red-100 shadow-inner' : 
                  isWeekend ? 'bg-gradient-to-br from-white via-slate-50 to-slate-100/50 border-gray-100 shadow-sm' : 
                  'bg-white border-gray-100'} 
                ${canManageActiveCategory && !swapMode ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md' : ''} 
                ${isSelected ? 'ring-4 ring-amber-500 border-amber-500 bg-amber-50 z-10 shadow-xl' : ''}`}
            >
              <div className="flex flex-col items-center justify-center md:justify-between md:items-start md:flex-row md:mb-3 min-w-[50px]">
                <div className="flex items-center gap-1">
                  <span className={`text-2xl font-black leading-none ${isToday ? 'text-indigo-600' : isFestivo ? 'text-red-600' : isWeekend ? 'text-slate-400' : 'text-gray-300'}`}>{date.getDate()}</span>
                  {noteDates.includes(date.toDateString()) && (
                    <span className="material-symbols-outlined text-amber-500 text-lg">sticky_note_2</span>
                  )}
                  {onCellNoteClick && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onCellNoteClick(date); }}
                      className={`p-0.5 rounded-md transition-all opacity-0 group-hover:opacity-100 ${noteDates.includes(date.toDateString()) ? 'text-amber-500 opacity-100' : 'text-gray-300 hover:text-amber-400'}`}
                      title="Nota"
                    >
                      <span className="material-symbols-outlined text-base">{noteDates.includes(date.toDateString()) ? 'edit_note' : 'note_add'}</span>
                    </button>
                  )}
                </div>
                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">{date.toLocaleDateString('es', {weekday: 'short'})}</span>
                {isFestivo && <span className="hidden md:block w-3 h-3 bg-red-500 rounded-full shadow-sm animate-pulse" title={holiday}></span>}
              </div>
              {events.length > 0 ? (
                <div className="flex-1 space-y-0.5 md:space-y-0.5 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {events.map((ev: CalendarEvent, idx) => {
                    const canDelete = ((ev._kind === 'guardia' && canManageGuardiaType(currentUser, ev.type)) || ((ev._kind === 'libranza' || ev._kind === 'dobla') && canManagePlanningType(currentUser, ev.type)));
                    const badge: { label: string; style: string } | null =
                      ev._kind === 'libranza' ? { label: 'L', style: 'bg-green-600 text-white' } :
                      ev._kind === 'dobla' ? { label: 'R', style: 'bg-orange-600 text-white' } :
                      ev._kind === 'guardia' && ev.type === 'medica' ? { label: 'M', style: 'bg-blue-600 text-white' } :
                      ev._kind === 'guardia' && ev.type === 'enfermeria' ? { label: 'E', style: 'bg-red-600 text-white' } :
                      ev._kind === 'meeting' ? { label: 'MT', style: 'bg-sky-600 text-white' } : null;
                    return (
                    <div key={idx} onClick={(e) => handleEntryClick(e, ev)} className={`px-2.5 py-1.5 md:px-2 md:py-1 rounded-xl text-[13px] md:text-[10px] font-black border leading-tight transition-all relative flex items-start gap-1.5 shadow-sm ${getEventStyle(ev)} ${canDelete && !swapMode && !bulkMode ? 'cursor-pointer active:scale-[0.97] hover:brightness-110' : ''} ${swapMode ? 'cursor-pointer hover:brightness-110 active:scale-95' : ''}`}>
                      {badge && <span className={`text-[9px] md:text-[7px] font-black px-1.5 py-0.5 rounded-md leading-none shrink-0 ${badge.style}`}>{badge.label}</span>}
                      <span className="whitespace-normal flex-1 min-w-0 leading-snug">{ev.personnelName || ev.title}</span>
                    </div>
                    );
                  })}
                </div>
              ) : events.length === 0 && canManageActiveCategory && !swapMode ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">{t('common.libre')}</div>
              ) : null}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 animate-slide-in-up">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <span className={`p-2 rounded-xl text-white ${canManageActiveCategory ? 'bg-emerald-600' : 'bg-orange-600'} material-symbols-outlined`}>{canManageActiveCategory ? 'add_circle' : 'swap_horiz'}</span>
              {canManageActiveCategory ? t('unifiedCalendar.assign') : t('unifiedCalendar.askChange')}
            </h3>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{activeCategory}</p>
                <p className="font-black text-gray-800 text-lg uppercase tracking-tight">{selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <select required value={personnelName} onChange={(e) => setPersonnelName(e.target.value)} className="w-full px-6 py-4 bg-gray-100 border-none rounded-2xl font-black text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500">
                <option value="" disabled>{t('unifiedCalendar.selectProfessional')}</option>
                {availablePersonnel.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors">{t('unifiedCalendar.close')}</button>
                <button type="submit" className={`flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${canManageActiveCategory ? 'bg-emerald-600' : 'bg-orange-600'}`}>{t('unifiedCalendar.confirm')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title={t('unifiedCalendar.removeFromCalendar')}
        message={deleteTarget ? `${t('unifiedCalendar.remove')} ${deleteTarget.personnelName || deleteTarget.title}?` : ''}
        confirmLabel={t('unifiedCalendar.remove')}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget._kind === 'libranza') onDeleteLibranza(deleteTarget.id);
          else if (deleteTarget._kind === 'dobla') onDeleteDobla(deleteTarget.id);
          else if (deleteTarget._kind === 'guardia') onDeleteGuardia(deleteTarget.id);
          else if (deleteTarget._kind === 'vacacion') onDeleteVacacion?.(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
