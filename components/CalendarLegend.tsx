import React from 'react';
import { useT } from '../lib/i18n';

const legendItems = [
  { key: 'guardia_medica', labelKey: 'guardias.legendGuardiaMedical', color: 'bg-blue-600' },
  { key: 'guardia_enfermeria', labelKey: 'guardias.legendGuardiaNursing', color: 'bg-rose-600' },
  { key: 'libranza', labelKey: 'guardias.legendLibranza', color: 'bg-emerald-600' },
  { key: 'dobla', labelKey: 'guardias.legendRefuerzo', color: 'bg-orange-600' },
  { key: 'vacacion', labelKey: 'dayDetail.sectionVacacion', color: 'bg-violet-600' },
];

export const CalendarLegend: React.FC = () => {
  const { t } = useT();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
        {t('calendarView.legendTeam')}
      </h4>
      <div className="flex flex-col gap-2">
        {legendItems.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
            <span className="text-[11px] font-medium text-gray-700">{t(item.labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
