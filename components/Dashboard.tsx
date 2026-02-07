
import React from 'react';
import { Meeting, User, Guardia, Libranza, Dobla } from '../types';
import { UnifiedCalendar } from './UnifiedCalendar';

interface DashboardProps {
  meetings: Meeting[];
  guardias: Guardia[];
  libranzas: Libranza[];
  doblas: Dobla[];
  onNavigate: (tab: string) => void;
  onAddGuardia: (guardia: Guardia) => void;
  onDeleteGuardia: (id: string) => void;
  onAddLibranza: (libranza: Libranza) => void;
  onDeleteLibranza: (id: string) => void;
  onAddDobla: (dobla: Dobla) => void;
  onDeleteDobla: (id: string) => void;
  onNavigateToSession: (sessionId: string) => void;
  onAddMeeting: (meeting: Meeting) => void;
  user: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  meetings, 
  guardias, 
  libranzas,
  doblas,
  onNavigate, 
  onAddGuardia,
  onDeleteGuardia,
  onAddLibranza,
  onDeleteLibranza,
  onAddDobla,
  onDeleteDobla,
  onNavigateToSession,
  onAddMeeting,
  user 
}) => {
  const stats = [
    { label: 'Med', count: guardias.filter(g => g.type === 'Médica').length, icon: 'stethoscope', color: 'text-green-500' },
    { label: 'Enf', count: guardias.filter(g => g.type === 'Enfermería').length, icon: 'vaccines', color: 'text-red-500' },
    { label: 'Lib', count: libranzas.length, icon: 'beach_access', color: 'text-orange-500' },
    { label: 'Ref', count: doblas.length, icon: 'dynamic_feed', color: 'text-stone-500' }
  ];

  const getGreeting = () => {
    if (!user) return 'Bienvenido/a';
    const name = user.name;
    const role = user.role;

    // 1. Caso Invitado
    if (name === 'Invitado') return `Bienvenido/a ${name}`;

    // 2. Caso Doctores (por prefijo)
    if (name.startsWith('Dra.')) return `Bienvenida ${name}`;
    if (name.startsWith('Dr.')) return `Bienvenido ${name}`;

    // 3. Caso Enfermería (por Rol o por nombre conocido si es coordinadora)
    const knownNurses = ['Xelo Carbó', 'Rosa', 'Maite'];
    if (role === 'Enfermera' || knownNurses.some(n => name.includes(n))) {
      return `Bienvenida ${name}`;
    }

    // 4. Caso Administrativo
    if (role === 'Administrador' || name === 'Joan') {
      return `Bienvenido ${name}`;
    }

    // 5. Fallback por rol genérico
    return `${(role as string) === 'Enfermera' ? 'Bienvenida' : 'Bienvenido'} ${name}`;
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-fade-in pb-12">
      {/* Hero Welcome Section - More compact on mobile */}
      <div className="bg-gradient-to-br from-forcall-800 to-forcall-900 md:rounded-3xl p-6 md:p-8 text-white shadow-xl -mx-4 md:mx-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">{getGreeting()}</h2>
            <p className="opacity-70 text-xs md:text-sm font-medium mt-1">Gestión Centralizada ZBS Forcall</p>
          </div>
          
          {/* Stats Bar - Minimalist and Mobile Friendly */}
          <div className="flex items-center gap-2 md:gap-4 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 overflow-x-auto max-w-full no-scrollbar">
            {stats.map((stat, idx) => (
              <div key={stat.label} className="flex items-center gap-2 px-3 py-1 border-r last:border-0 border-white/10 whitespace-nowrap">
                <span className={`material-symbols-outlined text-lg ${stat.color}`}>{stat.icon}</span>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-black">{stat.count}</span>
                  <span className="text-[8px] font-black uppercase opacity-60 tracking-tighter">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <UnifiedCalendar 
          meetings={meetings} 
          guardias={guardias} 
          libranzas={libranzas}
          doblas={doblas}
          onAddGuardia={onAddGuardia} 
          onDeleteGuardia={onDeleteGuardia}
          onAddLibranza={onAddLibranza}
          onDeleteLibranza={onDeleteLibranza}
          onAddDobla={onAddDobla}
          onDeleteDobla={onDeleteDobla}
          onAddMeeting={onAddMeeting}
          currentUser={user}
          onNavigateToSession={onNavigateToSession}
          hideHeader={true}
          isReadOnly={true} // Calendario de la Dashboard NO editable
        />
      </div>
    </div>
  );
};
