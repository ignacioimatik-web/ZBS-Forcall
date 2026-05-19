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
  sidebarOpen?: boolean;
  onCloseSidebar?: () => void;
}

const tabLabels: Record<string, string> = {
  Unificado: 'header.unificado',
  Turnos: 'header.turnos',
  IAassist: 'header.iaassist',
  Chat: 'header.chat',
  Dictado: 'header.dictado',
  Avisos: 'header.avisos',
};

const tabIcons: Record<string, string> = {
  Unificado: 'dashboard',
  Turnos: 'calendar_month',
  IAassist: 'auto_awesome',
  Chat: 'forum',
  Dictado: 'mic',
  Avisos: 'notifications_active',
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, guardiaSubCategory, onGuardiaSubCategoryChange, user, userGroup, sidebarBg, sidebarOpen, onCloseSidebar }) => {
  const { t } = useT();
  const isAdmin = user?.staffGroup == null;
  const isCoord = user?.role === 'Coordinador';

  const tabs = useMemo(() =>
    ['Unificado', 'Turnos', 'IAassist', 'Chat', 'Dictado', 'Avisos'].filter(t => {
      if (isAdmin && (t === 'Chat' || t === 'Dictado' || t === 'IAassist' || t === 'Turnos')) return false;
      if ((t === 'Chat' || t === 'Dictado') && !isCoord) return false;
      if (t === 'IAassist' && !isCoord) return false;
      return true;
    }),
    [isAdmin, isCoord]
  );

  const [guardiaExpanded, setGuardiaExpanded] = useState(false);

  const guardiaSubItems = useMemo(() => {
    const base: { id: string; labelKey: string; icon: string }[] = [];
    if (userGroup === 'medico' || userGroup === 'both') {
base.push({ id: 'Medicina', labelKey: 'calendarios.guardiaM', icon: 'stethoscope' });
     }
     if (userGroup === 'enfermeria' || userGroup === 'both') {
       base.push({ id: 'enfermeria', labelKey: 'calendarios.guardiaE', icon: 'vaccines' });
    }
    base.push(
      { id: 'Libranzas', labelKey: 'calendarios.libranzas', icon: 'beach_access' },
      { id: 'Refuerzo', labelKey: 'calendarios.refuerzo', icon: 'dynamic_feed' },
      { id: 'Vacaciones', labelKey: 'calendarios.vacaciones', icon: 'flight' }
    );
    return base;
  }, [userGroup]);

  const handleGuardiaClick = () => {
    if (activeTab !== 'Turnos') {
      setActiveTab('Turnos');
      setGuardiaExpanded(true);
    } else {
      setGuardiaExpanded(prev => !prev);
    }
  };

  const handleSubClick = (sub: string) => {
    onGuardiaSubCategoryChange?.(sub);
    setActiveTab('Turnos');
  };

  const sidebarContent = (
    <aside className="flex flex-col flex-1 w-60 xl:w-64 2xl:w-72 3xl:w-80 shadow-xl" style={{ backgroundColor: sidebarBg || '#0c4a6e' }}>
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl text-earth-100 shrink-0">landscape</span>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg text-white tracking-tight leading-none">ZBS Forcall</h1>
          <p className="text-[10px] text-forcall-300 font-medium mt-0.5">{t('sidebar.subtitle')}</p>
        </div>
        {onCloseSidebar && (
          <button onClick={onCloseSidebar} className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {tabs.map((tab) => (
          <div key={tab}>
            <button
              role="tab"
              aria-selected={activeTab === tab}
              onClick={tab === 'Turnos' ? handleGuardiaClick : () => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white/10 text-white shadow-inner border border-white/10'
                  : 'text-forcall-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{tabIcons[tab]}</span>
              <span className="flex-1 text-left">{t(tabLabels[tab])}</span>
              {tab === 'Turnos' && (
                <span className={`material-symbols-outlined text-base transition-transform ${guardiaExpanded ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              )}
            </button>

            {tab === 'Turnos' && guardiaExpanded && (
              <div className="ml-2 mt-1 space-y-0.5">
                {guardiaSubItems.map(sub => (
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

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:flex md:flex-col shrink-0">
        {sidebarContent}
      </div>
      {/* Mobile/tablet: overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseSidebar} />
          <div className="absolute left-0 top-0 bottom-0 shadow-2xl animate-slide-in-left flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
