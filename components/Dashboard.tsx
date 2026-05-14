
import React, { useState, useMemo, useCallback } from 'react';
import { Meeting, User, Guardia, Libranza, Dobla, Vacacion } from '../types';
import { UnifiedCalendar } from './UnifiedCalendar';
import { CalendarListView } from './CalendarListView';
import { PageHeader } from './PageHeader';
import { CalendarToolbar } from './CalendarToolbar';
import { StatusSummary } from './StatusSummary';
import { DayDetailPanel } from './DayDetailPanel';
import { downloadCalendarPDF, PDFCalendarData } from '../lib/pdfExport';
import { useT } from '../lib/i18n';
import { validateMonth, getMonthValidationSummary, type DayValidationStatus } from '../lib/calendarValidation';

interface DashboardProps {
  meetings: Meeting[];
  guardias: Guardia[];
  libranzas: Libranza[];
  doblas: Dobla[];
  vacaciones: Vacacion[];
  onNavigate: (tab: string) => void;
  onAddGuardia: (guardia: Guardia) => void;
  onDeleteGuardia: (id: string) => void;
  onAddLibranza: (libranza: Libranza) => void;
  onDeleteLibranza: (id: string) => void;
  onAddDobla: (dobla: Dobla) => void;
  onDeleteDobla: (id: string) => void;
  onAddMeeting: (meeting: Meeting) => void;
  user: User | null;
}

function computeStatusMetrics(
  month: Date,
  guardias: Guardia[],
  libranzas: Libranza[],
  doblas: Dobla[],
  meetings: Meeting[],
) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const totalDays = new Date(year, m + 1, 0).getDate();

  const coveredSet = new Set<string>();

  const allEvents = [
    ...guardias,
    ...libranzas,
    ...doblas,
    ...meetings,
  ];

  for (const ev of allEvents) {
    if (ev.date.getMonth() === m && ev.date.getFullYear() === year) {
      coveredSet.add(ev.date.toDateString());
    }
  }

  let gaps = 0;
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, m, day);
    const dow = date.getDay();
    if (dow >= 1 && dow <= 5 && !coveredSet.has(date.toDateString())) {
      gaps++;
    }
  }

  const dayPersonnel: Record<string, string[]> = {};
  const pushIfSameMonth = (arr: { date: Date; personnelName: string }[]) => {
    for (const item of arr) {
      if (item.date.getMonth() === m && item.date.getFullYear() === year) {
        const key = item.date.toDateString();
        if (!dayPersonnel[key]) dayPersonnel[key] = [];
        dayPersonnel[key].push(item.personnelName);
      }
    }
  };

  pushIfSameMonth(guardias);
  pushIfSameMonth(libranzas);
  pushIfSameMonth(doblas);

  let conflicts = 0;
  for (const personnel of Object.values(dayPersonnel)) {
    if (new Set(personnel).size !== personnel.length) conflicts++;
  }

  return { totalDays, coveredDays: coveredSet.size, gaps, conflicts };
}

export const Dashboard: React.FC<DashboardProps> = ({
  meetings,
  guardias,
  libranzas,
  doblas,
  vacaciones = [],
  onNavigate,
  onAddGuardia,
  onDeleteGuardia,
  onAddLibranza,
  onDeleteLibranza,
  onAddDobla,
  onDeleteDobla,
  onAddMeeting,
  user,
}) => {
  const { t } = useT();
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  const metrics = [
    { count: guardias.filter(g => g.type === 'medica').length, label: t('dashboard.med'), accentColor: 'bg-blue-500' },
    { count: guardias.filter(g => g.type === 'enfermeria').length, label: t('dashboard.enf'), accentColor: 'bg-red-500' },
    { count: libranzas.length, label: t('dashboard.lib'), accentColor: 'bg-green-500' },
    { count: vacaciones.length, label: t('dashboard.vac'), accentColor: 'bg-purple-400' },
    { count: doblas.length, label: t('dashboard.ref'), accentColor: 'bg-orange-500' },
  ];

  const validation = useMemo(
    () => getMonthValidationSummary(validateMonth(calendarMonth, guardias, libranzas, doblas, vacaciones, meetings)),
    [calendarMonth, guardias, libranzas, doblas, vacaciones, meetings],
  );

  const status = useMemo(
    () => computeStatusMetrics(calendarMonth, guardias, libranzas, doblas, meetings),
    [calendarMonth, guardias, libranzas, doblas, meetings],
  );

  const handleDownloadActiveCalendar = () => {
    const entries = [] as PDFCalendarData['entries'];
    guardias.forEach(g => {
      entries.push({
        date: g.date,
        personnel: [g.personnelName],
        type: g.type,
        kind: g.type === 'medica' ? 'M' : 'E'
      });
    });
    libranzas.forEach(l => {
      entries.push({
        date: l.date,
        personnel: [l.personnelName],
        type: l.type,
        kind: 'L'
      });
    });
    doblas.forEach(d => {
      entries.push({
        date: d.date,
        personnel: [d.personnelName],
        type: d.type,
        kind: 'R'
      });
    });
    meetings.forEach(m => {
      entries.push({
        date: m.date,
        personnel: [m.title],
        type: m.type,
        kind: 'MT'
      });
    });
    const data: PDFCalendarData = {
      title: 'Calendario General Forcall',
      subtitle: `${calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      month: calendarMonth.getMonth(),
      year: calendarMonth.getFullYear(),
      entries,
    };
    const filename = `Calendario_General_Forcall_${calendarMonth.toLocaleDateString('es-ES', { month: 'long' })}.pdf`;
    downloadCalendarPDF(data, filename);
  };

  const changeMonth = (offset: number) => {
    const next = new Date(calendarMonth);
    next.setMonth(calendarMonth.getMonth() + offset);
    setCalendarMonth(next);
  };

  const handleSelectDay = useCallback((date: Date) => {
    setSelectedDate(prev => {
      if (prev && prev.toDateString() === date.toDateString()) return null;
      return date;
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="print-hide">
        <PageHeader
          title="Cuadrante unificado"
          subtitle="Gesti&oacute;n centralizada de equipos"
          metrics={metrics}
        />
      </div>

      <div className="space-y-4">
        <div className="print-hide">
          <StatusSummary
          totalDays={status.totalDays}
          coveredDays={status.coveredDays}
          gaps={status.gaps}
          conflicts={status.conflicts}
          pendingValidation={null}
          validationErrors={validation.errors}
          validationWarnings={validation.warnings}
          />
        </div>

        <div className="print-hide">
          <CalendarToolbar
            currentMonth={calendarMonth}
            onPrevMonth={() => changeMonth(-1)}
            onNextMonth={() => changeMonth(1)}
            onToday={() => setCalendarMonth(new Date())}
            onDownloadPDF={handleDownloadActiveCalendar}
            downloadLabel={t('dashboard.downloadCalendar')}
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              setViewMode(mode);
              // Reset selection when switching views
              setSelectedDate(null);
            }}
            onPrint={viewMode === 'list' ? handlePrint : undefined}
          />
        </div>

        <div className="print-day-only">
          {viewMode === 'month' ? (
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              <div className="flex-1 min-w-0 -mx-4 md:mx-0">
                <UnifiedCalendar
                  id="dashboard-calendar"
                  meetings={meetings}
                  guardias={guardias}
                  libranzas={libranzas}
                  doblas={doblas}
                  onAddGuardia={onAddGuardia}
                  onDeleteGuardia={onDeleteGuardia}
                  onAddLibranza={onAddLibranza}
                  onDeleteLibranza={onDeleteLibranza}
                  onAddDobla={onAddDobla}
                  onDeleteDobla={onDeleteDobla}
                  onAddMeeting={onAddMeeting}
                  currentUser={user}
                  hideHeader={false}
                  hideMonthNav={true}
                  isReadOnly={true}
                  currentMonth={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  onSelectDay={handleSelectDay}
                  onProfessionalChange={setSelectedProfessional}
                />
              </div>

              <div className="w-full lg:w-[280px] xl:w-[300px] flex-shrink-0">
                <DayDetailPanel
                  selectedDate={selectedDate}
                  guardias={guardias}
                  libranzas={libranzas}
                  doblas={doblas}
                  vacaciones={vacaciones}
                  meetings={meetings}
                  onClose={() => setSelectedDate(null)}
                  user={user}
                  selectedProfessional={selectedProfessional}
                  onClearProfessionalFilter={() => setSelectedProfessional('all')}
                />
              </div>
            </div>
          ) : (
            <CalendarListView
              currentMonth={calendarMonth}
              guardias={guardias}
              libranzas={libranzas}
              doblas={doblas}
              vacaciones={vacaciones}
              meetings={meetings}
              selectedDate={selectedDate}
              selectedProfessional={selectedProfessional}
              onSelectDay={handleSelectDay}
            />
          )}
        </div>
      </div>
    </div>
  );
};
