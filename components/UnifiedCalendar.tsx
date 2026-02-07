
import React, { useState, useMemo } from 'react';
import { Meeting, MeetingType, Guardia, User, ManualHoliday, Libranza, Dobla, PersonnelType } from '../types';
import { getHolidayName } from '../utils';

declare var html2pdf: any;

interface UnifiedCalendarProps {
  meetings: Meeting[];
  guardias: Guardia[];
  libranzas?: Libranza[];
  doblas?: Dobla[];
  manualHolidays?: ManualHoliday[];
  onAddGuardia: (guardia: Guardia) => void;
  onDeleteGuardia: (id: string) => void;
  onAddLibranza: (libranza: Libranza) => void;
  onDeleteLibranza: (id: string) => void;
  onAddDobla: (dobla: Dobla) => void;
  onDeleteDobla: (id: string) => void;
  onAddMeeting?: (meeting: Meeting) => void;
  currentUser: User | null;
  onNavigateToSession: (sessionId: string) => void;
  hideHeader?: boolean;
  isReadOnly?: boolean;
  activeCategory?: 'Medicina' | 'Enfermería' | 'Libranzas' | 'Refuerzo' | 'Todo';
}

export const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({ 
  meetings, 
  guardias, 
  libranzas = [],
  doblas = [],
  onAddGuardia,
  onDeleteGuardia,
  onAddLibranza,
  onDeleteLibranza,
  onAddDobla,
  onDeleteDobla,
  onNavigateToSession,
  currentUser,
  isReadOnly = false,
  activeCategory = 'Todo'
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [personnelName, setPersonnelName] = useState('');

  // Elena es la única con permiso de edición total (Passcode 0000 asigna rol Coordinador)
  const canEdit = !isReadOnly && currentUser?.role === 'Coordinador';

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1));
  }, [currentMonth]);

  const getEventsForDay = (date: Date) => {
    const dStr = date.toDateString();
    
    // Filtrar según la categoría activa
    const filteredGuardias = guardias.filter(g => {
      const isDay = g.date.toDateString() === dStr;
      if (!isDay) return false;
      if (activeCategory === 'Todo') return true;
      if (activeCategory === 'Medicina') return g.type === 'Médica';
      if (activeCategory === 'Enfermería') return g.type === 'Enfermería';
      return false;
    });

    const filteredLibranzas = libranzas.filter(l => {
      const isDay = l.date.toDateString() === dStr;
      return isDay && (activeCategory === 'Todo' || activeCategory === 'Libranzas');
    });

    const filteredDoblas = doblas.filter(d => {
      const isDay = d.date.toDateString() === dStr;
      return isDay && (activeCategory === 'Todo' || activeCategory === 'Refuerzo');
    });

    const filteredMeetings = activeCategory === 'Todo' 
      ? meetings.filter(m => m.date.toDateString() === dStr)
      : [];

    return {
      meetings: filteredMeetings,
      guardias: filteredGuardias,
      libranzas: filteredLibranzas,
      doblas: filteredDoblas,
      holidayName: getHolidayName(date)
    };
  };

  const getEventStyle = (type: string, isLibranza = false, isDobla = false) => {
    if (isLibranza) return 'bg-orange-100 text-orange-700 border-orange-200'; // Libranzas Naranja
    if (isDobla) return 'bg-stone-200 text-stone-800 border-stone-300'; // Refuerzo Marrón
    
    switch (type) {
      case 'Médica': return 'bg-green-100 text-green-700 border-green-200'; // Medicina Verde
      case 'Enfermería': return 'bg-red-100 text-red-700 border-red-200'; // Enfermería Rojo
      default: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  const handleCellClick = (date: Date) => {
    if (!canEdit || activeCategory === 'Todo') return;
    setSelectedDate(date);
    setPersonnelName('');
    setIsModalOpen(true);
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !personnelName.trim()) return;

    const id = Date.now().toString();
    const common = { id, date: selectedDate, personnelName: personnelName.trim() };

    if (activeCategory === 'Medicina') onAddGuardia({ ...common, type: 'Médica' });
    else if (activeCategory === 'Enfermería') onAddGuardia({ ...common, type: 'Enfermería' });
    else if (activeCategory === 'Libranzas') onAddLibranza({ ...common, type: 'Médica' }); // Simplificación de tipo
    else if (activeCategory === 'Refuerzo') onAddDobla({ ...common, type: 'Médica' });

    setIsModalOpen(false);
  };

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(next);
  };

  const downloadPDF = () => {
    const element = document.getElementById('calendar-container');
    if (!element) return;
    const opt = {
      margin: 5,
      filename: `calendario-${activeCategory}-${currentMonth.getFullYear()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div id="calendar-container" className="w-full space-y-6 animate-fade-in p-2 md:p-4 bg-stone-50/10">
      {/* TOOLBAR */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-white/40 shadow-sm no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-xl transition-all">
            <span className="material-symbols-outlined text-gray-500">arrow_back_ios_new</span>
          </button>
          <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase min-w-[200px] text-center">
            {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-xl transition-all">
            <span className="material-symbols-outlined text-gray-500">arrow_forward_ios</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {canEdit && activeCategory !== 'Todo' && (
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">edit</span> MODO EDICIÓN ACTIVADO
            </span>
          )}
          <button onClick={downloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 no-print">
            <span className="material-symbols-outlined text-sm">download</span> PDF A4
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
          <div key={d} className="text-center p-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">{d}</div>
        ))}
        
        {daysInMonth.map((date, i) => {
          const { meetings: dayM, guardias: dayG, libranzas: dayL, doblas: dayD, holidayName } = getEventsForDay(date);
          const isToday = new Date().toDateString() === date.toDateString();
          
          return (
            <div 
              key={i} 
              onClick={() => handleCellClick(date)}
              className={`min-h-[140px] p-3 rounded-2xl border transition-all duration-300 group relative
                ${isToday ? 'bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white/70 backdrop-blur-sm border-white/60'}
                ${canEdit && activeCategory !== 'Todo' ? 'cursor-pointer hover:border-emerald-300 hover:shadow-lg' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-lg font-black ${isToday ? 'text-indigo-600' : holidayName ? 'text-red-500' : 'text-gray-400'}`}>
                  {date.getDate()}
                </span>
                {holidayName && <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm"></span>}
              </div>

              <div className="space-y-1">
                {[...dayG, ...dayM, ...dayL, ...dayD].map((ev: any, idx) => (
                  <div 
                    key={idx}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold border truncate group/item relative ${getEventStyle(ev.type, !!ev.id.includes('lib'), !!ev.id.includes('dob'))}`}
                  >
                    {ev.title || ev.personnelName}
                    {canEdit && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation();
                          if (ev.type) onDeleteGuardia(ev.id);
                          else if (ev.id.includes('lib')) onDeleteLibranza(ev.id);
                          else onDeleteDobla(ev.id);
                        }}
                        className="absolute right-1 top-1 opacity-0 group-hover/item:opacity-100 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <span className="material-symbols-outlined text-[10px]">close</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ADICIÓN (Solo Elena) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-slide-in-up">
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">add_circle</span>
              Añadir {activeCategory}
            </h3>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</p>
                <p className="font-bold text-gray-800">{selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Personal</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={personnelName}
                  onChange={(e) => setPersonnelName(e.target.value)}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-bold"
                  placeholder="Ej: Dra. Elena Benages"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
