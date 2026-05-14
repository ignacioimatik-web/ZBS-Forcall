import React from 'react';
import { useT } from '../lib/i18n';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel
}) => {
  const { t } = useT();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="confirmation-modal-title">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 animate-slide-in-up">
        <h3 id="confirmation-modal-title" className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <span className="p-2 rounded-xl bg-red-600 text-white material-symbols-outlined">warning</span>
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">{message}</p>
        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 active:scale-95 transition-all"
          >
            {confirmLabel || t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};