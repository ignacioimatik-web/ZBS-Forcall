
import React, { useState, useMemo } from 'react';
import { UnifiedCalendar } from './UnifiedCalendar';
import { Meeting, User, Guardia, Libranza, Dobla, ManualHoliday } from '../types';

interface CalendariosViewProps {
  meetings: Meeting[];
  guardias: Guardia[];
  libranzas: Libranza[];
  doblas: Dobla[];
  manualHolidays: ManualHoliday[];
  onAddGuardia: (guardia: Guardia) => void;
  onDeleteGuardia: (id: string) => void;
  onAddLibranza: (libranza: Libranza) => void;
  onDeleteLibranza: (id: string) => void;
  onAddDobla: (dobla: Dobla) => void;
  onDeleteDobla: (id: string) => void;
  onAddMeeting: (meeting: Meeting) => void;
  onNavigateToSession: (id: string) => void;
  user: User | null;
}

type SubCategory = 'Medicina' | 'Enfermería' | 'Libranzas' | 'Refuerzo';

export const CalendariosView: React.FC<CalendariosViewProps> = (props) => {
  const [activeSub, setActiveSub] = useState<SubCategory>('Medicina');

  const nextMeeting = useMemo(() => {
    const now = new Date();
    return props.meetings
      .filter(m => m.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  }, [props.meetings]);

  const subNav = [
    { id: 'Medicina', icon: 'stethoscope', color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'Enfermería', icon: 'vaccines', color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'Libranzas', icon: 'beach_access', color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'Refuerzo', icon: 'dynamic_feed', color: 'text-stone-600', bg: 'bg-stone-50' }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-12">
      {/* SUB-NAVIGATION BAR */}
      <div className="flex flex-wrap justify-center gap-3 no-print">
        {subNav.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSub(item.id as SubCategory)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all active:scale-95 ${
              activeSub === item.id 
                ? 'bg-white shadow-xl border-white ring-2 ring-gray-100 z-10' 
                : 'bg-gray-100/50 border-transparent text-gray-400 hover:bg-white hover:text-gray-600'
            }`}
          >
            <span className={`material-symbols-outlined text-xl ${activeSub === item.id ? item.color : ''}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${activeSub === item.id ? 'text-gray-900' : ''}`}>
              {item.id}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR */}
        <aside className="w-full lg:w-80 space-y-6 order-2 lg:order-1 no-print">
          <div className="bg-gradient-to-br from-indigo-900 to-forcall-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200/70">Gestión de Turnos</span>
              <h3 className="text-2xl font-black mt-4 leading-tight mb-4">Sección {activeSub}</h3>
              <p className="text-xs text-indigo-100/60 leading-relaxed mb-6 font-medium">
                {props.user?.role === 'Coordinador' 
                  ? 'Tienes permisos para editar este calendario. Haz clic en un día para añadir personal.' 
                  : 'Modo lectura. Solo la coordinación puede realizar cambios en los cuadrantes.'}
              </p>

              {nextMeeting && (
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                   <span className="text-[9px] font-black uppercase text-indigo-200 block mb-2">Próxima Sesión Clínicia</span>
                   <p className="text-sm font-bold truncate mb-1">{nextMeeting.title}</p>
                   <p className="text-[10px] font-medium opacity-60">{nextMeeting.date.toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-sm">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Personal Identificado</h4>
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
               <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                 <span className="material-symbols-outlined">person</span>
               </div>
               <div>
                 <p className="text-xs font-black text-gray-800">{props.user?.name || 'Usuario'}</p>
                 <p className="text-[10px] font-bold text-indigo-500 uppercase">{props.user?.role === 'Coordinador' ? 'Elena (Coord.)' : props.user?.role}</p>
               </div>
            </div>
          </div>
        </aside>

        {/* MAIN CALENDAR */}
        <main className="flex-1 order-1 lg:order-2">
          <UnifiedCalendar 
            meetings={props.meetings} 
            guardias={props.guardias} 
            libranzas={props.libranzas}
            doblas={props.doblas}
            manualHolidays={props.manualHolidays}
            onAddGuardia={props.onAddGuardia} 
            onDeleteGuardia={props.onDeleteGuardia}
            onAddLibranza={props.onAddLibranza}
            onDeleteLibranza={props.onDeleteLibranza}
            onAddDobla={props.onAddDobla}
            onDeleteDobla={props.onDeleteDobla}
            onAddMeeting={props.onAddMeeting}
            currentUser={props.user}
            onNavigateToSession={props.onNavigateToSession}
            activeCategory={activeSub as any}
          />
        </main>
      </div>
    </div>
  );
};
