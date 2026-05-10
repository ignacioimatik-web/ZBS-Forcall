
import React from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const tabs = ['Unificado', 'Guardias', 'Dictado', 'Alertas', 'Noticias', 'Vademécum'];

  return (
    <header className="bg-gradient-to-r from-forcall-900 via-forcall-800 to-earth-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-earth-100">landscape</span>
            <div>
              <h1 className="font-bold text-xl tracking-tight">Forcall ZBS</h1>
              <p className="text-xs text-forcall-100 opacity-80">Gestión de Equipos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <nav className="hidden md:flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-white/10 text-white shadow-inner border border-white/20'
                      : 'text-forcall-100 hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <button 
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-red-200 hover:text-white hover:bg-red-900/40 border border-transparent hover:border-red-500/30 transition-all shadow-sm"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-lg md:text-[20px]">logout</span>
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Tab Bar */}
      <div className="md:hidden flex justify-around bg-forcall-900/90 backdrop-blur py-2 text-xs border-t border-forcall-800 overflow-x-auto no-scrollbar">
         {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center p-1 min-w-[70px] ${activeTab === tab ? 'text-white' : 'text-forcall-300'}`}
            >
               <span className="material-symbols-outlined text-lg">
                  {tab === 'Unificado' ? 'dashboard' : 
                   tab === 'Guardias' ? 'calendar_month' : 
                   tab === 'Dictado' ? 'mic' : 
                   tab === 'Noticias' ? 'newspaper' : 
                   tab === 'Vademécum' ? 'prescriptions' : 'campaign'}
               </span>
               <span className="whitespace-nowrap text-[10px] uppercase font-black tracking-tighter">{tab}</span>
            </button>
         ))}
      </div>
    </header>
  );
};
