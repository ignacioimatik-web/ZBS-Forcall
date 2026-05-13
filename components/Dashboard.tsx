
import React, { useState } from 'react';
import { Meeting, User, Guardia, Libranza, Dobla, Vacacion } from '../types';
import { UnifiedCalendar } from './UnifiedCalendar';
import { PageHeader } from './PageHeader';
import { downloadCalendarPDF, PDFCalendarData } from '../lib/pdfExport';
import { useT } from '../lib/i18n';

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
  user 
}) => {
  const { t } = useT();
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const metrics = [
    { count: guardias.filter(g => g.type === 'medica').length, label: t('dashboard.med'), accentColor: 'bg-blue-500' },
    { count: guardias.filter(g => g.type === 'enfermeria').length, label: t('dashboard.enf'), accentColor: 'bg-red-500' },
    { count: libranzas.length, label: t('dashboard.lib'), accentColor: 'bg-green-500' },
    { count: vacaciones.length, label: t('dashboard.vac'), accentColor: 'bg-purple-400' },
    { count: doblas.length, label: t('dashboard.ref'), accentColor: 'bg-orange-500' },
  ];

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

  return (
    <div className="animate-fade-in pb-12">
      <PageHeader
        title="Cuadrante unificado"
        subtitle="Gesti&oacute;n centralizada de equipos"
        metrics={metrics}
        actions={
          <button
            onClick={handleDownloadActiveCalendar}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-gray-800 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            {t('dashboard.downloadCalendar')}
          </button>
        }
      />

      <div className="-mx-4 md:mx-0">
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
          isReadOnly={true}
          currentMonth={calendarMonth}
          onMonthChange={setCalendarMonth}
        />
      </div>
    </div>
  );
};
