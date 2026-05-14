import React from 'react';
import { useT } from '../lib/i18n';

interface NotificationToastProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

const typeConfig = {
  success: { borderColor: 'border-l-green-500', iconBg: 'bg-green-100', icon: 'check_circle', iconColor: 'text-green-700', titleKey: 'notification.success' as const },
  error: { borderColor: 'border-l-red-500', iconBg: 'bg-red-100', icon: 'error', iconColor: 'text-red-700', titleKey: 'notification.error' as const },
  info: { borderColor: 'border-l-yellow-500', iconBg: 'bg-yellow-100', icon: 'notifications_active', iconColor: 'text-yellow-700', titleKey: 'notification.sessionReminder' as const },
};

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClose, type = 'info' }) => {
  const { t } = useT();
  const cfg = typeConfig[type];
  return (
    <div className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-white border-l-4 ${cfg.borderColor} shadow-2xl rounded-r-lg p-4 max-w-sm flex items-start gap-3 z-50 animate-slide-in-up`}>
      <div className={`${cfg.iconBg} p-2 rounded-full shrink-0`}>
        <span className={`material-symbols-outlined ${cfg.iconColor}`}>{cfg.icon}</span>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-gray-800">{t(cfg.titleKey)}</h4>
        <p className="text-sm text-gray-600 mt-1 leading-snug">{message}</p>
      </div>
      <button 
        onClick={onClose} 
        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        aria-label={t('notification.close')}
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
};