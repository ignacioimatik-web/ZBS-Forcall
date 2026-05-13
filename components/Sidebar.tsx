import React from 'react';
import { VERSION_STRING } from '../lib/version';
import { useT } from '../lib/i18n';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useT();
  const tabs = ['Unificado', 'Guardias', 'Chat', 'Dictado', 'Alertas'];

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-60 bg-forcall-900 z-50 shadow-xl">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-earth-100">landscape</span>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight leading-none">ZBS Forcall</h1>
            <p className="text-[10px] text-forcall-300 font-medium mt-0.5">Gesti&oacute;n de Equipos</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white/10 text-white shadow-inner border border-white/10'
                : 'text-forcall-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{tabIcons[tab]}</span>
            <span>{t(tabLabels[tab])}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-forcall-300 hover:text-white hover:bg-white/5 transition-all cursor-default">
          <span className="material-symbols-outlined text-xl">settings</span>
          <span>Configuraci&oacute;n</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-forcall-300 hover:text-white hover:bg-white/5 transition-all cursor-default">
          <span className="material-symbols-outlined text-xl">help</span>
          <span>Ayuda</span>
        </button>
        <div className="px-4 pt-2">
          <p className="text-[9px] text-forcall-400">{VERSION_STRING}</p>
        </div>
      </div>
    </aside>
  );
};
