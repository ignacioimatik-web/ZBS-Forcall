import React from 'react';
import { Meeting, Guardia, Libranza, Dobla, Vacacion } from '../types';
import { ShiftBadge } from './ShiftBadge';
import { useT } from '../lib/i18n';


interface DayDetailPanelProps {
  selectedDate: Date | null;
  guardias: Guardia[];
  libranzas: Libranza[];
  doblas: Dobla[];
  vacaciones: Vacacion[];
  meetings: Meeting[];
  onClose: () => void;
  user?: { name: string } | null;
  selectedProfessional?: string;
  onClearProfessionalFilter?: () => void;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

interface Assignment {
  kind: string;
  type?: string;
  label: string;
  personnelName?: string;
}

const sectionConfig: Record<string, { labelKey: string; icon: string }> = {
  guardia: { labelKey: 'dayDetail.sectionGuardia', icon: 'stethoscope' },
  libranza: { labelKey: 'dayDetail.sectionLibranza', icon: 'beach_access' },
  dobla: { labelKey: 'dayDetail.sectionDobla', icon: 'dynamic_feed' },
  vacacion: { labelKey: 'dayDetail.sectionVacacion', icon: 'flight' },
};

export const DayDetailPanel: React.FC<DayDetailPanelProps> = ({
  selectedDate,
  guardias,
  libranzas,
  doblas,
  vacaciones,
  meetings,
  onClose,
  user,
  selectedProfessional = 'all',
  onClearProfessionalFilter,
}) => {
  const { t } = useT();

  if (!selectedDate) {
    return (
      <aside className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm" aria-label={t('dayDetail.title')}>
        <h3 className="text-sm font-bold text-gray-900 mb-2">{t('dayDetail.title')}</h3>
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <span className="material-symbols-outlined text-4xl mb-3">calendar_month</span>
          <p className="text-sm font-medium text-center">{t('dayDetail.selectDay')}</p>
        </div>
      </aside>
    );
  }

  const today = new Date();
  const isTodaySelected = isSameDay(selectedDate, today);

  const assignments: Assignment[] = [
    ...guardias.filter(g => isSameDay(g.date, selectedDate)).map(g => ({
      kind: 'guardia', type: g.type, label: g.personnelName, personnelName: g.personnelName,
    })),
    ...libranzas.filter(l => isSameDay(l.date, selectedDate)).map(l => ({
      kind: 'libranza', label: l.personnelName, personnelName: l.personnelName,
    })),
    ...doblas.filter(d => isSameDay(d.date, selectedDate)).map(d => ({
      kind: 'dobla', label: d.personnelName, personnelName: d.personnelName,
    })),
    ...vacaciones.filter(v => isSameDay(v.date, selectedDate)).map(v => ({
      kind: 'vacacion', label: v.personnelName, personnelName: v.personnelName,
    })),
    ...meetings.filter(m => isSameDay(m.date, selectedDate)).map(m => ({
      kind: 'meeting', label: m.title, personnelName: undefined,
    })),
  ];

  const grouped: Record<string, Assignment[]> = {};
  for (const a of assignments) {
    const key = a.kind;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  }

  const orderedSections = ['guardia', 'libranza', 'dobla', 'vacacion'];

  return (
    <aside className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden lg:sticky lg:top-20" aria-label={`Detalle del día: ${formatDate(selectedDate)}`}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 leading-tight">{formatDate(selectedDate)}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              {isTodaySelected && (
                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">{t('dayDetail.today')}</span>
              )}
              {selectedProfessional !== 'all' && (
                <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">badge</span>
                      {t('dayDetail.filterPrefix')} {selectedProfessional}
                    </span>
                    {onClearProfessionalFilter && (
                      <button
                        onClick={onClearProfessionalFilter}
                        className="text-[9px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full hover:bg-gray-200 transition-colors"
                        aria-label={t('dayDetail.clearFilterAria')}
                      >
                        {t('dayDetail.clearFilter')}
                      </button>
                    )}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label={t('dayDetail.closeAria')} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Sections */}
        {orderedSections.map((key) => {
          const items = grouped[key];
          const config = sectionConfig[key];
          if (!config) return null;

          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-gray-400 text-base">{config.icon}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t(config.labelKey)}</span>
                {items && items.length > 0 && (
                  <span className="text-[10px] font-bold text-gray-400 ml-auto">{items.length}</span>
                )}
              </div>
              {items && items.length > 0 ? (
                <div className="space-y-1">
                  {items.map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selectedProfessional !== 'all' ? (item.personnelName === selectedProfessional ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'opacity-35 bg-gray-50 border-gray-100') : 'bg-gray-50 border-gray-100'}`}>
                      <ShiftBadge kind={item.kind} type={item.type} />
                      <span className="text-xs font-medium text-gray-800 truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic pl-1">{t('dayDetail.noAssignment')}</p>
              )}
            </div>
          );
        })}

        {assignments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <span className="material-symbols-outlined text-3xl mb-2">info</span>
            <p className="text-sm font-medium">{t('dayDetail.noAssignments')}</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
        <p className="text-[9px] text-gray-400 font-medium text-center">{t('dayDetail.selectDayHint')}</p>
      </div>
    </aside>
  );
};