import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { UnifiedCalendar } from './UnifiedCalendar';
import { Meeting, User, Guardia, Libranza, Dobla, Vacacion, ManualHoliday, AuditLog } from '../types';
import { downloadCalendarPDF, PDFCalendarData } from '../lib/pdfExport';
import { generateICS, downloadICS } from '../lib/calendarExport';
import { NotificationToast } from './NotificationToast';
import { canManageGuardiaCategory, canManagePlanningType, canManageVacaciones } from '../lib/guardiaPermissions';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { useT } from '../lib/i18n';
import { PageHeader } from './PageHeader';
import { StatusSummary } from './StatusSummary';
import { CalendarToolbar } from './CalendarToolbar';
import { DayDetailPanel } from './DayDetailPanel';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VERSION_STRING } from '../lib/version';

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
  activeSub: 'Medicina' | 'enfermeria' | 'Libranzas' | 'Refuerzo' | 'Vacaciones';
  onSubCategoryChange: (sub: 'Medicina' | 'enfermeria' | 'Libranzas' | 'Refuerzo' | 'Vacaciones') => void;
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
  const { t } = useT();
  const { guardias, libranzas, doblas, vacaciones, meetings } = props;

  function getUserGroup(): 'medico' | 'enfermeria' | 'both' {
    if (!props.user || props.user.role === 'Administrador') return 'both';
    if (props.user.staffGroup === 'medico') return 'medico';
    if (props.user.staffGroup === 'enfermeria') return 'enfermeria';
    if (props.user.role === 'Medico' || props.user.role === 'Coordinador') return 'medico';
    if (props.user.role === 'enfermera') return 'enfermeria';
    return 'both';
  }

  const userGroup = getUserGroup();
  const activeSub = props.activeSub;
  const [bulkPersonnel, setBulkPersonnel] = useState<string | null>(null);
  const [bulkDates, setBulkDates] = useState<Date[]>([]);
  const { logs: auditLogs, addLog, deleteLog } = useAuditLogs();
  const [swapMode, setSwapMode] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const doctors = ["Elena Benages", "Delia Mestre", "Frank Castillo", "Fernando Sierra", "Jorge Ramón", "Ilie Popov", "Externo/a Medicina"];
  const nurses = ["Xelo García", "Yolanda Lainez", "Maite Beltrán", "Yolanda García", "Rosa Carbó", "Externo/a Enfermeria"];
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

  const hasLoggedRef = useRef(false);
  useEffect(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    addLog({ 
      type: 'VALIDACION', 
      user: 'Sistema', 
      description: t('calendarios.sessionStart'), 
      category: activeSub 
    });
  }, [addLog]);

  const toggleBulkDate = (date: Date) => {
    setBulkDates(prev => prev.find(d => d.toDateString() === date.toDateString()) ? prev.filter(d => d.toDateString() !== date.toDateString()) : [...prev, date]);
  };

  const handleSaveBulk = async () => {
    if (!bulkPersonnel || bulkDates.length === 0 || !canManageActiveCategory) return;
    const isNurse = nurses.includes(bulkPersonnel);
    const personnelType = isNurse ? 'enfermeria' : 'medica';
    const results = await Promise.allSettled(bulkDates.map(async date => {
      const common = { id: Math.random().toString(36).substr(2, 9), date, personnelName: bulkPersonnel, isChange: false, modifiedBy: props.user?.id || null, modifiedAt: new Date() };
      if (activeSub === 'Medicina') return props.onAddGuardia({ ...common, type: 'medica' });
      if (activeSub === 'enfermeria') return props.onAddGuardia({ ...common, type: 'enfermeria' });
      if (activeSub === 'Libranzas') return props.onAddLibranza({ ...common, id: 'lib-' + common.id, type: personnelType });
      if (activeSub === 'Refuerzo') return props.onAddDobla({ ...common, id: 'dob-' + common.id, type: personnelType });
      if (activeSub === 'Vacaciones') return props.onAddVacacion({ ...common, id: 'vac-' + common.id, type: personnelType });
    }));
    const failed = results.filter(r => r.status === 'rejected').length;
    addLog({ type: 'CAMBIO', user: props.user?.name || 'Usuario', description: failed === 0
      ? `${t('calendarios.bulkSuccess')}: ${bulkPersonnel} (${bulkDates.length} ${t('calendarios.bulkSuccess')}) en ${activeSub}.`
      : `${t('calendarios.bulkError')}: ${bulkPersonnel} (${failed}/${bulkDates.length} ${t('calendarios.bulkError')}) en ${activeSub}.`,
      category: activeSub });
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
      description: `${t('calendarios.swapConfirmed')} ${p1} y ${p2}.`, 
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
    doc.text(`${VERSION_STRING} — Registro de Permutas`, 10, doc.internal.pageSize.getHeight() - 7);
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
    const targetGuardias = userGroup !== 'both' ? guardias.filter(g => g.type === userTypeFilter) : guardias;
    if (activeSub === 'Medicina') {
      targetGuardias.filter(g => g.type === 'medica').forEach(g => {
        entries.push({ date: g.date, personnel: [g.personnelName], type: g.type, kind: 'M' });
      });
    } else if (activeSub === 'enfermeria') {
      targetGuardias.filter(g => g.type === 'enfermeria').forEach(g => {
        entries.push({ date: g.date, personnel: [g.personnelName], type: g.type, kind: 'E' });
      });
    } else if (activeSub === 'Libranzas') {
      filteredLibranzas.forEach(l => {
        entries.push({ date: l.date, personnel: [l.personnelName], type: l.type, kind: 'L' });
      });
    } else if (activeSub === 'Refuerzo') {
      filteredDoblas.forEach(d => {
        entries.push({ date: d.date, personnel: [d.personnelName], type: d.type, kind: 'R' });
      });
    } else if (activeSub === 'Vacaciones') {
      filteredVacaciones.forEach(v => {
        entries.push({ date: v.date, personnel: [v.personnelName], type: v.type, kind: 'V' });
      });
    }
    const data: PDFCalendarData = {
      title: `Calendario ${activeSub} Forcall`,
      subtitle: `${currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      month,
      year,
      entries,
    };
    const filename = `Calendario_${activeSub}_Forcall_${currentMonth.toLocaleDateString('es-ES', { month: 'long' })}.pdf`;
    try {
      downloadCalendarPDF(data, filename);
      setDownloadMsg(t('calendarios.pdfDownloaded'));
    } catch (e) {
      setDownloadMsg(t('calendarios.pdfError'));
    } finally {
      setIsDownloading(false);
    }
  };

  const permutaHistory = useMemo(() => auditLogs.filter(log => log.type === 'PERMUTA'), [auditLogs]);

  const canWriteNotes = props.user?.name === 'Xelo García' || props.user?.name === 'Elena Benages';
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('zbs_planning_notes') || '{}'); }
    catch { return {}; }
  });
  const [noteModalDate, setNoteModalDate] = useState<Date | null>(null);
  const [noteText, setNoteText] = useState('');

  const saveNote = (date: Date, text: string) => {
    const key = date.toDateString();
    const updated = { ...notes };
    if (text.trim()) {
      updated[key] = text.trim();
    } else {
      delete updated[key];
    }
    setNotes(updated);
    localStorage.setItem('zbs_planning_notes', JSON.stringify(updated));
  };

  const noteDates = useMemo(() => {
    if (!isPlanningCategory) return [];
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    return Object.keys(notes).filter(k => {
      const d = new Date(k);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [notes, isPlanningCategory, currentMonth]);

  const userTypeFilter = userGroup === 'medico' ? 'medica' : userGroup;
  const filteredLibranzas = useMemo(() => userGroup !== 'both' ? libranzas.filter(l => l.type === userTypeFilter) : libranzas, [libranzas, userGroup]);
  const filteredDoblas = useMemo(() => userGroup !== 'both' ? doblas.filter(d => d.type === userTypeFilter) : doblas, [doblas, userGroup]);
  const filteredVacaciones = useMemo(() => userGroup !== 'both' ? vacaciones.filter(v => v.type === userTypeFilter) : vacaciones, [vacaciones, userGroup]);

  const metrics = [
    { count: guardias.filter(g => g.type === 'medica').length, label: t('dashboard.med'), accentColor: 'bg-blue-500' },
    { count: guardias.filter(g => g.type === 'enfermeria').length, label: t('dashboard.enf'), accentColor: 'bg-red-500' },
    { count: libranzas.length, label: t('dashboard.lib'), accentColor: 'bg-green-500' },
    { count: vacaciones.length, label: t('dashboard.vac'), accentColor: 'bg-purple-400' },
    { count: doblas.length, label: t('dashboard.ref'), accentColor: 'bg-orange-500' },
  ];

  const statusSummary = useMemo(() => {
    const year = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const totalDays = new Date(year, m + 1, 0).getDate();
    const coveredSet = new Set<string>();
    const dayPersonnel: Record<string, string[]> = {};
    const allEvents = [...guardias, ...libranzas, ...doblas, ...meetings];
    for (const ev of allEvents) {
      if (ev.date.getMonth() === m && ev.date.getFullYear() === year) {
        coveredSet.add(ev.date.toDateString());
        const key = ev.date.toDateString();
        if (!dayPersonnel[key]) dayPersonnel[key] = [];
        if (ev.personnelName) dayPersonnel[key].push(ev.personnelName);
      }
    }
    let gaps = 0;
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, m, day);
      const dow = date.getDay();
      if (dow >= 1 && dow <= 5 && !coveredSet.has(date.toDateString())) gaps++;
    }
    let conflicts = 0;
    for (const personnel of Object.values(dayPersonnel)) {
      if (new Set(personnel).size !== personnel.length) conflicts++;
    }
    return { totalDays, coveredDays: coveredSet.size, gaps, conflicts };
  }, [currentMonth, guardias, libranzas, doblas, meetings]);

  const handleSelectDay = useCallback((date: Date) => {
    setSelectedDate(prev => {
      if (prev && prev.toDateString() === date.toDateString()) return null;
      return date;
    });
  }, []);

  return (
    <div className="animate-fade-in pb-12">
      <PageHeader
        title="Cuadrante de Guardias"
        subtitle="Gesti&oacute;n y planificaci&oacute;n de equipos"
        metrics={metrics}
      />

      <div className="space-y-4">
        <StatusSummary
          totalDays={statusSummary.totalDays}
          coveredDays={statusSummary.coveredDays}
          gaps={statusSummary.gaps}
          conflicts={statusSummary.conflicts}
          pendingValidation={null}
        />

        <CalendarToolbar
          currentMonth={currentMonth}
          onPrevMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          onToday={() => setCurrentMonth(new Date())}
          onDownloadPDF={handleDownloadActiveCalendar}
          downloadLabel={t('calendarios.downloadCalendar')}
          onPrint={() => window.print()}
        />

        {/* Tools bar: swap mode, professional selector, bulk assign */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            {props.user?.role !== 'Administrador' && (
              <button
                onClick={() => { setSwapMode(!swapMode); setBulkPersonnel(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  swapMode
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm animate-pulse'
                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{swapMode ? 'sync_alt' : 'swap_calls'}</span>
                {swapMode ? t('calendarios.swapActive') : t('calendarios.askSwap')}
              </button>
            )}

            <select
              value={bulkPersonnel || ''}
              disabled={swapMode || !canManageActiveCategory}
              onChange={(e) => { setBulkPersonnel(e.target.value); setBulkDates([]); }}
              className="flex-1 min-w-[140px] px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer hover:bg-gray-100"
            >
              <option value="">{t('calendarios.selectProfessional')}</option>
              {currentPersonnel.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {bulkPersonnel && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 whitespace-nowrap">
                  {bulkDates.length === 0
                    ? `${t('calendarios.tapDays')} ${bulkPersonnel}`
                    : `${bulkDates.length} ${t('calendarios.daysSelected')}`
                  }
                </span>
                {bulkDates.length > 0 && (
                  <button
                    onClick={handleSaveBulk}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-black transition-colors active:scale-95"
                  >
                    {t('calendarios.confirmAssignment')}
                  </button>
                )}
              </div>
            )}

            {props.user && (
              <button
                onClick={handleDownloadUserCalendar}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
                title={t('calendarios.downloadMyCalendar')}
              >
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                ICS
              </button>
            )}
          </div>

          {!canManageActiveCategory && (
            <div className="mt-2">
              {isGuardiaCategory && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[10px] text-amber-900 font-bold text-center">
                  {t('calendarios.coordOnlyGuardias')}
                </div>
              )}
              {isPlanningCategory && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[10px] text-amber-900 font-bold text-center">
                  {t('calendarios.elenaXeloPlanning')}
                </div>
              )}
              {isVacacionesCategory && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[10px] text-amber-900 font-bold text-center">
                  {t('calendarios.elenaXeloVacaciones')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 px-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('legend.title')}:</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600"><span className="w-3 h-3 rounded-sm bg-blue-600" /> {t('legend.medicina')}</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600"><span className="w-3 h-3 rounded-sm bg-rose-600" /> {t('legend.enfermeria')}</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600"><span className="w-3 h-3 rounded-sm bg-emerald-600" /> {t('legend.libranza')}</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600"><span className="w-3 h-3 rounded-sm bg-orange-600" /> {t('legend.refuerzo')}</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600"><span className="w-3 h-3 rounded-sm bg-violet-600" /> {t('legend.vacaciones')}</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600"><span className="w-3 h-3 rounded-sm bg-sky-600" /> {t('legend.reunion')}</span>
        </div>

        {/* Main layout: calendar + day detail panel */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1 min-w-0 -mx-4 md:mx-0">
            {(activeSub === 'Libranzas' || activeSub === 'Refuerzo' || activeSub === 'Vacaciones') && userGroup !== 'both' && (
              <div className="mb-4 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                  {t('calendarios.showingOnly')} {userGroup === 'medico' ? t('calendarios.medicina') : t('calendarios.enfermeria')}
                </span>
              </div>
            )}
            <UnifiedCalendar
              key={activeSub}
              meetings={meetings}
              guardias={guardias}
              libranzas={filteredLibranzas}
              doblas={filteredDoblas}
              vacaciones={filteredVacaciones}
              onAddGuardia={props.onAddGuardia}
              onDeleteGuardia={props.onDeleteGuardia}
              onAddLibranza={props.onAddLibranza}
              onDeleteLibranza={props.onDeleteLibranza}
              onAddDobla={props.onAddDobla}
              onDeleteDobla={props.onDeleteDobla}
              onAddVacacion={props.onAddVacacion}
              onDeleteVacacion={props.onDeleteVacacion}
              onSwapEvents={handleSwapEvents}
              currentUser={props.user}
              isReadOnly={!canManageActiveCategory && !isGuardiaCategory}
              activeCategory={activeSub}
              availablePersonnel={currentPersonnel.filter(Boolean)}
              bulkMode={bulkPersonnel !== null}
              selectedBulkDates={bulkDates}
              onToggleBulkDate={toggleBulkDate}
              swapMode={swapMode}
              onCancelSwap={() => setSwapMode(false)}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              id="calendario-principal"
              getPersonnelType={(name) => nurses.includes(name) ? 'enfermeria' : 'medica'}
              noteDates={noteDates}
              onCellNoteClick={isPlanningCategory ? (date) => { setNoteModalDate(date); setNoteText(notes[date.toDateString()] || ''); } : undefined}
              onSelectDay={handleSelectDay}
              onProfessionalChange={setSelectedProfessional}
            />
          </div>

          <div className="w-full lg:w-[280px] xl:w-[300px] flex-shrink-0">
            <DayDetailPanel
              selectedDate={selectedDate}
              guardias={guardias}
              libranzas={filteredLibranzas}
              doblas={filteredDoblas}
              vacaciones={filteredVacaciones}
              meetings={meetings}
              onClose={() => setSelectedDate(null)}
              user={props.user}
              selectedProfessional={selectedProfessional}
              onClearProfessionalFilter={() => setSelectedProfessional('all')}
            />
          </div>
        </div>

        {/* Notes section for planning categories */}
        {isPlanningCategory && (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden no-print">
            <div className="p-6 md:p-8 bg-gray-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 text-white rounded-2xl shadow-lg ${canWriteNotes ? 'bg-amber-500' : 'bg-gray-400'}`}>
                  <span className="material-symbols-outlined">sticky_note_2</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('calendarios.notesOf')} {activeSub === 'Libranzas' ? t('calendarios.libranzas') : t('calendarios.refuerzo')}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                    {canWriteNotes ? t('calendarios.canWriteNotes') : t('calendarios.readOnlyNote')}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {noteDates.length === 0 ? (
                <div className="text-center py-8 opacity-30 text-[10px] font-black uppercase tracking-widest">{t('calendarios.noNotesThisMonth')}</div>
              ) : (
                noteDates.sort().map(key => {
                  const date = new Date(key);
                  return (
                    <div key={key} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="min-w-[80px]">
                        <p className="text-[10px] font-black text-gray-500 uppercase">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                        <p className="text-lg font-black text-gray-800">{date.getDate()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        {canWriteNotes ? (
                          <textarea
                            value={notes[key] || ''}
                            onChange={e => {
                              const updated = { ...notes, [key]: e.target.value };
                              setNotes(updated);
                              localStorage.setItem('zbs_planning_notes', JSON.stringify(updated));
                            }}
                            rows={2}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                          />
                        ) : (
                          <p className="text-sm font-bold text-gray-700 whitespace-pre-wrap">{notes[key]}</p>
                        )}
                      </div>
                      {canWriteNotes && (
                        <button
                          onClick={() => {
                            const updated = { ...notes };
                            delete updated[key];
                            setNotes(updated);
                            localStorage.setItem('zbs_planning_notes', JSON.stringify(updated));
                          }}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {noteModalDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print" onClick={() => setNoteModalDate(null)}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 animate-slide-in-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-3">
                <span className={`p-2 rounded-xl text-white ${canWriteNotes ? 'bg-amber-500' : 'bg-gray-400'} material-symbols-outlined`}>sticky_note_2</span>
                {t('calendarios.noteOfDay')}
              </h3>
              <p className="text-sm font-bold text-gray-500 mb-5">
                {noteModalDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              {canWriteNotes ? (
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder={t('calendarios.writeNote')}
                  rows={4}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none placeholder:text-gray-300"
                />
              ) : (
                <div className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-700 min-h-[80px]">
                  {noteText || t('calendarios.noNoteForDay')}
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setNoteModalDate(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors">
                  {canWriteNotes ? t('common.cancel') : t('common.close')}
                </button>
                {canWriteNotes && (
                  <button onClick={() => { if (noteModalDate) saveNote(noteModalDate, noteText); setNoteModalDate(null); }} className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl active:scale-95">
                    {t('calendarios.saveNote')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Registro de Permutas */}
        <div id="registro-permutas-container" className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 bg-gray-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><span className="material-symbols-outlined">history</span></div>
               <div><h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('calendarios.swapHistory')}</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Control ZBS Forcall</p></div>
             </div>
             <button onClick={handleDownloadRegistry} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 no-print shadow-lg active:scale-95"><span className="material-symbols-outlined text-sm">picture_as_pdf</span> {t('calendarios.downloadPdf')}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">{t('calendarios.date')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">{t('calendarios.category')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">{t('calendarios.exchange')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">{t('calendarios.days')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-right">{t('calendarios.authorized')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {permutaHistory.length > 0 ? (
                  permutaHistory.map(log => {
                    const ts = safeFormatDate(log.timestamp);
                    const d1 = log.details ? safeDayLabel(log.details.date1) : '-';
                    const d2 = log.details ? safeDayLabel(log.details.date2) : '-';
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
                              if (!confirm(t('calendarios.undoSwap'))) return;
                              const ok = await props.onUndoSwap!(log);
                              if (ok) deleteLog(log.id);
                            }}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-all active:scale-95"
                          >
                            {t('calendarios.undo')}
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  }))
                : (
                  <tr><td colSpan={6} className="px-6 py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">{t('common.registros')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {downloadMsg && <NotificationToast message={downloadMsg} onClose={() => setDownloadMsg(null)} />}
      </div>
    </div>
  );
};
