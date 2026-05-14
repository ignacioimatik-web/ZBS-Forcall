
import React from 'react';
import { useT } from '../lib/i18n';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  userName?: string;
}

const tabLabels: Record<string, string> = {
  Unificado: 'header.unificado',
  Guardias: 'header.guardias',
  Chat: 'header.chat',
  Dictado: 'header.dictado',
  Alertas: 'header.alertas',
};

const tabIcons: Record<string, string> = {
  Unificado: 'dashboard',
  Guardias: 'calendar_month',
  Chat: 'forum',
  Dictado: 'mic',
  Alertas: 'campaign',
};

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onLogout, userName }) => {
  const { t } = useT();
  const tabs = ['Unificado', 'Guardias', 'Chat', 'Dictado', 'Alertas'];

  const pageTitle = t(tabLabels[activeTab] || 'header.unificado');

  return (
    <>
      {/* Desktop header: compact white bar */}
      <header className="hidden md:flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 sticky top-0 z-40">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">{pageTitle}</h2>
        <div className="flex items-center gap-4">
          {userName && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="material-symbols-outlined text-lg text-gray-400">person</span>
              <span className="font-medium">{userName}</span>
            </div>
          )}
          
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
            title={t('header.logout')}
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>{t('header.exit')}</span>
          </button>
        </div>
      </header>

      {/* Mobile: gradient top bar + bottom tab nav (unchanged) */}
      <header className="md:hidden bg-gradient-to-r from-forcall-900 via-forcall-800 to-earth-900 text-white shadow-lg sticky top-0 z-50">
        <div className="flex justify-between items-center h-14 px-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-earth-100">landscape</span>
            <div>
              <h1 className="font-bold text-base tracking-tight">{t('header.appName')}</h1>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-200 hover:text-white hover:bg-red-900/40 transition-all"
            title={t('header.logout')}
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>

        <div className="flex justify-around bg-forcall-900/90 backdrop-blur py-2 text-xs border-t border-forcall-800 overflow-x-auto no-scrollbar" role="tablist" aria-label="Navegación principal">
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center p-1 min-w-[70px] ${activeTab === tab ? 'text-white' : 'text-forcall-300'}`}
            >
              <span className="material-symbols-outlined text-lg">{tabIcons[tab]}</span>
              <span className="whitespace-nowrap text-[10px] uppercase font-black tracking-tighter">{t(tabLabels[tab])}</span>
            </button>
          ))}
        </div>
      </header>
    </>
  );
};
