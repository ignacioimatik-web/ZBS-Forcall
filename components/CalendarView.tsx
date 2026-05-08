
import React, { useState } from 'react';
import { Meeting, MeetingType } from '../types';

interface CalendarViewProps {
  meetings: Meeting[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ meetings }) => {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  
  // Simple mock calendar logic for the current month (assuming approx 30 days)
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(i + 1);
    return date;
  });

  const getEventsForDay = (date: Date) => {
    return meetings.filter(m => 
      m.date.getDate() === date.getDate() && 
      m.date.getMonth() === date.getMonth()
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-bold text-lg text-gray-800">Calendario Mensual</h2>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Equipo</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Medicina</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> enfermeria</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Clínica</span>
        </div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDays.map(d => (
          <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500 uppercase">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[100px]">
        {days.map((date, idx) => {
          const events = getEventsForDay(date);
          return (
            <div key={idx} className="border-r border-b border-gray-100 p-2 hover:bg-gray-50 transition-colors relative group">
              <span className={`text-sm font-medium ${date.getDay() === 0 || date.getDay() === 6 ? 'text-red-400' : 'text-gray-700'}`}>
                {date.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {events.map(ev => (
                  <button 
                    key={ev.id} 
                    onClick={() => setSelectedMeeting(ev)}
                    title={ev.isCancelled ? `CANCELADA: ${ev.title}` : ev.title}
                    className={`w-full text-left text-[10px] px-1 py-0.5 rounded truncate font-medium cursor-pointer transition-all hover:opacity-80 hover:scale-[1.02] ${
                      ev.isCancelled ? 'bg-red-50 text-red-400 line-through border border-red-100' :
                      ev.type === MeetingType.TEAM ? 'bg-blue-100 text-blue-700' :
                      ev.type === MeetingType.MEDICINE ? 'bg-green-100 text-green-700' :
                      ev.type === MeetingType.NURSING ? 'bg-pink-100 text-pink-700' : 
                      'bg-purple-100 text-purple-700 border-l-2 border-purple-500'
                    }`}
                  >
                    {ev.type === MeetingType.CLINICAL && !ev.isCancelled ? '★ ' : ''}{ev.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedMeeting(null)}>
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-in-up" 
              onClick={e => e.stopPropagation()}
            >
                {/* Color strip based on type */}
                 <div className={`h-2 w-full ${
                    selectedMeeting.isCancelled ? 'bg-red-500' :
                    selectedMeeting.type === MeetingType.TEAM ? 'bg-blue-500' :
                    selectedMeeting.type === MeetingType.MEDICINE ? 'bg-green-500' :
                    selectedMeeting.type === MeetingType.NURSING ? 'bg-pink-500' :
                    'bg-purple-500'
                }`}></div>
                
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            {selectedMeeting.isCancelled && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded w-fit mb-1">CANCELADA</span>
                            )}
                            <h3 className={`text-xl font-bold leading-tight ${selectedMeeting.isCancelled ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{selectedMeeting.title}</h3>
                        </div>
                        <button onClick={() => setSelectedMeeting(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                             <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="space-y-4 text-sm text-gray-600">
                        {selectedMeeting.isCancelled && selectedMeeting.cancellationReason && (
                             <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                <p className="text-red-800 text-xs font-bold mb-1">Motivo de cancelación:</p>
                                <p className="text-red-700 italic">{selectedMeeting.cancellationReason}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-gray-50 rounded-full">
                                <span className="material-symbols-outlined text-gray-500 text-lg">calendar_today</span>
                             </div>
                             <div>
                                <p className="text-xs text-gray-400">Fecha</p>
                                <p className="font-medium text-gray-800">{selectedMeeting.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                             </div>
                        </div>
                        
                        {/* Fix: Removed location field as it does not exist in the Meeting type */}

                        {selectedMeeting.speaker && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-full">
                                    <span className="material-symbols-outlined text-purple-500 text-lg">mic</span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Ponente</p>
                                    <p className="font-medium text-gray-800">{selectedMeeting.speaker}</p>
                                </div>
                            </div>
                        )}

                        {selectedMeeting.description && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                                <p className="italic text-gray-700">{selectedMeeting.description}</p>
                            </div>
                        )}
                        
                        <div className="pt-2">
                             <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                selectedMeeting.isCancelled ? 'bg-gray-200 text-gray-500' :
                                selectedMeeting.type === MeetingType.TEAM ? 'bg-blue-100 text-blue-700' :
                                selectedMeeting.type === MeetingType.MEDICINE ? 'bg-green-100 text-green-700' :
                                selectedMeeting.type === MeetingType.NURSING ? 'bg-pink-100 text-pink-700' :
                                'bg-purple-100 text-purple-700'
                             }`}>
                                {selectedMeeting.type}
                             </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
