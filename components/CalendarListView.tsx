import React, { useState, useEffect } from 'react';
import { Meeting, Guardia, Libranza, Dobla, Vacacion } from '../types';
import { ShiftBadge } from './ShiftBadge';
import { useT } from '../lib/i18n';
import { validateDay } from '../lib/calendarValidation';

interface CalendarListViewProps {
  currentMonth: Date;
  guardias: Guardia[];
  libranzas: Libranza[];
  doblas: Dobla[];
  vacaciones: Vacacion[];
  meetings: Meeting[];
  selectedDate: Date | null;
  selectedProfessional: string;
  onSelectDay: (date: Date) => void;
}

interface DayRow {
  date: Date;
  dayOfWeek: string;
  guardias: Guardia[];
  libranzas: Libranza[];
  doblas: Dobla[];
  vacaciones: Vacacion[];
  meetings: Meeting[];
}

function getDayName(dow: number, lang: string): string {
  const es = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const ca = ['Dg', 'Dll', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds'];
  return lang === 'ca' ? ca[dow] : es[dow];
}

function computeStatus(guardias: Guardia[], libranzas: Libranza[], doblas: Dobla[], vacaciones: Vacacion[], meetings: Meeting[]): 'completo' | 'hueco' | 'conflicto' | 'sin-datos' {
  const all = [...guardias, ...libranzas, ...doblas, ...vacaciones];
  if (all.length === 0 && meetings.length === 0) return 'sin-datos';
  if (all.length === 0) return 'hueco';

  const personnelByDay: Record<string, string[]> = {};
  for (const ev of all) {
    if (!ev.personnelName) continue;
    if (!personnelByDay[ev.personnelName]) personnelByDay[ev.personnelName] = [];
    personnelByDay[ev.personnelName].push(ev._kind || ev.type || 'unknown');
  }
  for (const kinds of Object.values(personnelByDay)) {
    if (new Set(kinds).size > 1) return 'conflicto';
  }
  return 'completo';
}

function getStatusConfig(status: string, t: (key: string) => string) {
  switch (status) {
    case 'completo': return { label: t('calendarios.listView.complete'), className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'hueco': return { label: t('calendarios.listView.gap'), className: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'conflicto': return { label: t('calendarios.listView.conflict'), className: 'bg-amber-50 text-amber-700 border-amber-200' };
    default: return { label: t('calendarios.listView.noData'), className: 'bg-gray-50 text-gray-400 border-gray-200' };
  }
}

const weekdaysES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const weekdaysCA = ['Dg', 'Dll', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds'];

export const CalendarListView: React.FC<CalendarListViewProps> = ({
  currentMonth,
  guardias,
  libranzas,
  doblas,
  vacaciones,
  meetings,
  selectedDate,
  selectedProfessional,
  onSelectDay,
}) => {
  const { t, lang } = useT();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const daysInMonth = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const dow = date.getDay();
      const dStr = date.toDateString();
      return {
        date,
        dayOfWeek: getDayName(dow, lang),
        guardias: guardias.filter(g => g.date.toDateString() === dStr),
        libranzas: libranzas.filter(l => l.date.toDateString() === dStr),
        doblas: doblas.filter(d => d.date.toDateString() === dStr),
        vacaciones: vacaciones.filter(v => v.date.toDateString() === dStr),
        meetings: meetings.filter(m => m.date.toDateString() === dStr),
      };
    });
  }, [currentMonth, guardias, libranzas, doblas, vacaciones, meetings, lang]);

  const today = new Date();
  const todayStr = today.toDateString();

  const getPersonnel = (evs: any[]): string => {
    return evs.map(e => e.personnelName || '?').join(', ');
  };

  const renderChips = (row: DayRow) => {
    const allEvents = [
      ...row.guardias.map((g: any) => ({ kind: 'guardia', type: g.type, name: g.personnelName })),
      ...row.libranzas.map((l: any) => ({ kind: 'libranza', type: l.type, name: l.personnelName })),
      ...row.doblas.map((d: any) => ({ kind: 'dobla', type: d.type, name: d.personnelName })),
      ...row.vacaciones.map((v: any) => ({ kind: 'vacacion', type: v.type, name: v.personnelName })),
      ...row.meetings.map((m: any) => ({ kind: 'meeting', type: m.type, name: m.title })),
    ];

    if (allEvents.length === 0) {
      return <span className="text-[10px] text-gray-400 italic">-</span>;
    }

    return (
      <div className="flex flex-wrap gap-0.5">
        {allEvents.map((ev: any, i: number) => {
          const isSelected = selectedProfessional !== 'all' && ev.name === selectedProfessional;
          const isDimmed = selectedProfessional !== 'all' && ev.name !== selectedProfessional;
          return (
            <span
              key={i}
              className={`inline-flex items-center gap-0.5 transition-all ${
                isSelected ? 'ring-1 ring-blue-400 ring-inset' : ''
              } ${isDimmed ? 'opacity-30' : ''}`}
            >
              <ShiftBadge kind={ev.kind} type={ev.type} />
            </span>
          );
        })}
      </div>
    );
  };

  const weekdays = (lang === 'ca' ? weekdaysCA : weekdaysES) as string[];

  return (
    <div className="w-full">
      {/* Contador de asignaciones del profesional filtrado */}
      {selectedProfessional !== 'all' && (
        <div className="mb-3 px-1">
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-[10px] align-middle mr-1">badge</span>
            {selectedProfessional}
          </span>
        </div>
      )}

      {/* Mobile: day cards */}
      {isMobile ? (
        <div className="space-y-2">
          {daysInMonth.map((row: DayRow) => {
            const isToday = row.date.toDateString() === todayStr;
            const isSelected = selectedDate && selectedDate.toDateString() === row.date.toDateString();
            const isWeekend = row.date.getDay() === 0 || row.date.getDay() === 6;
            const status = computeStatus(row.guardias, row.libranzas, row.doblas, row.vacaciones, row.meetings);
            const statusConfig = getStatusConfig(status, t);
            const validation = validateDay(row.date, row.guardias, row.libranzas, row.doblas, row.vacaciones, row.meetings);
            const hasSelectedProfessional = selectedProfessional !== 'all';
            const dayHasProf = [...row.guardias, ...row.libranzas, ...row.doblas, ...row.vacaciones].some(e => e.personnelName === selectedProfessional);
            const allRowEvents = [
              ...row.guardias.map(g => ({ kind: 'guardia' as const, type: g.type, name: g.personnelName })),
              ...row.libranzas.map(l => ({ kind: 'libranza' as const, type: l.type, name: l.personnelName })),
              ...row.doblas.map(d => ({ kind: 'dobla' as const, type: d.type, name: d.personnelName })),
              ...row.vacaciones.map(v => ({ kind: 'vacacion' as const, type: v.type, name: v.personnelName })),
              ...row.meetings.map(m => ({ kind: 'meeting' as const, type: m.type, name: m.title })),
            ];

            if (hasSelectedProfessional && !dayHasProf) return null;

            return (
              <div
                key={row.date.toISOString()}
                onClick={() => onSelectDay(row.date)}
                className={`bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm cursor-pointer hover:bg-blue-25 active:bg-blue-50 transition-colors ${
                  isWeekend ? 'bg-gray-50/50' : ''
                } ${isSelected ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' : 'text-gray-800'}`}>
                      {row.date.getDate()}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${isWeekend ? 'text-red-400' : 'text-gray-400'}`}>
                      {weekdays[row.date.getDay()]}
                    </span>
                    <span className="text-[9px] text-gray-300">{row.date.toLocaleDateString(lang === 'ca' ? 'ca' : 'es', { month: 'short' })}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full leading-none ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                </div>
                {allRowEvents.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {allRowEvents.map((ev, i) => (
                      <span key={i} className="inline-flex items-center gap-0.5">
                        <ShiftBadge kind={ev.kind} type={ev.type} />
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-300 italic">-</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (<>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t('common.viewList')}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {t('calendarios.date') || 'Fecha'}
                </th>
                <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider w-10">
                  {t('common.day') || 'Día'}
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {t('calendarListView.medicina')}
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {t('calendarListView.enfermeria')}
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {t('calendarListView.libranzas')}
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {t('calendarListView.refuerzos')}
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {t('calendarListView.vac')}
                </th>
                <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider w-20">
                  {t('calendarListView.status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {daysInMonth.map((row: DayRow) => {
                const isToday = row.date.toDateString() === todayStr;
                const isSelected = selectedDate && selectedDate.toDateString() === row.date.toDateString();
                const isWeekend = row.date.getDay() === 0 || row.date.getDay() === 6;
const status = computeStatus(row.guardias, row.libranzas, row.doblas, row.vacaciones, row.meetings);
                 const statusConfig = getStatusConfig(status, t);
                 const validation = validateDay(row.date, row.guardias, row.libranzas, row.doblas, row.vacaciones, row.meetings);
                const hasSelectedProfessional = selectedProfessional !== 'all';
                const dayHasProf = [
                  ...row.guardias,
                  ...row.libranzas,
                  ...row.doblas,
                  ...row.vacaciones
                ].some(e => e.personnelName === selectedProfessional);

                return (
                  <tr
                    key={row.date.toISOString()}
                    onClick={() => onSelectDay(row.date)}
                    className={`cursor-pointer hover:bg-blue-25 active:bg-blue-50 transition-colors group ${
                      isWeekend ? 'bg-gray-50/50' : ''
                    } ${isSelected ? 'bg-blue-50 ring-1 ring-blue-300' : ''} ${
                      hasSelectedProfessional && !dayHasProf ? 'opacity-30' : ''
                    }`}
                  >
                    {/* Fecha */}
                    <td className="px-3 py-2 border-b border-gray-100 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${isToday ? 'bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs' : 'text-gray-800'}`}>
                        {row.date.getDate()}
                        <span className="text-[9px] text-gray-400 ml-0.5 font-normal">{row.date.toLocaleDateString(lang === 'ca' ? 'ca' : 'es', { month: 'short' })}</span>
                      </span>
                    </td>

                    {/* Día de la semana */}
                    <td className="px-3 py-2 border-b border-gray-100 text-center">
                      <span className={`text-[10px] font-bold uppercase ${
                        row.date.getDay() === 0 ? 'text-red-500' : row.date.getDay() === 6 ? 'text-orange-500' : 'text-gray-500'
                      }`}>
                        {weekdays[row.date.getDay()]}
                      </span>
                    </td>

{/* Medicina */}
                     <td className="px-3 py-2 border-b border-gray-100">
                       <div className="flex flex-wrap gap-0.5">
                         {row.guardias.filter((g: any) => g.type === 'medica').map((g: any, i: number) => (
                           <span key={i} className="inline-flex items-center gap-0.5" title={g.personnelName}>
                             <ShiftBadge kind="guardia" type="medica" />
                             <span className="text-[9px] font-medium">{g.personnelName}</span>
                           </span>
                         ))}
                       </div>
                     </td>

                     {/* Enfermería */}
                     <td className="px-3 py-2 border-b border-gray-100">
                       <div className="flex flex-wrap gap-0.5">
                         {row.guardias.filter((g: any) => g.type === 'enfermeria').map((g: any, i: number) => (
                           <span key={i} className="inline-flex items-center gap-0.5" title={g.personnelName}>
                             <ShiftBadge kind="guardia" type="enfermeria" />
                             <span className="text-[9px] font-medium">{g.personnelName}</span>
                           </span>
                         ))}
                       </div>
                     </td>

                     {/* Libranzas */}
                     <td className="px-3 py-2 border-b border-gray-100">
                       <div className="flex flex-wrap gap-0.5">
                         {row.libranzas.map((l: any, i: number) => (
                           <span key={i} className="inline-flex items-center gap-0.5" title={l.personnelName}>
                             <ShiftBadge kind="libranza" type={l.type} />
                             <span className="text-[9px] font-medium">{l.personnelName}</span>
                           </span>
                         ))}
                       </div>
                     </td>

                     {/* Refuerzos (Doblas) */}
                     <td className="px-3 py-2 border-b border-gray-100">
                       <div className="flex flex-wrap gap-0.5">
                         {row.doblas.map((d: any, i: number) => (
                           <span key={i} className="inline-flex items-center gap-0.5" title={d.personnelName}>
                             <ShiftBadge kind="dobla" type={d.type} />
                             <span className="text-[9px] font-medium">{d.personnelName}</span>
                           </span>
                         ))}
                       </div>
                     </td>

                     {/* Vacaciones */}
                     <td className="px-3 py-2 border-b border-gray-100">
                       <div className="flex flex-wrap gap-0.5">
                         {row.vacaciones.map((v: any, i: number) => (
                           <span key={i} className="inline-flex items-center gap-0.5" title={v.personnelName}>
                             <ShiftBadge kind="vacacion" type={v.type} />
                             <span className="text-[9px] font-medium">{v.personnelName}</span>
                           </span>
                         ))}
</div>
                      </td>

{/* Estado */}
                     <td className="px-3 py-2 border-b border-gray-100 text-center">
                       {(function() {
                          if (validation.hasConflict) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 leading-none">{t('calendarListView.conflictBadge')}</span>;
                         if (validation.hasWarning) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 leading-none">{statusConfig.label}</span>;
                         return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${statusConfig.className}`}>{statusConfig.label}</span>;
                       })()}
                     </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>)}
    </div>
  );
};