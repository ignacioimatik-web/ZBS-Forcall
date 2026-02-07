
import React, { useState } from 'react';
import { Guardia, User } from '../types';
import { getHolidayName } from '../utils';

interface GuardiasViewProps {
  guardias: Guardia[];
  onAddGuardia: (guardia: Guardia) => void;
  onDeleteGuardia: (id: string) => void;
  currentUser: User | null;
}

type FilterType = 'Todas' | 'Médica' | 'Enfermería';

export const GuardiasView: React.FC<GuardiasViewProps> = ({ guardias, onAddGuardia, onDeleteGuardia, currentUser }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todas');
  
  const [formData, setFormData] = useState({
    doctorName: '',
    nurseName: ''
  });

  const canEdit = currentUser?.role === 'Administrador' || currentUser?.role === 'Coordinador';

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getStartingDayIndex = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const days = getDaysInMonth(currentMonth);
  const startingEmptyCells = getStartingDayIndex(currentMonth);

  const getGuardiasForDay = (date: Date) => {
    const dayGuardias = guardias.filter(
      (g) =>
        g.date.getDate() === date.getDate() &&
        g.date.getMonth() === date.getMonth() &&
        g.date.getFullYear() === date.getFullYear()
    );

    if (activeFilter === 'Todas') return dayGuardias;
    return dayGuardias.filter(g => g.type === activeFilter);
  };

  const handleDayClick = (date: Date) => {
    if (!canEdit) return;
    setSelectedDay(date);
    setFormData({ doctorName: '', nurseName: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDay) {
      if (formData.doctorName.trim() !== '') {
        onAddGuardia({
          id: Date.now().toString(),
          date: selectedDay,
          type: 'Médica',
          personnelName: formData.doctorName,
        });
      }

      if (formData.nurseName.trim() !== '') {
        onAddGuardia({
          id: (Date.now() + 1).toString(), 
          date: selectedDay,
          type: 'Enfermería',
          personnelName: formData.nurseName,
        });
      }

      setIsModalOpen(false);
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const filterOptions: FilterType[] = ['Todas', 'Médica', 'Enfermería'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Guardias Mensuales</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            {canEdit ? 'Gestión de Turnos' : 'Consulta de Cuadrante'} ZBS Forcall
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            {filterOptions.map(option => (
              <button
                key={option}
                onClick={() => setActiveFilter(option)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  activeFilter === option 
                    ? 'bg-white text-forcall-700 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 border-l border-gray-100 pl-4">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-gray-400">chevron_left</span>
            </button>
            <span className="font-black text-gray-800 capitalize min-w-[140px] text-center text-sm tracking-widest">
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-900 border-b border-gray-900">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
            <div key={d} className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {Array.from({ length: startingEmptyCells }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-gray-50 bg-gray-50/20" />
          ))}

          {days.map((date) => {
             const dayGuardias = getGuardiasForDay(date);
             const isToday = new Date().toDateString() === date.toDateString();
             const isWeekend = date.getDay() === 0 || date.getDay() === 6;
             const holidayName = getHolidayName(date);
             const isFestivo = !!holidayName;

             return (
               <div 
                  key={date.toISOString()} 
                  onClick={() => handleDayClick(date)}
                  className={`min-h-[140px] p-2 border-b border-r border-gray-50 transition-all relative group 
                    ${isWeekend ? 'bg-slate-50/50' : 'bg-white'}
                    ${isFestivo ? 'bg-red-50/40' : ''}
                    ${canEdit ? 'cursor-pointer hover:bg-forcall-50/30' : ''}`}
               >
                 <div className="flex justify-between items-start mb-2 p-1">
                   <span className={`text-[11px] font-black w-7 h-7 flex items-center justify-center rounded-xl ${
                      isToday ? 'bg-forcall-600 text-white shadow-lg' : 
                      isFestivo ? 'text-red-600 font-black' : 
                      isWeekend ? 'text-slate-400' : 'text-gray-400'
                   }`}>
                     {date.getDate()}
                   </span>
                   
                   {isFestivo && (
                     <div className="absolute top-2 right-2 flex flex-col items-end">
                       <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-200"></span>
                       {/* Tooltip visible on Hover */}
                       <div className="absolute top-4 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 pointer-events-none">
                          <div className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl shadow-2xl border border-white/10 whitespace-nowrap">
                            {holidayName}
                          </div>
                       </div>
                     </div>
                   )}
                 </div>
                 
                 <div className="space-y-1.5 px-1">
                   {dayGuardias.map(g => (
                     <div 
                        key={g.id} 
                        className={`text-[9px] font-black py-1.5 px-2 rounded-lg flex justify-between items-center group/item shadow-sm border ${
                          g.type === 'Médica' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}
                      >
                        <div className="truncate uppercase tracking-tighter">
                           {g.personnelName}
                        </div>
                        {canEdit && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteGuardia(g.id); }}
                            className="opacity-0 group-hover/item:opacity-100 hover:text-red-600 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                     </div>
                   ))}
                 </div>
               </div>
             )
          })}
        </div>
      </div>

      {/* Leyenda Visual */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap gap-8 justify-center no-print">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-100 rounded border border-gray-200"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fin de Semana</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded border border-red-600"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Día Festivo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded border border-green-200"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Guardia Médica</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded border border-red-200"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Guardia Enfermería</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 rounded border border-orange-200"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Libranza</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-stone-200 rounded border border-stone-300"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Refuerzo</span>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 animate-slide-in-up">
            <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">
              Asignar Turno
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-forcall-50 p-4 rounded-2xl border border-forcall-100 mb-4">
                <p className="text-[10px] font-black text-forcall-700 uppercase tracking-widest mb-1">Día Seleccionado</p>
                <p className="font-bold text-forcall-900">{selectedDay?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-green-700 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">stethoscope</span> Personal Médico
                </label>
                <input
                  type="text"
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  placeholder="Nombre del doctor/a"
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-green-50 transition-all font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-red-700 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">vaccines</span> Personal Enfermería
                </label>
                <input
                  type="text"
                  value={formData.nurseName}
                  onChange={(e) => setFormData({ ...formData, nurseName: e.target.value })}
                  placeholder="Nombre enfermero/a"
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-50 transition-all font-bold text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formData.doctorName.trim() && !formData.nurseName.trim()}
                  className="flex-1 py-4 bg-forcall-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
