import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Guardia, Libranza, Dobla, Vacacion } from '../types';
import { USERS } from '../lib/users';

type ActionType = 'assign' | 'delete' | 'annotate';

interface VoiceEntry {
  id: string;
  date: string;
  day: number;
  month: number;
  year: number;
  category: 'guardia' | 'libranza' | 'refuerzo' | 'vacacion';
  type: 'medica' | 'enfermeria';
  personnelName: string;
}

interface VoiceAnnotation {
  id: string;
  text: string;
  date?: string;
}

interface ExistingEntry {
  id: string;
  date: Date;
  personnelName: string;
  type: 'medica' | 'enfermeria';
}

interface VoiceShiftInputProps {
  onAddGuardia: (guardia: Guardia) => Promise<boolean | void>;
  onAddLibranza: (libranza: Libranza) => Promise<void>;
  onAddDobla: (dobla: Dobla) => Promise<void>;
  onAddVacacion: (vacacion: Vacacion) => Promise<void>;
  onDeleteGuardia?: (id: string) => Promise<boolean | void>;
  onDeleteLibranza?: (id: string) => Promise<boolean | void>;
  onDeleteDobla?: (id: string) => Promise<boolean | void>;
  onDeleteVacacion?: (id: string) => Promise<boolean | void>;
  guardias?: ExistingEntry[];
  libranzas?: ExistingEntry[];
  doblas?: ExistingEntry[];
  vacaciones?: ExistingEntry[];
  currentUser: { id?: string } | null;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ALL_PERSONNEL = USERS.map(u => u.name);

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTH_LOWER = MONTHS.map(m => m.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

const CATEGORY_LABELS: Record<string, string> = {
  guardia: 'Guardia',
  libranza: 'Libranza',
  refuerzo: 'Refuerzo',
  vacacion: 'Vacación',
};

const TYPE_LABELS: Record<string, string> = {
  medica: 'Medicina',
  enfermeria: 'Enfermeria',
};

function generateId(): string {
  return 'voice-' + (crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11));
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeText(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findPersonName(text: string): { name: string; typeHint: 'medica' | 'enfermeria' | null } | null {
  const normalized = normalizeText(text);
  let bestMatch: { name: string; typeHint: 'medica' | 'enfermeria' | null } | null = null;
  let bestLength = 0;

  for (const person of ALL_PERSONNEL) {
    const normalizedPerson = normalizeText(person);
    const matchedAll = normalizedPerson.split(/\s+/).every(pp => pp.length < 2 || normalized.includes(pp));
    if (matchedAll && normalizedPerson.length > bestLength) {
      const user = USERS.find(u => u.name === person);
      bestMatch = { name: person, typeHint: user?.category === 'enfermeria' ? 'enfermeria' : 'medica' };
      bestLength = normalizedPerson.length;
    }
  }
  return bestMatch;
}

function findMonth(text: string): number | null {
  const normalized = normalizeText(text);
  for (let i = 0; i < MONTH_LOWER.length; i++) {
    if (normalized.includes(MONTH_LOWER[i])) return i;
  }
  return null;
}

function findCategory(text: string): 'guardia' | 'libranza' | 'refuerzo' | 'vacacion' | null {
  const t = normalizeText(text);
  if (/guardia/i.test(t)) return 'guardia';
  if (/libranza/i.test(t)) return 'libranza';
  if (/refuerzo|dobla/i.test(t)) return 'refuerzo';
  if (/vacacion|vacaciones|vaca/i.test(t)) return 'vacacion';
  return null;
}

function findDays(text: string): number[] {
  const matches = text.match(/\b(\d{1,2})\b/g);
  if (!matches) return [];
  return [...new Set(matches.map(Number).filter(n => n >= 1 && n <= 31))].sort((a, b) => a - b);
}

function detectAction(text: string): ActionType {
  const t = normalizeText(text);
  if (/^borra|^elimina|^quita|borrar|eliminar|quitar/i.test(t)) return 'delete';
  if (/^nota|^anotacion|^anotación|^apunte/i.test(t)) return 'annotate';
  return 'assign';
}

function parseAssignText(text: string, refMonth: number, refYear: number): VoiceEntry[] {
  if (!text.trim()) return [];
  const personResult = findPersonName(text);
  if (!personResult) return [];
  const category = findCategory(text) || 'guardia';
  const month = findMonth(text) ?? refMonth;
  const days = findDays(text);
  if (days.length === 0) return [];
  return days.map(day => {
    const date = new Date(refYear, month, day);
    return {
      id: generateId(),
      date: formatDate(date),
      day,
      month,
      year: refYear,
      category,
      type: personResult.typeHint || 'medica',
      personnelName: personResult.name,
    };
  });
}

function parseDeleteText(text: string, refMonth: number, refYear: number): Omit<VoiceEntry, 'id'>[] {
  if (!text.trim()) return [];
  const personResult = findPersonName(text);
  if (!personResult) return [];
  const category = findCategory(text) || 'guardia';
  const month = findMonth(text) ?? refMonth;
  const days = findDays(text);
  if (days.length === 0) return [];
  return days.map(day => ({
    date: formatDate(new Date(refYear, month, day)),
    day,
    month,
    year: refYear,
    category,
    type: personResult.typeHint || 'medica',
    personnelName: personResult.name,
  }));
}

function parseAnnotateText(text: string): { noteText: string; noteDate?: string } | null {
  const t = normalizeText(text);
  const match = t.match(/^(?:nota|anotacion|anotación|apunte)\s*(?::\s*)?(.*)/i);
  if (!match) return { noteText: text.trim() };
  const noteText = text.slice(text.indexOf(match[1])).trim();
  if (!noteText) return null;
  const dayNumbers = findDays(text);
  const month = findMonth(text);
  if (dayNumbers.length > 0 && month !== null) {
    const now = new Date();
    const year = now.getFullYear();
    const date = formatDate(new Date(year, month, dayNumbers[0]));
    return { noteText, noteDate: date };
  }
  return { noteText };
}

function matchExistingEntries(
  parsed: Omit<VoiceEntry, 'id'>[],
  existing: ExistingEntry[]
): ExistingEntry[] {
  const matched: ExistingEntry[] = [];
  for (const p of parsed) {
    const pDate = new Date(p.date + 'T12:00:00');
    const found = existing.find(e =>
      e.personnelName === p.personnelName &&
      e.date.toDateString() === pDate.toDateString()
    );
    if (found) matched.push(found);
  }
  return matched;
}

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const supportsSpeechRecognition = !!SpeechRecognitionAPI;

export const VoiceShiftInput: React.FC<VoiceShiftInputProps> = ({
  onAddGuardia, onAddLibranza, onAddDobla, onAddVacacion,
  onDeleteGuardia, onDeleteLibranza, onDeleteDobla, onDeleteVacacion,
  guardias, libranzas, doblas, vacaciones,
  currentUser, notify,
}) => {
  const now = new Date();
  const [refMonth, setRefMonth] = useState(now.getMonth());
  const [refYear, setRefYear] = useState(now.getFullYear());
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [entries, setEntries] = useState<VoiceEntry[]>([]);
  const [deleteMatches, setDeleteMatches] = useState<ExistingEntry[]>([]);
  const [deleteCat, setDeleteCat] = useState<'guardia' | 'libranza' | 'refuerzo' | 'vacacion'>('guardia');
  const [annotation, setAnnotation] = useState<VoiceAnnotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const [lastAction, setLastAction] = useState<ActionType | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const notesKey = 'zbs_planning_notes';

  const allExisting = useMemo(() => ({
    guardia: guardias || [],
    libranza: libranzas || [],
    refuerzo: doblas || [],
    vacacion: vacaciones || [],
  }), [guardias, libranzas, doblas, vacaciones]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    setTranscript('');
    setInterimText('');
    setEditingText(false);
    setLastAction(null);

    if (supportsSpeechRecognition) {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) setTranscript(prev => prev + ' ' + final);
        setInterimText(interim);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        notify('Error en el reconocimiento de voz. Prueba con el método manual.', 'error');
      };

      recognition.onend = () => { setIsRecording(false); };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        audioChunksRef.current = [];
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        recorder.onstop = () => { stream.getTracks().forEach(t => t.stop()); };
        recorder.start();
        setIsRecording(true);
        notify('Reconocimiento de voz no disponible en este navegador. Escribe el texto manualmente.', 'info');
      }).catch(() => { notify('No se pudo acceder al micrófono.', 'error'); });
    }
  }, [notify]);

  const handleInterpret = () => {
    const textToParse = transcript.trim();
    if (!textToParse) {
      notify('No hay texto para interpretar. Graba o escribe algo primero.', 'error');
      return;
    }

    setEntries([]);
    setDeleteMatches([]);
    setAnnotation(null);

    const action = detectAction(textToParse);
    setLastAction(action);

    if (action === 'delete' && (onDeleteGuardia || onDeleteLibranza || onDeleteDobla || onDeleteVacacion)) {
      const parsedDelete = parseDeleteText(textToParse, refMonth, refYear);
      if (parsedDelete.length === 0) {
        notify('No se pudo identificar qué borrar. Di algo como "borra la guardia de Elena Benages del 6 de agosto".', 'info');
        return;
      }
      const cat = parsedDelete[0].category;
      setDeleteCat(cat);
      const catMap = { guardia: 'guardias', libranza: 'libranzas', refuerzo: 'doblas', vacacion: 'vacaciones' } as const;
      const existingArr = allExisting[cat];
      const matched = matchExistingEntries(parsedDelete, existingArr);
      if (matched.length === 0) {
        notify(`No se encontraron entradas de ${CATEGORY_LABELS[cat].toLowerCase()} que coincidan.`, 'info');
        return;
      }
      setDeleteMatches(matched);
      notify(`Se encontraron ${matched.length} entrada${matched.length !== 1 ? 's' : ''} para eliminar. Confirma para borrar.`, 'info');
    } else if (action === 'annotate') {
      const result = parseAnnotateText(textToParse);
      if (!result) {
        notify('No se pudo extraer el texto de la nota.', 'info');
        return;
      }
      setAnnotation({ id: generateId(), text: result.noteText, date: result.noteDate });
      notify('Nota extraída. Revisa y guarda.', 'info');
    } else {
      const parsed = parseAssignText(textToParse, refMonth, refYear);
      if (parsed.length === 0) {
        notify('No se pudo identificar ningún dato. Di algo como "la médico Elena Benages tiene guardia los días 6, 8 y 9 de agosto".', 'info');
        return;
      }
      setEntries(parsed);
      notify(`Se encontraron ${parsed.length} entrada${parsed.length !== 1 ? 's' : ''}. Revísalas antes de asignar.`, 'info');
    }
  };

  const handleAssignAll = async () => {
    if (entries.length === 0) return;
    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;
    for (const entry of entries) {
      try {
        const date = new Date(entry.date + 'T12:00:00');
        const base = {
          id: generateId(),
          date,
          type: entry.type,
          personnelName: entry.personnelName,
          isChange: false,
          modifiedBy: currentUser?.id || null,
          modifiedAt: new Date(),
        };
        switch (entry.category) {
          case 'guardia': { const r = await onAddGuardia(base); if (r !== false) successCount++; else errorCount++; break; }
          case 'libranza': { try { await onAddLibranza({ ...base, id: 'lib-' + base.id }); successCount++; } catch { errorCount++; } break; }
          case 'refuerzo': { try { await onAddDobla({ ...base, id: 'dob-' + base.id }); successCount++; } catch { errorCount++; } break; }
          case 'vacacion': { try { await onAddVacacion(base); successCount++; } catch { errorCount++; } break; }
        }
      } catch { errorCount++; }
    }
    setIsDeleting(false);
    notify(`Asignación completada: ${successCount} correctas${errorCount > 0 ? `, ${errorCount} errores` : ''}.`, errorCount > 0 ? 'error' : 'success');
    if (successCount > 0) setEntries([]);
  };

  const handleConfirmDelete = async () => {
    if (deleteMatches.length === 0) return;
    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;
    const deleteMap: Record<string, ((id: string) => Promise<boolean | void>) | undefined> = {
      guardia: onDeleteGuardia,
      libranza: onDeleteLibranza,
      refuerzo: onDeleteDobla,
      vacacion: onDeleteVacacion,
    };
    const delFn = deleteMap[deleteCat];
    if (!delFn) { setIsDeleting(false); return; }
    for (const match of deleteMatches) {
      try {
        const r = await delFn(match.id);
        if (r !== false) successCount++; else errorCount++;
      } catch { errorCount++; }
    }
    setIsDeleting(false);
    notify(`Eliminación completada: ${successCount} borradas${errorCount > 0 ? `, ${errorCount} errores` : ''}.`, errorCount > 0 ? 'error' : 'success');
    if (successCount > 0) setDeleteMatches([]);
  };

  const handleSaveNote = () => {
    if (!annotation) return;
    setIsSavingNote(true);
    try {
      const existing = JSON.parse(localStorage.getItem(notesKey) || '{}');
      const key = annotation.date || `note_${Date.now()}`;
      existing[key] = annotation.text;
      localStorage.setItem(notesKey, JSON.stringify(existing));
      notify('Nota guardada.', 'success');
      setAnnotation(null);
      setTranscript('');
    } catch {
      notify('Error al guardar la nota.', 'error');
    }
    setIsSavingNote(false);
  };

  const handleRemoveEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));
  const handleUpdateEntry = (id: string, field: keyof VoiceEntry, value: string) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value as any } : e));

  const clearAll = () => {
    setEntries([]);
    setDeleteMatches([]);
    setAnnotation(null);
    setTranscript('');
    setInterimText('');
    setEditingText(false);
    setLastAction(null);
  };

  const displayedText = transcript + (interimText ? ' ' + interimText : '');

  return (
    <div className="space-y-4">
      {/* Reference month selector */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <span className="material-symbols-outlined text-sm text-forcall-600">calendar_month</span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mes:</span>
        <select value={refMonth} onChange={e => setRefMonth(Number(e.target.value))}
          className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-forcall-500"
        >
          {MONTHS.map((name, i) => <option key={i} value={i}>{name}</option>)}
        </select>
        <select value={refYear} onChange={e => setRefYear(Number(e.target.value))}
          className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-forcall-500"
        >
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Instructions */}
      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800 leading-relaxed">
        <p className="font-bold mb-1">🎤 Di por ejemplo:</p>
        <p className="opacity-80"><strong>Asignar:</strong> "La médico Elena Benages tiene guardia los días 6, 8 y 9 de agosto"</p>
        <p className="opacity-80 mt-1"><strong>Borrar:</strong> "Borra la guardia de Elena Benages del 6 de agosto"</p>
        <p className="opacity-80 mt-1"><strong>Nota:</strong> "Nota: Revisar el cuadrante de agosto con Fran"</p>
      </div>

      {/* Record button */}
      <div className="flex gap-2">
        {!isRecording ? (
          <button onClick={startRecording}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-700 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">mic</span>
            Grabar
          </button>
        ) : (
          <button onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-3 bg-gray-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black active:scale-95 transition-all animate-pulse"
          >
            <span className="material-symbols-outlined text-lg">stop</span>
            Detener
          </button>
        )}
        <button onClick={clearAll}
          className="px-4 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
        >
          Limpiar
        </button>
      </div>

      {/* Transcript */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Texto reconocido
            {isRecording && <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
          </span>
          {displayedText && (
            <button onClick={() => setEditingText(!editingText)}
              className="text-[9px] font-bold text-forcall-600 hover:text-forcall-800 uppercase tracking-widest flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">{editingText ? 'visibility' : 'edit'}</span>
              {editingText ? 'Ver' : 'Editar'}
            </button>
          )}
        </div>
        {editingText ? (
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-forcall-500 min-h-[80px] resize-y"
            placeholder="Escribe o edita el texto aquí..."
          />
        ) : (
          <div className="min-h-[48px] p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-medium text-gray-600 leading-relaxed">
            {displayedText || <span className="text-gray-300 italic">Presiona "Grabar" y empieza a hablar...</span>}
          </div>
        )}
      </div>

      {/* Interpret button */}
      {displayedText && (
        <button onClick={handleInterpret}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-forcall-600 to-forcall-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:from-forcall-700 hover:to-black active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">auto_awesome</span>
          Interpretar con IA
        </button>
      )}

      {/* Action indicator */}
      {lastAction && displayedText && !entries.length && !deleteMatches.length && !annotation && (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[10px] text-gray-500 text-center">
          {lastAction === 'assign' && 'No se detectaron datos de asignación. Intenta con otro texto.'}
          {lastAction === 'delete' && 'No se detectaron datos para borrar. Intenta con otro texto.'}
          {lastAction === 'annotate' && 'No se pudo extraer la nota. Intenta con otro texto.'}
        </div>
      )}

      {/* ── ASSIGN entries ── */}
      {entries.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              Asignar ({entries.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-400">{entry.day} {MONTHS[entry.month]}</span>
                    <span className="w-px h-3 bg-emerald-300" />
                    <select value={entry.personnelName} onChange={e => handleUpdateEntry(entry.id, 'personnelName', e.target.value)}
                      className="text-[10px] font-bold text-gray-800 bg-transparent outline-none cursor-pointer hover:text-forcall-600"
                    >{ALL_PERSONNEL.map(name => <option key={name} value={name}>{name}</option>)}</select>
                    <span className="w-px h-3 bg-emerald-300" />
                    <select value={entry.category} onChange={e => handleUpdateEntry(entry.id, 'category', e.target.value)}
                      className="text-[10px] font-bold text-forcall-600 bg-transparent outline-none cursor-pointer"
                    >{Object.entries(CATEGORY_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}</select>
                    <span className="w-px h-3 bg-emerald-300" />
                    <select value={entry.type} onChange={e => handleUpdateEntry(entry.id, 'type', e.target.value)}
                      className="text-[10px] font-bold text-gray-500 bg-transparent outline-none cursor-pointer"
                    >{Object.entries(TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}</select>
                  </div>
                </div>
                <button onClick={() => handleRemoveEntry(entry.id)}
                  className="p-1 text-emerald-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-sm">remove_circle</span>
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleAssignAll} disabled={isDeleting}
            className="w-full mt-3 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Asignando...</span>
            ) : (
              <><span className="material-symbols-outlined text-lg">check_circle</span>Asignar {entries.length} entrada{entries.length !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      )}

      {/* ── DELETE matches ── */}
      {deleteMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">
              Eliminar ({deleteMatches.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {deleteMatches.map(match => (
              <div key={match.id} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-xl">
                <span className="material-symbols-outlined text-sm text-red-400">delete</span>
                <span className="text-[10px] font-bold text-gray-400">
                  {match.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </span>
                <span className="w-px h-3 bg-red-300" />
                <span className="text-[10px] font-bold text-gray-800">{match.personnelName}</span>
                <span className="w-px h-3 bg-red-300" />
                <span className="text-[10px] font-bold text-forcall-600">{CATEGORY_LABELS[deleteCat]}</span>
              </div>
            ))}
          </div>
          <button onClick={handleConfirmDelete} disabled={isDeleting}
            className="w-full mt-3 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Eliminando...</span>
            ) : (
              <><span className="material-symbols-outlined text-lg">delete</span>Eliminar {deleteMatches.length} entrada{deleteMatches.length !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      )}

      {/* ── ANNOTATE ── */}
      {annotation && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Nota</span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            {annotation.date && (
              <p className="text-[10px] font-bold text-gray-500">
                📅 {new Date(annotation.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <p className="text-xs font-medium text-gray-700 whitespace-pre-wrap">{annotation.text}</p>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setAnnotation(null)}
              className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
            >Cancelar</button>
            <button onClick={handleSaveNote} disabled={isSavingNote}
              className="flex-1 py-3 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSavingNote ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <><span className="material-symbols-outlined text-lg">save</span>Guardar nota</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* No speech recognition fallback hint */}
      {!supportsSpeechRecognition && !isRecording && !displayedText && (
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[10px] text-blue-700 leading-relaxed">
          Tu navegador no soporta reconocimiento de voz automático.
          Escribe el texto manualmente pulsando el lápiz <strong>"Editar"</strong> tras grabar un audio o escribe directamente.
        </div>
      )}
    </div>
  );
};
