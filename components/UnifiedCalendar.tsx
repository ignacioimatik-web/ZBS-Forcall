
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Meeting, MeetingType, Guardia, User, Libranza, Dobla, Vacacion } from '../types';
import { getHolidayName } from '../utils';
import { canManageGuardiaCategory, canManageGuardiaType, canManagePlanningType, canManageVacaciones } from '../lib/guardiaPermissions';
import { ConfirmationModal } from './ConfirmationModal';
import { ShiftBadge } from './ShiftBadge';
import { useT } from '../lib/i18n';
import { USERS } from '../lib/users';
import { validateMonth } from '../lib/calendarValidation';

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
  hideMonthNav?: boolean;
  id?: string;
  currentMonth?: Date;
  onMonthChange?: (month: Date) => void;
  noteDates?: string[];
  onCellNoteClick?: (date: Date) => void;
  onSelectDay?: (date: Date) => void;
  onProfessionalChange?: (professional: string) => void;
}

export const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({ 
  meetings, guardias, libranzas = [], doblas = [], vacaciones = [],
  onAddGuardia, onDeleteGuardia, onAddLibranza, onDeleteLibranza, onAddDobla, onDeleteDobla,
  onAddVacacion, onDeleteVacacion,
  onSwapEvents, currentUser, activeCategory = 'Todo',
  availablePersonnel = [], bulkMode = false, selectedBulkDates = [], onToggleBulkDate,
  swapMode = false, onCancelSwap, hideHeader = false, hideMonthNav = false, id = "calendar-container", isReadOnly = false,
  currentMonth: externalMonth, onMonthChange, getPersonnelType, noteDates = [], onCellNoteClick, onSelectDay, onProfessionalChange
}) => {
  const { t } = useT();
  const [internalMonth, setInternalMonth] = useState(new Date());
  const currentMonth = externalMonth ?? internalMonth;
  const setCurrentMonth = (m: Date) => {
    onMonthChange?.(m);
    if (!externalMonth) setInternalMonth(m);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [personnelName, setPersonnelName] = useState('');
  const [firstSwapTarget, setFirstSwapTarget] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [slideEpoch, setSlideEpoch] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const threshold = 50;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      changeMonth(dx > 0 ? -1 : 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

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

  const allProfessionals = useMemo(() => {
    return USERS
      .filter(u => u.category !== 'Administrativos')
      .map(u => u.name)
      .sort((a, b) => a.localeCompare(b));
  }, []);

  const professionalMonthCount = useMemo(() => {
    if (selectedProfessional === 'all') return 0;
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    const all = [...guardias, ...libranzas, ...doblas, ...vacaciones] as { personnelName: string; date: Date }[];
    return all.filter(ev => ev.personnelName === selectedProfessional && ev.date.getMonth() === month && ev.date.getFullYear() === year).length;
  }, [selectedProfessional, currentMonth, guardias, libranzas, doblas, vacaciones]);

const startingEmptyCells = useMemo(() => {
     const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
     return firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
   }, [currentMonth]);

   const monthValidations = useMemo(() => {
     return validateMonth(currentMonth, guardias, libranzas, doblas, vacaciones, meetings);
   }, [currentMonth, guardias, libranzas, doblas, vacaciones, meetings]);

   const getValidationForDay = (date: Date) => {
     return monthValidations.find(v => v.date === date.toDateString()) || null;
   };

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
    if (firstSwapTarget?.id === ev.id) return 'bg-indigo-100 text-indigo-900 border-indigo-300 ring-2 ring-indigo-300 z-50';
    
    if (ev._kind === 'libranza') {
      const base = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      return ev.isChange ? `${base} ring-2 ring-amber-300` : base;
    }
    if (ev._kind === 'dobla') {
      const base = 'bg-orange-50 text-orange-800 border-orange-200';
      return ev.isChange ? `${base} ring-2 ring-amber-300` : base;
    }
    if (ev._kind === 'meeting') {
      return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    if (ev._kind === 'vacacion') {
      return 'bg-violet-50 text-violet-800 border-violet-200';
    }
    
    if (ev.type === 'medica') {
      const base = 'bg-blue-50 text-blue-800 border-blue-200';
      return ev.isChange ? `${base} ring-2 ring-amber-300` : base;
    }
    if (ev.type === 'enfermeria') {
      const base = 'bg-rose-50 text-rose-800 border-rose-200';
      return ev.isChange ? `${base} ring-2 ring-amber-300` : base;
    }
    
    return 'bg-gray-50 text-gray-800 border-gray-200';
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
    onSelectDay?.(date);
    if (swapMode) return;
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

  const filteredMonthEvents = useMemo(() => {
    if (selectedProfessional === 'all') return null;
    const m = currentMonth.getMonth();
    const y = currentMonth.getFullYear();
    const all = [...guardias, ...libranzas, ...doblas, ...vacaciones] as { personnelName: string; date: Date }[];
    return all.filter(ev => ev.personnelName === selectedProfessional && ev.date.getMonth() === m && ev.date.getFullYear() === y);
  }, [selectedProfessional, currentMonth, guardias, libranzas, doblas, vacaciones]);
  const hasFilterNoResults = selectedProfessional !== 'all' && filteredMonthEvents && filteredMonthEvents.length === 0;

  const changeMonth = (offset: number) => {
    setSlideDirection(offset > 0 ? 'right' : 'left');
    setSlideEpoch(prev => prev + 1);
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(next);
  };

  return (
    <>
      <style>{`
        @keyframes slideFromRight { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideFromLeft { from { transform: translateX(-24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .anim-from-right { animation: slideFromRight 280ms cubic-bezier(0.16, 1, 0.3, 1); }
        .anim-from-left { animation: slideFromLeft 280ms cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
      <div className="flex items-stretch gap-0 md:gap-1">
        {!isMobile && (
          <button onClick={() => changeMonth(-1)} aria-label="Mes anterior"
            className="flex flex-col items-center justify-center w-9 md:w-11 rounded-2xl bg-white border border-gray-200 shadow-sm text-gray-300 hover:text-forcall-600 hover:border-forcall-200 hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg md:text-xl">chevron_left</span>
          </button>
        )}
        <div id={id} className="relative group w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden" style={{ touchAction: 'pan-y' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200 no-print sticky top-0 z-40 gap-3">
          {!hideMonthNav && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => changeMonth(-1)} aria-label="Mes anterior" className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><span className="material-symbols-outlined text-gray-400">chevron_left</span></button>
              <div className="flex flex-col items-center min-w-[120px] sm:min-w-[180px]">
                <h2 className="text-sm md:text-lg font-black text-gray-800 uppercase tracking-tighter text-center leading-none">
                  {currentMonth.toLocaleDateString('es-ES', { month: 'long' })}
                </h2>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentMonth.getFullYear()}</span>
              </div>
              <button onClick={() => changeMonth(1)} aria-label="Mes siguiente" className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><span className="material-symbols-outlined text-gray-400">chevron_right</span></button>
              <button onClick={() => setCurrentMonth(new Date())} aria-label="Ir al mes actual" className="ml-2 px-3 py-1.5 bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest border border-gray-100 rounded-lg hover:bg-gray-100">{t('common.hoy')}</button>
            </div>
          )}
          <div className="flex items-center gap-2">
            {selectedProfessional !== 'all' && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1.5 rounded-lg hidden sm:flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">badge</span>
                {professionalMonthCount} asignaciones
              </span>
            )}
            <div className="relative">
              <select
                value={selectedProfessional}
                onChange={(e) => { setSelectedProfessional(e.target.value); onProfessionalChange?.(e.target.value); }}
                aria-label="Filtrar por profesional"
                className="appearance-none text-[10px] font-bold bg-gray-50 border border-gray-200 rounded-lg pl-2 pr-6 py-1.5 text-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none cursor-pointer hover:bg-gray-100 transition-colors min-w-[90px] sm:min-w-[120px]"
              >
                <option value="all">Todos los profesionales</option>
                {allProfessionals.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-sm text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
            </div>
             {swapMode && (
                <button onClick={() => { setFirstSwapTarget(null); onCancelSwap?.(); }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95">{t('unifiedCalendar.cancelSwap')}</button>
             )}
              <span className={`text-[10px] font-black px-4 py-2 rounded-xl border ${(canManageActiveCategory || isGuardiaCategory) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                {(canManageActiveCategory || isGuardiaCategory) ? t('common.gestion') : t('common.consulta')}
              </span>
          </div>
        </div>
      )}

      <div key={slideEpoch} className={slideEpoch > 0 ? (slideDirection === 'right' ? 'anim-from-right' : 'anim-from-left') : ''}>
      <div className="hidden md:grid md:grid-cols-7 bg-gray-50 border-b border-gray-200">
        {[t('unifiedCalendar.mon'), t('unifiedCalendar.tue'), t('unifiedCalendar.wed'), t('unifiedCalendar.thu'), t('unifiedCalendar.fri'), t('unifiedCalendar.sat'), t('unifiedCalendar.sun')].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider py-2.5 border-r border-gray-200 last:border-r-0">{d}</div>
        ))}
      </div>
      {hasFilterNoResults && (
        <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
          <span className="material-symbols-outlined text-lg">info</span>
          <span className="text-sm font-medium">No hay asignaciones de {selectedProfessional} en este mes.</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 md:gap-0">

        {Array.from({ length: startingEmptyCells }).map((_, i) => (
          <div key={`empty-${i}`} className="hidden md:block min-h-[130px] bg-gray-50/50 border-b border-r border-gray-100" />
        ))}
{daysInMonth.map((date, i) => {
           const { events, holiday } = getEventsForDay(date);
           const isToday = new Date().toDateString() === date.toDateString();
           const isSelected = selectedBulkDates?.some(d => d.toDateString() === date.toDateString());
           const isWeekend = date.getDay() === 0 || date.getDay() === 6;
           const isFestivo = !!holiday;
           const validation = getValidationForDay(date);
           const hasError = validation && validation.hasOverlap;
           const hasWarning = validation && validation.hasWarning;
          
            if (events.length === 0 && !canManageActiveCategory && !bulkMode) {
             if (isMobile) return (
<div key={i} className="flex md:hidden items-center gap-3 px-4 py-2 border-b border-gray-100 bg-white" onClick={() => handleCellClick(date)}>
                <span className={`text-sm font-semibold w-7 shrink-0 ${isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : isFestivo ? 'text-red-500' : isWeekend ? 'text-gray-400' : 'text-gray-700'}`}>{date.getDate()}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-10 shrink-0">{date.toLocaleDateString('es', {weekday: 'short'})}</span>
                <span className="text-[10px] text-gray-300 italic">—</span>
              </div>
            );
            return (
<div key={i} className={`hidden md:flex flex-col items-center pt-3 pb-2 border-b border-r border-gray-100 min-h-[130px] bg-white ${canManageActiveCategory ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => handleCellClick(date)}>
                 <div className="flex items-center gap-1">
<span className={`text-sm font-semibold leading-none ${isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : isFestivo ? 'text-red-500' : isWeekend ? 'text-gray-400' : 'text-gray-700'}`}>{date.getDate()}</span>
                    {hasError && <span className="material-symbols-outlined text-[10px] text-red-500" title="Conflicto">warning</span>}
                    {hasWarning && !hasError && <span className="material-symbols-outlined text-[10px] text-amber-500" title="Aviso">error_outline</span>}
                  {noteDates.includes(date.toDateString()) && (
                    <span className="material-symbols-outlined text-amber-500 text-base">sticky_note_2</span>
                  )}
                  {onCellNoteClick && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onCellNoteClick(date); }}
                      className={`p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 ${noteDates.includes(date.toDateString()) ? 'text-amber-500 opacity-100' : 'text-gray-300 hover:text-amber-400'}`}
                      aria-label={noteDates.includes(date.toDateString()) ? 'Editar nota' : 'Añadir nota'}
                    >
                      <span className="material-symbols-outlined text-sm">{noteDates.includes(date.toDateString()) ? 'edit_note' : 'note_add'}</span>
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
              className={`flex md:flex-col gap-1 md:gap-2 p-2 md:p-3 border-b border-r border-gray-100 relative group md:min-h-[130px] bg-white transition-colors
                ${isToday ? 'bg-blue-50/40' : ''} 
                ${isFestivo ? 'bg-red-50/20' : ''} 
                ${canManageActiveCategory && !swapMode ? 'cursor-pointer hover:bg-gray-50' : ''} 
                ${isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50 z-10' : ''}`}
            >
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-semibold leading-none ${isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : isFestivo ? 'text-red-500' : isWeekend ? 'text-gray-400' : 'text-gray-700'}`}>{date.getDate()}</span>
                  {noteDates.includes(date.toDateString()) && (
                    <span className="material-symbols-outlined text-amber-500 text-base ml-0.5">sticky_note_2</span>
                  )}
                  {onCellNoteClick && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onCellNoteClick(date); }}
                      className={`p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 ${noteDates.includes(date.toDateString()) ? 'text-amber-500 opacity-100' : 'text-gray-300 hover:text-amber-400'}`}
                      aria-label={noteDates.includes(date.toDateString()) ? 'Editar nota' : 'Añadir nota'}
                    >
                      <span className="material-symbols-outlined text-sm">{noteDates.includes(date.toDateString()) ? 'edit_note' : 'note_add'}</span>
                    </button>
                  )}
                </div>
                <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase tracking-wider">{date.toLocaleDateString('es', {weekday: 'short'})}</span>
                {isFestivo && <span className="hidden md:block w-2 h-2 bg-red-400 rounded-full" title={holiday}></span>}
              </div>
              {events.length > 0 ? (
                <div className="flex-1 space-y-0.5 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {events.slice(0, isMobile ? 2 : 4).map((ev: CalendarEvent, idx) => {
                    const canDelete = ((ev._kind === 'guardia' && canManageGuardiaType(currentUser, ev.type)) || ((ev._kind === 'libranza' || ev._kind === 'dobla') && canManagePlanningType(currentUser, ev.type)));
                    const chipStyle = getEventStyle(ev);
                    const isInteractive = canDelete && !swapMode && !bulkMode;
                    return (
<button key={idx} onClick={(e) => handleEntryClick(e, ev)} title={`${ev._kind === 'guardia' ? 'Guardia' : ev._kind === 'libranza' ? 'Libranza' : ev._kind === 'dobla' ? 'Refuerzo' : ev._kind === 'meeting' ? 'Reunión' : 'Vacaciones'}: ${ev.personnelName || ev.title}`} className={`w-full text-left h-[26px] px-1.5 rounded-lg text-[10px] font-semibold border leading-none flex items-center gap-0.5 transition-all hover:brightness-97 active:scale-[0.98] ${chipStyle} ${isInteractive ? 'cursor-pointer' : ''} ${swapMode ? 'cursor-pointer active:scale-95' : ''} ${selectedProfessional !== 'all' ? (ev.personnelName === selectedProfessional ? 'ring-2 ring-blue-400 ring-inset' : 'opacity-35') : ''}`} aria-label={`${ev._kind === 'guardia' ? 'Guardia' : ev._kind === 'libranza' ? 'Libranza' : ev._kind === 'dobla' ? 'Refuerzo' : ev._kind === 'meeting' ? 'Reunión' : 'Vacaciones'}: ${ev.personnelName || ev.title}`}>
                       <ShiftBadge kind={ev.kind} type={ev.type} />
                       <span className="flex-auto overflow-hidden">{ev.personnelName || ev.title}</span>
                     </button>
                    );
                  })}
                  {events.length > (isMobile ? 2 : 4) && (
                    <div className="h-[26px] px-2 rounded-lg text-[10px] font-bold text-gray-400 flex items-center justify-center border border-dashed border-gray-200">
                      +{events.length - (isMobile ? 2 : 4)} m&aacute;s
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
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

        {!isMobile && (
          <button onClick={() => changeMonth(1)} aria-label="Mes siguiente"
            className="flex flex-col items-center justify-center w-9 md:w-11 rounded-2xl bg-white border border-gray-200 shadow-sm text-gray-300 hover:text-forcall-600 hover:border-forcall-200 hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg md:text-xl">chevron_right</span>
          </button>
        )}
      </div>
    </>
  );
};
