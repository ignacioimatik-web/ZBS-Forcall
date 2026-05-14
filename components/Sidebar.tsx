import React, { useState, useMemo } from 'react';
import { VERSION_STRING } from '../lib/version';
import { useT } from '../lib/i18n';
import type { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  guardiaSubCategory?: string;
  onGuardiaSubCategoryChange?: (sub: string) => void;
  user: User | null;
  userGroup?: 'medico' | 'enfermeria' | 'both';
  sidebarBg?: string;
}

const tabLabels: Record<string, string> = {
  Unificado: 'header.unificado',
  Guardias: 'header.guardias',
  IAassist: 'header.iaassist',
  Chat: 'header.chat',
  Dictado: 'header.dictado',
  Alertas: 'header.alertas',
};

const tabIcons: Record<string, string> = {
  Unificado: 'dashboard',
  Guardias: 'calendar_month',
  IAassist: 'auto_awesome',
  Chat: 'forum',
  Dictado: 'mic',
  Alertas: 'campaign',
};

const guardiaSubItems = [
  { id: 'Medicina', labelKey: 'calendarios.medicina', icon: 'stethoscope' },
  { id: 'enfermeria', labelKey: 'calendarios.enfermeria', icon: 'vaccines' },
  { id: 'Libranzas', labelKey: 'calendarios.libranzas', icon: 'beach_access' },
  { id: 'Refuerzo', labelKey: 'calendarios.refuerzo', icon: 'dynamic_feed' },
  { id: 'Vacaciones', labelKey: 'calendarios.vacaciones', icon: 'flight' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, guardiaSubCategory, onGuardiaSubCategoryChange, user, userGroup, sidebarBg }) => {
  const { t } = useT();
  const isAdmin = user?.staffGroup == null;
  const isCoord = user?.role === 'Coordinador';
  const tabs = useMemo(() => ['Unificado', 'Guardias', 'IAassist', 'Chat', 'Dictado', 'Alertas'].filter(t => {
    if (isAdmin && (t === 'Chat' || t === 'Dictado' || t === 'IAassist')) return false;
    if (t === 'IAassist' && !isCoord) return false;
    return true;
  }), [isAdmin, isCoord]);
  const [guardiaExpanded, setGuardiaExpanded] = useState(false);

  const filteredGuardiaSubItems = useMemo(() => {
    if (userGroup === 'medico') return guardiaSubItems.filter(s => s.id !== 'enfermeria');
    if (userGroup === 'enfermeria') return guardiaSubItems.filter(s => s.id !== 'Medicina');
    return guardiaSubItems;
  }, [userGroup]);

  const handleGuardiaClick = () => {
    if (activeTab !== 'Guardias') {
      setActiveTab('Guardias');
      setGuardiaExpanded(true);
    } else {
      setGuardiaExpanded(prev => !prev);
    }
  };

  const handleSubClick = (sub: string) => {
    onGuardiaSubCategoryChange?.(sub);
    setActiveTab('Guardias');
  };

  return (
    <aside className="hidden md:flex md:flex-col min-h-screen w-60 z-50 shadow-xl" style={{ backgroundColor: sidebarBg || '#0c4a6e' }}>
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-earth-100">landscape</span>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight leading-none">ZBS Forcall</h1>
            <p className="text-[10px] text-forcall-300 font-medium mt-0.5">{t('sidebar.subtitle')}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {tabs.map((tab) => (
          <div key={tab}>
            <button
              role="tab"
              aria-selected={activeTab === tab}
              onClick={tab === 'Guardias' ? handleGuardiaClick : () => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white/10 text-white shadow-inner border border-white/10'
                  : 'text-forcall-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{tabIcons[tab]}</span>
              <span className="flex-1 text-left">{t(tabLabels[tab])}</span>
              {tab === 'Guardias' && (
                <span className={`material-symbols-outlined text-base transition-transform ${guardiaExpanded ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              )}
            </button>

            {tab === 'Guardias' && guardiaExpanded && (
              <div className="ml-2 mt-1 space-y-0.5">
                {filteredGuardiaSubItems.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubClick(sub.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      guardiaSubCategory === sub.id
                        ? 'bg-white/10 text-white shadow-inner border border-white/10'
                        : 'text-forcall-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{sub.icon}</span>
                    <span>{t(sub.labelKey)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <button onClick={() => setActiveTab('Configuracion')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-forcall-300 hover:text-white hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-xl">settings</span>
          <span>{t('sidebar.configuracion')}</span>
        </button>
        <button onClick={() => setActiveTab('Ayuda')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-forcall-300 hover:text-white hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-xl">help</span>
          <span>{t('sidebar.ayuda')}</span>
        </button>
        <div className="px-4 pt-2">
          <p className="text-[9px] text-forcall-400">{VERSION_STRING}</p>
        </div>
      </div>
    </aside>
  );
};
