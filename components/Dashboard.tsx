
import React from 'react';
import { Meeting, User, Guardia, Libranza, Dobla } from '../types';
import { UnifiedCalendar } from './UnifiedCalendar';

declare var html2pdf: any;

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
  onAddMeeting,
  user 
}) => {
  const stats = [
    { label: 'Med', count: guardias.filter(g => g.type === 'Médica').length, icon: 'stethoscope', color: 'text-green-500' },
    { label: 'Enf', count: guardias.filter(g => g.type === 'Enfermería').length, icon: 'vaccines', color: 'text-red-500' },
    { label: 'Lib', count: libranzas.length, icon: 'beach_access', color: 'text-orange-500' },
    { label: 'Ref', count: doblas.length, icon: 'dynamic_feed', color: 'text-stone-500' }
  ];

  const handleDownloadDashboard = () => {
    const element = document.getElementById('dashboard-calendar');
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `Calendario_General_Forcall_${new Date().toLocaleDateString('es-ES', { month: 'long' })}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const getGreeting = () => {
    if (!user) return 'Bienvenido/a';
    const { name, role } = user;
    if (name.toLowerCase().includes('invitado')) return `Bienvenido/a, ${name}`;
    if (name.includes('Dra')) return `Bienvenida, ${name}`;
    if (name.includes('Dr')) return `Bienvenido, ${name}`;
    const femaleNames = ['Elena', 'Delia', 'Xelo', 'Rosa', 'Maite', 'Silvia', 'Pilar'];
    if (femaleNames.some(fn => name.includes(fn))) return `Bienvenida, ${name}`;
    const maleNames = ['Fernando', 'Jorge', 'Frank', 'Ilie', 'Joan', 'Vicente', 'Carlos'];
    if (maleNames.some(mn => name.includes(mn))) return `Bienvenido, ${name}`;
    if (role === 'Enfermera') return `Bienvenida, ${name}`;
    if (role === 'Administrador') return `Bienvenido, ${name}`;
    return `Hola, ${name}`;
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-fade-in pb-12">
      <div className="bg-gradient-to-br from-forcall-800 to-forcall-900 md:rounded-3xl p-6 md:p-8 text-white shadow-xl -mx-4 md:mx-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">{getGreeting()}</h2>
            <p className="opacity-70 text-xs md:text-sm font-medium mt-1">Gestión Centralizada ZBS Forcall</p>
          </div>
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

      <div className="flex flex-col gap-6 -mx-4 md:mx-0">
        <div className="flex justify-between items-center px-4 md:px-0 no-print">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Cuadrante Consolidado</h3>
           <button 
            onClick={handleDownloadDashboard}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg active:scale-95"
           >
             <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Descargar Calendario
           </button>
        </div>
        <UnifiedCalendar 
          id="dashboard-calendar"
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
          hideHeader={false}
          isReadOnly={true}
        />
      </div>
    </div>
  );
};
