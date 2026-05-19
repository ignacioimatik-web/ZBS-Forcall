import React, { useState, useMemo } from 'react';
import { useT } from '../lib/i18n';
import { Guardia, User } from '../types';
import { ShiftBadge } from './ShiftBadge';
import { downloadCalendarPDF, PDFCalendarData } from '../lib/pdfExport';
import { getHolidayName } from '../utils';
import { ConfirmationModal } from './ConfirmationModal';
import { NotificationToast } from './NotificationToast';

interface GuardiasViewProps {
  guardias: Guardia[];
  onAddGuardia: (guardia: Guardia) => void;
  onDeleteGuardia: (id: string) => void;
  currentUser: User | null;
}

type FilterType = 'Todas' | 'medica' | 'enfermeria';

export const GuardiasView: React.FC<GuardiasViewProps> = ({ guardias, onAddGuardia, onDeleteGuardia, currentUser }) => {
  const { t } = useT();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todas');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guardia | null>(null);

  const [formData, setFormData] = useState({
    doctorName: '',
    nurseName: ''
  });

  const canEdit = currentUser?.role === 'Administrador' || currentUser?.role === 'Coordinador';

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysInMonth = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1));
  }, [year, month, totalDays]);

  const startingEmptyCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  }, [year, month]);

  const getGuardiasForDay = (date: Date) => {
    const dayGuardias = guardias.filter(
      (g) =>
        g.date.getDate() === date.getDate() &&
        g.date.getMonth() === date.getMonth() &&
        g.date.getFullYear() === date.getFullYear()
    );

    if (activeFilter === 'Todas') return dayGuardias;
    return dayGuardias.filter(g => g.type === activeFilter);
  };

  const handleDayClick = (date: Date) => {
    if (!canEdit) return;
    setSelectedDay(date);
    setFormData({ doctorName: '', nurseName: '' });
    setIsModalOpen(true);
  };

  const handleDownloadGuardiasPDF = async () => {
    setIsDownloading(true);
    const entries: PDFCalendarData['entries'] = [];
    guardias
      .filter(
        (g) =>
          g.date.getMonth() === month && g.date.getFullYear() === year
      )
      .forEach(g => {
        entries.push({ date: g.date, personnel: [g.personnelName], type: g.type, kind: g.type === 'medica' ? 'M' : 'E' });
      });
    const data: PDFCalendarData = {
      title: 'Guardias Forcall',
      subtitle: `${currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      month,
      year,
      entries,
    };
    const filename = `Calendario_Guardias_Forcall_${currentMonth.toLocaleDateString('es-ES', { month: 'long' })}.pdf`;
    try {
      downloadCalendarPDF(data, filename);
      setDownloadMsg(t('guardias.pdfDownloaded'));
    } catch (e) {
      console.error(e);
      setDownloadMsg(t('guardias.pdfError'));
    } finally {
      setIsDownloading(false);
    }
  };

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + offset);
    setCurrentMonth(next);
  };

  const filterOptions: FilterType[] = ['Todas', 'medica', 'enfermeria'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDay) {
      if (formData.doctorName.trim() !== '') {
        onAddGuardia({
          id: Date.now().toString(),
          date: selectedDay,
          type: 'medica',
          personnelName: formData.doctorName,
        });
      }

      if (formData.nurseName.trim() !== '') {
        onAddGuardia({
          id: (Date.now() + 1).toString(),
          date: selectedDay,
          type: 'enfermeria',
          personnelName: formData.nurseName,
        });
      }

      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => changeMonth(-1)} aria-label="Mes anterior" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-gray-500">chevron_left</span>
            </button>
            <div className="flex flex-col items-center min-w-[120px] sm:min-w-[180px]">
              <span className="text-sm md:text-base font-black text-gray-800 uppercase tracking-tighter text-center leading-none">
                {currentMonth.toLocaleDateString('es-ES', { month: 'long' })}
              </span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{year}</span>
            </div>
            <button onClick={() => changeMonth(1)} aria-label="Mes siguiente" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-gray-500">chevron_right</span>
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="ml-1 px-3 py-1.5 bg-forcall-50 text-forcall-700 text-[9px] font-black uppercase tracking-widest border border-forcall-200 rounded-lg hover:bg-forcall-100 transition-colors">
              {t('common.hoy')}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro tipo guardia */}
            <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
              {filterOptions.map(option => (
                <button
                  key={option}
                  onClick={() => setActiveFilter(option)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    activeFilter === option
                      ? 'bg-white text-gray-800 shadow-sm border'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {option === 'Todas'
                    ? t('guardias.filterAll')
                    : option === 'medica'
                    ? t('guardias.filterMedical')
                    : t('guardias.filterNursing')}
                </button>
              ))}
            </div>

            <button
              onClick={handleDownloadGuardiasPDF}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              {t('guardias.download')}
            </button>
          </div>
        </div>
      </div>

      {/* Calendario grid */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
        {/* Cabecera días */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {[
            t('guardias.dayMon'), t('guardias.dayTue'), t('guardias.dayWed'),
            t('guardias.dayThu'), t('guardias.dayFri'), t('guardias.daySat'), t('guardias.daySun')
          ].map(d => (
            <div key={d} className="text-center text-[10px] xs:text-[8px] font-bold text-gray-500 uppercase tracking-wider py-2.5 xs:py-1.5 border-r border-gray-200 last:border-r-0">
              <span className="hidden xs:inline">{d}</span>
              <span className="xs:hidden">{d.slice(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7 gap-0 min-w-[350px]">
          {Array.from({ length: startingEmptyCells }).map((_, i) => (
            <div key={`empty-${i}`} className="hidden xs:block min-h-[80px] xs:min-h-[52px] md:min-h-[120px] 2xl:min-h-[150px] bg-gray-50/50 border-b border-r border-gray-100" />
          ))}

          {daysInMonth.map((date, i) => {
            const dayGuardias = getGuardiasForDay(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const holidayName = getHolidayName(date);
            const isFestivo = !!holidayName;
            const hasShifts = dayGuardias.length > 0;

            return (
              <div
                key={i}
                onClick={() => handleDayClick(date)}
                className={`flex flex-col p-3 xs:p-1.5 border-b border-r border-gray-100 relative group xs:min-h-[52px] md:min-h-[120px] 2xl:min-h-[150px] bg-white transition-colors
                  ${isToday ? 'bg-blue-50/40' : ''}
                  ${isFestivo ? 'bg-red-50/20' : ''}
                  ${isWeekend ? 'bg-gray-50/50' : ''}
                  ${canEdit && !isWeekend ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              >
                {/* Número del día */}
                <div className="flex items-center justify-between min-w-0 mb-1">
                  <span className={`text-sm xs:text-[11px] leading-none ${
                    isToday
                      ? 'bg-blue-600 text-white w-6 xs:w-5 h-6 xs:h-5 rounded-full flex items-center justify-center text-[11px] xs:text-[9px]'
                      : isFestivo
                      ? 'text-red-500 font-semibold'
                      : isWeekend
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}>
                    {date.getDate()}
                  </span>
                  {isFestivo && (
                    <span className="material-symbols-outlined text-[10px] text-red-400" title={holidayName}>
                      festival
                    </span>
                  )}
                </div>

                {/* Guardias con ShiftBadge */}
<div className="flex-1 space-y-1 overflow-hidden">
                   {dayGuardias.length > 0 ? (
                     dayGuardias.map(g => (
                       <div
                         key={g.id}
                          className={`flex items-center gap-1 px-2 xs:px-1 py-1 xs:py-0.5 rounded-lg text-[10px] xs:text-[7px] font-semibold transition-all whitespace-nowrap
                            ${g.type === 'medica'
                              ? 'bg-blue-50 text-blue-800 border border-blue-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-100'
                            }`}
                       >
                         <ShiftBadge kind="guardia" type={g.type} />
                         <span className="whitespace-nowrap">{g.personnelName}</span>
                          {canEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(g);
                              }}
                              className="ml-auto opacity-60 md:opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity shrink-0"
                              aria-label="Eliminar guardia"
                            >
                              <span className="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className={`text-[10px] italic truncate ${
                      isWeekend ? 'text-gray-300' : 'text-gray-400'
                    }`}>
                      {hasShifts ? t('guardias.noShifts') : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 animate-slide-in-up">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-forcall-600 text-white material-symbols-outlined">
                add_circle
              </span>
              {t('guardias.assignShift')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {t('guardias.selectedDay')}
                </p>
                <p className="font-black text-gray-800 text-lg uppercase tracking-tight">
                  {selectedDay?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">stethoscope</span>
                  {t('guardias.medicalStaff')}
                </label>
                <input
                  type="text"
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  placeholder={t('guardias.doctorPlaceholder')}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-700 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">vaccines</span>
                  {t('guardias.nursingStaff')}
                </label>
                <input
                  type="text"
                  value={formData.nurseName}
                  onChange={(e) => setFormData({ ...formData, nurseName: e.target.value })}
                  placeholder={t('guardias.nursePlaceholder')}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition-all font-bold text-sm"
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!formData.doctorName.trim() && !formData.nurseName.trim()}
                  className="flex-1 py-4 bg-forcall-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mensaje de descarga */}
      {downloadMsg && (
        <NotificationToast
          message={downloadMsg}
          type={downloadMsg.includes('Error') ? 'error' : 'success'}
          onClose={() => setDownloadMsg(null)}
        />
      )}

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title={t('guardias.deleteShift')}
        message={deleteTarget ? `${t('guardias.deleteConfirm')} ${deleteTarget.personnelName}?` : ''}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (!deleteTarget) return;
          onDeleteGuardia(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};