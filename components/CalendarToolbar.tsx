import React from 'react';
import { useT } from '../lib/i18n';

interface CalendarToolbarProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onDownloadPDF?: () => void;
  downloadLabel?: string;
  viewMode?: 'month' | 'list';
  onViewModeChange?: (mode: 'month' | 'list') => void;
  onPrint?: () => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onDownloadPDF,
  downloadLabel,
  viewMode = 'month',
  onViewModeChange,
  onPrint,
}) => {
  const { t } = useT();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1 sm:gap-2">
        <button onClick={onPrevMonth} aria-label="Mes anterior" className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><span className="material-symbols-outlined text-gray-500">chevron_left</span></button>
        <div className="flex flex-col items-center min-w-[120px] sm:min-w-[150px]">
          <span className="text-sm md:text-base font-black text-gray-800 uppercase tracking-tighter text-center leading-none">
            {currentMonth.toLocaleDateString('es-ES', { month: 'long' })}
          </span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{currentMonth.getFullYear()}</span>
        </div>
        <button onClick={onNextMonth} aria-label="Mes siguiente" className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><span className="material-symbols-outlined text-gray-500">chevron_right</span></button>
        <button onClick={onToday} className="ml-1 px-3 py-1.5 bg-forcall-50 text-forcall-700 text-[9px] font-black uppercase tracking-widest border border-forcall-200 rounded-lg hover:bg-forcall-100 transition-colors">{t('common.hoy')}</button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {onViewModeChange && (
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('month')}
              aria-label={t('common.viewMode')}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors ${viewMode === 'month' ? 'bg-white text-gray-800 shadow-sm border' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('common.viewMonth')}
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              aria-label={t('common.viewList')}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm border' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('common.viewList')}
            </button>
          </div>
        )}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hidden sm:inline-block">
          {viewMode === 'month' ? t('common.viewMonth') : t('common.viewList')}
        </span>
        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-800 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {downloadLabel || t('common.pdf')}
          </button>
        )}
        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-forcall-50 text-forcall-700 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-forcall-100 active:scale-95 transition-all border border-forcall-200"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            {t('common.print')}
          </button>
        )}
      </div>
    </div>
  );
};
