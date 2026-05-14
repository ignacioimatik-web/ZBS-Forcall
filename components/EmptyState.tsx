import React from 'react';
import { useT } from '../lib/i18n';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'calendar_month', title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <span className="material-symbols-outlined text-5xl mb-4 text-gray-300">{icon}</span>
      <h3 className="text-base font-black text-gray-500 mb-1 text-center">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-4 text-center max-w-xs">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-forcall-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-forcall-700 active:scale-95 transition-all shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
