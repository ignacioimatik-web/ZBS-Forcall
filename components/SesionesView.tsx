
import React, { useState } from 'react';
import { UnifiedCalendar } from './UnifiedCalendar';
import { SessionManager } from './SessionManager';
import { Meeting, User, MeetingType, Guardia, Libranza, Dobla } from '../types';

interface SesionesViewProps {
  meetings: Meeting[];
  guardias: Guardia[];
  libranzas: Libranza[];
  doblas: Dobla[];
  onAddMeeting: (meeting: Meeting) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: string) => void;
  onCancelMeeting: (id: string, reason: string) => void;
  user: User | null;
}

export const SesionesView: React.FC<SesionesViewProps> = ({
  meetings,
  guardias,
  libranzas,
  doblas,
  onAddMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onCancelMeeting,
  user
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'manager'>('calendar');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  const handleNavigateToSession = (id: string) => {
    setSelectedMeetingId(id);
    setViewMode('manager');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Seccional */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-6 md:rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 -mx-4 md:mx-0 transition-all">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Sesiones y Formación</h2>
            <p className="text-xs opacity-80 font-bold tracking-widest uppercase">Calendario Académico y de Equipo</p>
          </div>
        </div>

        <div className="flex bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            Calendario
          </button>
          <button
            onClick={() => setViewMode('manager')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'manager' ? 'bg-white text-gray-900 shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">description</span>
            Actas y Detalles
          </button>
        </div>
      </div>

      <div className="animate-slide-in-up">
        {viewMode === 'calendar' ? (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-purple-100 flex items-start gap-3 shadow-sm no-print">
              <span className="material-symbols-outlined text-purple-600">info</span>
              <p className="text-xs text-gray-600 leading-tight">
                Haz clic en cualquier día para añadir una <strong>Reunión de Equipo</strong>, <strong>Sesión Clínica</strong> o <strong>Taller</strong>. 
                Los eventos se sincronizarán automáticamente con el Dashboard de la zona.
              </p>
            </div>
            
            <UnifiedCalendar 
              meetings={meetings} 
              guardias={guardias}
              libranzas={libranzas}
              doblas={doblas}
              onAddGuardia={() => {}} 
              onDeleteGuardia={() => {}}
              onAddLibranza={() => {}}
              onDeleteLibranza={() => {}}
              onAddDobla={() => {}}
              onDeleteDobla={() => {}}
              onAddMeeting={onAddMeeting}
              currentUser={user}
              onNavigateToSession={handleNavigateToSession}
            />
          </div>
        ) : (
          <SessionManager 
            sessions={meetings}
            onUpdateSession={onUpdateMeeting}
            onDeleteSession={onDeleteMeeting}
            onAddSession={onAddMeeting}
            onCancelSession={onCancelMeeting}
            externalSelectedId={selectedMeetingId}
            onSelectSession={setSelectedMeetingId}
            currentUser={user}
          />
        )}
      </div>
    </div>
  );
};
