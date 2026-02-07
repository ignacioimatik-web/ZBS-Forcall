import React from 'react';

interface NotificationToastProps {
  message: string;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-white border-l-4 border-yellow-500 shadow-2xl rounded-r-lg p-4 max-w-sm flex items-start gap-3 z-50 animate-slide-in-up">
      <div className="bg-yellow-100 p-2 rounded-full shrink-0">
        <span className="material-symbols-outlined text-yellow-700">notifications_active</span>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-gray-800">Recordatorio de Sesión</h4>
        <p className="text-sm text-gray-600 mt-1 leading-snug">{message}</p>
      </div>
      <button 
        onClick={onClose} 
        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        aria-label="Cerrar notificación"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
};