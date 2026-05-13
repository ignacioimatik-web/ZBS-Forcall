
import React, { useState, useEffect, useRef } from 'react';
import { Meeting, MeetingType, User } from '../types';
import { useT } from '../lib/i18n';
import { ConfirmationModal } from './ConfirmationModal';

interface SessionManagerProps {
  sessions: Meeting[];
  onUpdateSession: (updatedSession: Meeting) => void;
  onDeleteSession: (sessionId: string) => void;
  onAddSession: (newSession: Meeting) => void;
  onCancelSession: (sessionId: string, reason: string) => void;
  externalSelectedId?: string | null;
  onSelectSession?: (id: string | null) => void;
  currentUser: User | null;
}

interface SessionFormData {
  title: string;
  speaker: string;
  date: string;
  time: string;
  description: string;
  presentationUrl: string;
  isDriveLink: boolean;
}

const initialForm: SessionFormData = {
  title: '',
  speaker: '',
  date: new Date().toISOString().split('T')[0],
  time: '08:30',
  description: '',
  presentationUrl: '',
  isDriveLink: false
};

export const SessionManager: React.FC<SessionManagerProps> = ({ 
  sessions, 
  onUpdateSession, 
  onDeleteSession,
  onAddSession,
  onCancelSession,
  externalSelectedId,
  onSelectSession,
  currentUser
}) => {
  const { t } = useT();
  const [selectedId, setSelectedId] = useState<string | null>(externalSelectedId || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SessionFormData>(initialForm);
  const [urlError, setUrlError] = useState<string | null>(null);
  
  const [summaryInput, setSummaryInput] = useState('');
  const [proposalInput, setProposalInput] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [showSummarySuccess, setShowSummarySuccess] = useState(false);
  const [lastAddedProposalId, setLastAddedProposalId] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const selectedSession = sessions.find(s => s.id === selectedId);
  const clinicalSessions = sessions.filter(s => s.type === MeetingType.CLINICAL);
  
  const canEdit = currentUser?.role === 'Administrador' || currentUser?.role === 'Coordinador';

  useEffect(() => {
    if (externalSelectedId !== undefined) {
      setSelectedId(externalSelectedId);
      if (externalSelectedId) {
        const session = sessions.find(s => s.id === externalSelectedId);
        if (session) {
          setSummaryInput(session.summary || '');
        }
      }
    }
  }, [externalSelectedId, sessions]);

  useEffect(() => {
    if (selectedId && sidebarRef.current) {
      const activeElement = sidebarRef.current.querySelector(`[data-id="${selectedId}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedId, clinicalSessions.length]);

  const handleOpenCreate = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setUrlError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = () => {
    if (!selectedSession) return;
    setFormData({
      title: selectedSession.title,
      speaker: selectedSession.speaker || '',
      date: selectedSession.date.toISOString().split('T')[0],
      time: selectedSession.time || '08:30',
      description: selectedSession.description || '',
      presentationUrl: selectedSession.presentationUrl || '',
      isDriveLink: selectedSession.presentationUrl?.includes('drive.google.com') || false
    });
    setIsEditing(true);
    setUrlError(null);
    setIsModalOpen(true);
  };

  const validateDriveUrl = (url: string) => {
    if (formData.isDriveLink && url.trim() !== '') {
       const googleUrlPattern = /^https?:\/\/(?:www\.)?(?:docs|drive)\.google\.com\//;
       if (!googleUrlPattern.test(url)) {
          setUrlError(t('sessionManager.driveUrlError'));
          return false;
       }
    }
    setUrlError(null);
    return true;
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!validateDriveUrl(formData.presentationUrl)) return;

    const sessionData: Meeting = {
      id: isEditing && selectedId ? selectedId : Date.now().toString(),
      title: formData.title,
      type: MeetingType.CLINICAL,
      date: new Date(formData.date),
      time: formData.time,
      speaker: formData.speaker,
      description: formData.description,
      presentationUrl: formData.presentationUrl,
      isConfirmed: true,
      summary: isEditing ? selectedSession?.summary : '',
      proposals: isEditing ? selectedSession?.proposals : [],
      isCancelled: isEditing ? selectedSession?.isCancelled : false
    };

    if (isEditing) {
      onUpdateSession(sessionData);
    } else {
      onAddSession(sessionData);
      if (onSelectSession) onSelectSession(sessionData.id);
      setSelectedId(sessionData.id);
    }
    setIsModalOpen(false);
  };

  const handleSaveSummary = () => {
    if (selectedSession && summaryInput) {
      onUpdateSession({ ...selectedSession, summary: summaryInput });
      setShowSummarySuccess(true);
      setTimeout(() => setShowSummarySuccess(false), 3000);
    }
  };

  const handleAddProposal = () => {
    if (selectedSession && proposalInput.trim()) {
      const newId = Date.now().toString();
      const newProposal = {
        id: newId,
        author: currentUser?.name || "Usuario Forcall",
        text: proposalInput,
        date: new Date().toLocaleDateString()
      };
      
      onUpdateSession({
        ...selectedSession,
        proposals: [...(selectedSession.proposals || []), newProposal]
      });
      
      setProposalInput('');
      setLastAddedProposalId(newId);
      
      // Limpiar el ID de animación después de que termine la transición
      setTimeout(() => setLastAddedProposalId(null), 1000);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedSession && canEdit) {
      onDeleteSession(selectedSession.id);
      setIsDeleteModalOpen(false);
      if (onSelectSession) onSelectSession(null);
      setSelectedId(null);
    }
  };

  const handleSelect = (id: string) => {
    if (onSelectSession) onSelectSession(id);
    setSelectedId(id);
    const session = sessions.find(s => s.id === id);
    if (session) {
      setSummaryInput(session.summary || '');
      setShowSummarySuccess(false);
      setLastAddedProposalId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
        {/* Sidebar List */}
        <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col no-print">
          <div className="p-4 bg-earth-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">{t('sessionManager.clinicalSessions')}</h3>
            {canEdit && (
              <button 
                onClick={handleOpenCreate}
                className="p-1.5 bg-forcall-600 text-white rounded-lg hover:bg-forcall-700 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                {t('sessionManager.new')}
              </button>
            )}
          </div>
          <div ref={sidebarRef} className="overflow-y-auto flex-1 p-2 space-y-2">
            {clinicalSessions.length > 0 ? (
              clinicalSessions.map((session) => (
                <div
                  key={session.id}
                  data-id={session.id}
                  onClick={() => handleSelect(session.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border-l-4 relative overflow-hidden hover:scale-[1.02] flex gap-3 items-center ${
                    selectedId === session.id 
                      ? 'bg-purple-50/50 border-purple-600 shadow-sm' 
                      : 'hover:bg-gray-50 border-transparent'
                  } ${session.isCancelled ? 'opacity-80' : ''}`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                    session.isCancelled 
                      ? 'bg-gray-100 text-gray-400' 
                      : (selectedId === session.id ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600')
                  }`}>
                    <span className="material-symbols-outlined text-xl">school</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className={`text-[10px] font-bold uppercase ${session.isCancelled ? 'text-red-500' : 'text-purple-600'}`}>
                        {session.date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        {session.time && ` | ${session.time}`}
                      </div>
                      {session.isCancelled && <span className="material-symbols-outlined text-[14px] text-red-500">cancel</span>}
                    </div>
                    <h4 className={`font-bold text-gray-900 leading-tight text-sm truncate ${session.isCancelled ? 'line-through text-gray-500' : ''}`}>
                      {session.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5 font-medium">{session.speaker}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">{t('sessionManager.noSessions')}</div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col print:border-0 print:shadow-none print:w-full">
          {selectedSession ? (
            <div className="flex-1 overflow-y-auto bg-gray-50/30 print:bg-white print:overflow-visible">
              
              {/* CABECERA OFICIAL PARA IMPRESIÓN/PDF */}
              <div className="print-only mb-10 border-b-2 border-gray-900 pb-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">{t('sessionManager.minutes')}</h1>
                    <p className="text-lg font-bold text-gray-700">{t('sessionManager.healthArea')}</p>
                    <p className="text-sm text-gray-500 mt-1 uppercase font-bold tracking-widest">{t('sessionManager.region')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{t('sessionManager.date')} {selectedSession.date.toLocaleDateString('es-ES')}</p>
                    <p className="text-xs text-gray-400 font-black uppercase mt-1">Ref: {selectedSession.id}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-b border-gray-200 print:border-b-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 no-print">
                       <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${selectedSession.isCancelled ? 'bg-red-100 text-red-700' : 'text-forcall-600 bg-forcall-50'}`}>
                         {selectedSession.isCancelled ? t('sessionManager.cancelled') : t('sessionManager.clinicalSession')}
                       </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`material-symbols-outlined text-2xl no-print ${selectedSession.isCancelled ? 'text-red-500' : 'text-purple-600'}`}>school</span>
                      <h2 className={`text-2xl font-bold ${selectedSession.isCancelled ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{selectedSession.title}</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg print:bg-white print:p-0 print:font-bold">
                        <span className="material-symbols-outlined text-[18px] no-print">person</span>
                        <span>{t('sessionManager.speaker')} {selectedSession.speaker}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg print:bg-white print:p-0 print:font-bold">
                        <span className="material-symbols-outlined text-[18px] no-print">calendar_today</span>
                        <span>{t('sessionManager.date')} {selectedSession.date.toLocaleDateString('es-ES')} {selectedSession.time && ` ${t('sessionManager.atTime')} ${selectedSession.time}`}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 no-print">
                    <button onClick={handlePrint} title={t('sessionManager.printTooltip')} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-forcall-50 text-forcall-600 transition-all flex items-center gap-2 font-bold text-xs shadow-sm active:scale-95"><span className="material-symbols-outlined">print</span> {t('common.pdf')}</button>
                    {canEdit && (
                      <>
                        <button onClick={handleOpenEdit} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-all"><span className="material-symbols-outlined">edit</span></button>
                        <button onClick={() => setIsDeleteModalOpen(true)} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-red-50 text-gray-500 transition-all"><span className="material-symbols-outlined">delete</span></button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                 {/* Resumen Card */}
                 <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm print:border-0 print:p-0 print:shadow-none">
                   <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 print:text-lg">
                     <span className="material-symbols-outlined text-purple-600 font-bold no-print">article</span>
                      {t('sessionManager.summary')}
                    </h3>
                   <textarea
                      value={summaryInput}
                      onChange={(e) => setSummaryInput(e.target.value)}
                      placeholder={t('sessionManager.summarize')}
                      rows={6}
                      className="w-full text-sm border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-100 transition-all outline-none no-print"
                    />
                    {/* Texto visible solo en impresión que reemplaza al textarea */}
                    <div className="hidden print:block print-text-block">
                      {summaryInput || t('sessionManager.noSummary')}
                    </div>

                    <div className="flex justify-between items-center mt-3 no-print">
                      {showSummarySuccess ? (
                        <span className="text-xs font-bold text-green-600 flex items-center gap-1 animate-fade-in">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          {t('sessionManager.minutesSaved')}
                        </span>
                      ) : <span></span>}
                      {canEdit && <button onClick={handleSaveSummary} className="px-5 py-2 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-md active:scale-95">{t('sessionManager.saveMinutes')}</button>}
                    </div>
                 </div>

                 {/* Propuestas y Comentarios Card */}
                 <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm print:border-0 print:p-0 print:shadow-none">
                   <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 print:text-lg">
                     <span className="material-symbols-outlined text-purple-600 no-print">forum</span>
                      {t('sessionManager.participation')}
                    </h3>
                   
                   <div className="space-y-3 mb-6">
                     {selectedSession.proposals && selectedSession.proposals.length > 0 ? (
                       selectedSession.proposals.map((prop) => (
                         <div 
                           key={prop.id} 
                           className={`p-3 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm print:border-l-2 print:border-gray-200 print:bg-white print:rounded-none print:shadow-none ${lastAddedProposalId === prop.id ? 'animate-slide-in-right' : ''}`}
                         >
                           <div className="flex justify-between items-start mb-1">
                             <span className="text-[10px] font-black text-forcall-700 uppercase tracking-tight print:text-black">{prop.author}</span>
                             <span className="text-[9px] text-gray-400 font-bold">{prop.date}</span>
                           </div>
                           <p className="text-sm text-gray-700 leading-relaxed">{prop.text}</p>
                         </div>
                       ))
                     ) : (
                       <div className="py-6 text-center text-gray-400 text-xs flex flex-col items-center gap-2 print:hidden">
                         <span className="material-symbols-outlined text-3xl opacity-20">chat_bubble</span>
                          <p className="italic">{t('sessionManager.noProposals')}</p>
                       </div>
                     )}
                   </div>

                   <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 no-print">
                     <input 
                       type="text" 
                       value={proposalInput}
                       onChange={(e) => setProposalInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAddProposal()}
                        placeholder={t('sessionManager.addProposal')}
                        className="flex-1 bg-transparent border-none text-sm focus:ring-0 px-2"
                     />
                     <button 
                       onClick={handleAddProposal} 
                       disabled={!proposalInput.trim()}
                       className="w-10 h-10 bg-forcall-600 text-white rounded-xl flex items-center justify-center shadow-md hover:bg-forcall-700 disabled:opacity-50 transition-all active:scale-90"
                     >
                       <span className="material-symbols-outlined">send</span>
                     </button>
                   </div>
                 </div>

                 {/* ESPACIO PARA FIRMAS EN IMPRESIÓN */}
                 <div className="hidden print:grid grid-cols-2 gap-20 mt-20">
                   <div className="text-center">
                      <div className="border-t-2 border-black pt-2 text-xs font-black uppercase tracking-widest">{t('sessionManager.sessionSpeaker')}</div>
                     <p className="text-[10px] mt-2 italic text-gray-500 font-medium">{selectedSession.speaker}</p>
                   </div>
                   <div className="text-center">
                      <div className="border-t-2 border-black pt-2 text-xs font-black uppercase tracking-widest">{t('sessionManager.coordinationZbs')}</div>
                      <p className="text-[10px] mt-2 italic text-gray-500 font-medium">{t('sessionManager.zbsSeal')}</p>
                   </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
               <span className="material-symbols-outlined text-4xl mb-2 opacity-20">school</span>
               <p className="font-bold uppercase text-[10px] tracking-widest">{t('sessionManager.selectSession')}</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                {isEditing ? t('sessionManager.editSession') : `${t('sessionManager.schedule')} ${t('sessionManager.clinicalSession')}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveSession} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('sessionManager.title')}</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-forcall-50 transition-all font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('sessionManager.speakerLabel')}</label>
                  <input required type="text" value={formData.speaker} onChange={e => setFormData({ ...formData, speaker: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-forcall-50 transition-all font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('sessionManager.dateLabel')}</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-forcall-50 transition-all font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('sessionManager.startTime')}</label>
                  <input required type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-forcall-50 transition-all font-bold" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 text-xs">
                {isEditing ? t('sessionManager.updateSession') : t('sessionManager.confirmSession')}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        title={t('sessionManager.deleteSession')}
        message={t('sessionManager.deleteConfirmation')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
};
