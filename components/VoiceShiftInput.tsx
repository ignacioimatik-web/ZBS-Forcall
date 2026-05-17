import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Guardia, Libranza, Dobla, Vacacion } from '../types';
import { USERS } from '../lib/users';

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

interface VoiceShiftInputProps {
  onAddGuardia: (guardia: Guardia) => Promise<boolean | void>;
  onAddLibranza: (libranza: Libranza) => Promise<void>;
  onAddDobla: (dobla: Dobla) => Promise<void>;
  onAddVacacion: (vacacion: Vacacion) => Promise<void>;
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
  const parts = normalized.split(/\s+/);
  let bestMatch: { name: string; typeHint: 'medica' | 'enfermeria' | null } | null = null;
  let bestLength = 0;

  for (const person of ALL_PERSONNEL) {
    const normalizedPerson = normalizeText(person);
    const personParts = normalizedPerson.split(/\s+/);

    let matchedAll = true;
    for (const pp of personParts) {
      if (pp.length < 2) continue;
      if (!normalized.includes(pp)) { matchedAll = false; break; }
    }

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

function parseText(text: string, refMonth: number, refYear: number): VoiceEntry[] {
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

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const supportsSpeechRecognition = !!SpeechRecognitionAPI;

export const VoiceShiftInput: React.FC<VoiceShiftInputProps> = ({
  onAddGuardia, onAddLibranza, onAddDobla, onAddVacacion,
  currentUser, notify,
}) => {
  const now = new Date();
  const [refMonth, setRefMonth] = useState(now.getMonth());
  const [refYear, setRefYear] = useState(now.getFullYear());
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [entries, setEntries] = useState<VoiceEntry[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [editingText, setEditingText] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const startRecording = () => {
    setTranscript('');
    setInterimText('');
    setEditingText(false);

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

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } else {
      const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });
      streamPromise.then(stream => {
        const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        audioChunksRef.current = [];
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
        };

        recorder.start();
        setIsRecording(true);
        notify('Reconocimiento de voz no disponible en este navegador. Escribe el texto manualmente.', 'info');
      }).catch(() => {
        notify('No se pudo acceder al micrófono.', 'error');
      });
    }
  };

  const handleInterpret = () => {
    const textToParse = transcript.trim();
    if (!textToParse) {
      notify('No hay texto para interpretar. Graba o escribe algo primero.', 'error');
      return;
    }
    const parsed = parseText(textToParse, refMonth, refYear);
    if (parsed.length === 0) {
      notify('No se pudo identificar ningún dato. Comprueba el texto e inténtalo de nuevo.', 'info');
      return;
    }
    setEntries(parsed);
    notify(`Se encontraron ${parsed.length} entrada${parsed.length !== 1 ? 's' : ''}. Revísalas antes de asignar.`, 'info');
  };

  const handleRemoveEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateEntry = (id: string, field: keyof VoiceEntry, value: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value as any } : e));
  };

  const handleAssignAll = async () => {
    if (entries.length === 0) return;
    setIsAssigning(true);
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
    setIsAssigning(false);
    notify(
      `Asignación completada: ${successCount} correctas${errorCount > 0 ? `, ${errorCount} errores` : ''}.`,
      errorCount > 0 ? 'error' : 'success'
    );
    if (successCount > 0) setEntries([]);
  };

  const clearAll = () => {
    setEntries([]);
    setTranscript('');
    setInterimText('');
    setEditingText(false);
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
        <p className="opacity-80">"La médico Elena Benages tiene guardia los días 6, 8 y 9 de agosto"</p>
        <p className="opacity-80 mt-1">"Enfermera María López libranza el 15 de agosto"</p>
        <p className="opacity-80 mt-1">"Fran Pérez refuerzo los días 3 y 4 de agosto"</p>
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
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-forcall-500 min-h-[80px] resize-y"
            placeholder="Escribe o edita el texto aquí..."
          />
        ) : (
          <div className="min-h-[48px] p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-medium text-gray-600 leading-relaxed">
            {displayedText || (
              <span className="text-gray-300 italic">Presiona "Grabar" y empieza a hablar...</span>
            )}
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

      {/* Parsed entries */}
      {entries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Entradas detectadas ({entries.length})
            </span>
          </div>

          <div className="space-y-1.5">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-400">{entry.day} {MONTHS[entry.month]}</span>
                    <span className="w-px h-3 bg-gray-200" />
                    <select value={entry.personnelName} onChange={e => handleUpdateEntry(entry.id, 'personnelName', e.target.value)}
                      className="text-[10px] font-bold text-gray-800 bg-transparent outline-none cursor-pointer hover:text-forcall-600"
                    >
                      {ALL_PERSONNEL.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <span className="w-px h-3 bg-gray-200" />
                    <select value={entry.category} onChange={e => handleUpdateEntry(entry.id, 'category', e.target.value)}
                      className="text-[10px] font-bold text-forcall-600 bg-transparent outline-none cursor-pointer"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                    <span className="w-px h-3 bg-gray-200" />
                    <select value={entry.type} onChange={e => handleUpdateEntry(entry.id, 'type', e.target.value)}
                      className="text-[10px] font-bold text-gray-500 bg-transparent outline-none cursor-pointer"
                    >
                      {Object.entries(TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => handleRemoveEntry(entry.id)}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">remove_circle</span>
                </button>
              </div>
            ))}
          </div>

          {/* Assign button */}
          <button onClick={handleAssignAll} disabled={isAssigning}
            className="w-full mt-3 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isAssigning ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Asignando...
              </span>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Asignar {entries.length} entrada{entries.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
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
