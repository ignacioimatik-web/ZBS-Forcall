import React from 'react';
import { useT } from '../lib/i18n';

interface StatusSummaryProps {
  totalDays: number;
  coveredDays: number;
  gaps: number;
  conflicts: number;
  pendingValidation: number | null;
  validationErrors?: number;
  validationWarnings?: number;
}

export const StatusSummary: React.FC<StatusSummaryProps> = ({
  totalDays,
  coveredDays,
  gaps,
  conflicts,
  pendingValidation,
  validationErrors = 0,
  validationWarnings = 0,
}) => {
  const { t } = useT();
  const cards = [
    {
      label: t('statusSummary.complete'),
      value: `${coveredDays}/${totalDays}`,
      icon: 'checklist',
      accentClass: 'bg-emerald-500',
      textClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50',
    },
    {
      label: t('statusSummary.gaps'),
      value: String(gaps),
      icon: 'highlight_alt',
      accentClass: 'bg-amber-500',
      textClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
    },
    {
      label: t('statusSummary.conflicts'),
      value: String(conflicts + validationErrors),
      icon: 'warning',
      accentClass: 'bg-red-500',
      textClass: 'text-red-700',
      bgClass: 'bg-red-50',
    },
    {
      label: t('statusSummary.warnings'),
      value: String(validationWarnings),
      icon: 'error_outline',
      accentClass: 'bg-orange-500',
      textClass: 'text-orange-700',
      bgClass: 'bg-orange-50',
    },
    {
      label: t('statusSummary.pending'),
      value: pendingValidation !== null ? String(pendingValidation) : '--',
      icon: 'hourglass_empty',
      accentClass: 'bg-gray-400',
      textClass: 'text-gray-600',
      bgClass: 'bg-gray-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 border border-gray-200 shadow-sm ${card.bgClass}`}
        >
          <div className={`w-8 h-8 rounded-lg ${card.accentClass} flex items-center justify-center text-white shadow-sm`}>
            <span className="material-symbols-outlined text-lg">{card.icon}</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black text-gray-900">{card.value}</span>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${card.textClass}`}>{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
