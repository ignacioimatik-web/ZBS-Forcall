import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useT } from '../lib/i18n';

declare var html2pdf: any;

interface TranscriptionRecord {
  id: string;
  name: string;
  date: string;
  text: string;
}

const escapeHtml = (text: string) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const generatePdfHtml = (title: string, dateStr: string, text: string) => `
  <div style="padding: 40px; font-family: 'Inter', sans-serif; max-width: 210mm;">
    <h1 style="font-size: 20px; font-weight: 900; color: #1f2937; margin-bottom: 4px;">${escapeHtml(title)}</h1>
    <p style="font-size: 12px; color: #6b7280; margin-bottom: 24px;">${dateStr}</p>
    <hr style="border: none; border-top: 2px solid #e5e7eb; margin-bottom: 24px;">
    <p style="font-size: 14px; line-height: 1.8; color: #374151; white-space: pre-wrap;">${escapeHtml(text)}</p>
  </div>
`;

const savePdfFromHtml = (html: string, filename: string) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const child = div.firstElementChild as HTMLElement;
  child.style.position = 'fixed';
  child.style.top = '0';
  child.style.left = '0';
  child.style.visibility = 'hidden';
  child.style.width = '210mm';
  document.body.appendChild(child);

  const opt = {
    margin: 10,
    filename,
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait' as const },
  };
  html2pdf().set(opt).from(child).save().then(() => document.body.removeChild(child));
};

export const TranscriptionTool: React.FC = () => {
  const { t } = useT();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingName, setRecordingName] = useState('');
  const [history, setHistory] = useState<TranscriptionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('zbs_transcription_history');
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('zbs_transcription_history', JSON.stringify(history)); } catch {}
  }, [history]);

  useEffect(() => {
    return () => { stopAll(); };
  }, []);

  const stopAll = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    try { mediaRecorderRef.current?.stop(); } catch {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setInterimText('');
    setTranscription('');
    setRecordingName('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage(t('transcription.notSupported'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mediaRecorder: MediaRecorder | null = null;
      try {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecorder.onstop = () => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
        };
        mediaRecorder?.start();
      } catch {
        // MediaRecorder no es crítico
      }
    } catch {
      // Si getUserMedia falla seguimos solo con SpeechRecognition
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript: string = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }
        if (final) {
          setTranscription((prev) => prev + final);
        }
        setInterimText(interim);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setErrorMessage(t('transcription.micDenied'));
        } else if (event.error === 'no-speech') {
          setErrorMessage(t('transcription.noSpeech'));
        } else if (event.error === 'audio-capture') {
          setErrorMessage(t('transcription.noMic'));
        } else if (event.error === 'network') {
          setErrorMessage(t('transcription.networkError'));
        } else {
          setErrorMessage(`${t('transcription.dictationError')} ${event.error}`);
        }
        setIsRecording(false);
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        try { mediaRecorderRef.current?.stop(); } catch {}
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText('');
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        try { mediaRecorderRef.current?.stop(); } catch {}
      };

      recognition.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(t('transcription.startError'));
    }
  };

  const stopRecording = () => {
    try { recognitionRef.current?.stop(); } catch {}
    try { mediaRecorderRef.current?.stop(); } catch {}
  };

  const handleFinishRecording = () => {
    // Guardar texto interino en la transcripción antes de limpiar
    if (interimText.trim()) {
      setTranscription((prev) => prev + interimText);
    }
    stopRecording();
    setIsRecording(false);
    setInterimText('');
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const saveToHistory = () => {
    if (!transcription.trim()) {
      setErrorMessage(t('transcription.emptyTranscript'));
      return;
    }
    if (!recordingName.trim()) {
      setErrorMessage(t('transcription.enterName'));
      return;
    }
    const newRecord: TranscriptionRecord = {
      id: Math.random().toString(36).substr(2, 9),
      name: recordingName.trim(),
      date: new Date().toISOString(),
      text: transcription.trim(),
    };
    setHistory((prev) => [newRecord, ...prev]);
    setTranscription('');
    setRecordingName('');
  };

  const deleteFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((r) => r.id !== id));
  };

  const saveAsPDF = (record: TranscriptionRecord) => {
    const dateStr = new Date(record.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const name = `grabacion-${record.name.replace(/\s+/g, '_')}-${new Date(record.date).toISOString().slice(0, 10)}`;
    const html = generatePdfHtml(record.name, dateStr, record.text);
    savePdfFromHtml(html, `${name}.pdf`);
  };

  const saveCurrentPdf = () => {
    const text = transcription || interimText || '';
    if (!text.trim()) return;
    const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const name = `transcripcion-${new Date().toISOString().slice(0, 10)}`;
    const html = generatePdfHtml(t('transcription.originalTranscript'), dateStr, text);
    savePdfFromHtml(html, `${name}.pdf`);
  };

  const sortedHistory = useMemo(() => [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [history]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {errorMessage && (
        <div className="bg-red-100 border border-red-300 text-red-800 rounded-2xl p-4 text-sm font-semibold flex items-center gap-2 animate-slide-in-up">
          <span className="material-symbols-outlined">error</span>
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-800 hover:text-red-900">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-forcall-600">mic</span>
            {t('transcription.title')}
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">{t('transcription.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-black text-gray-500 bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-sm">
            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
          </span>
          <button
            onClick={isRecording ? handleFinishRecording : startRecording}
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border transition-all ${
              isRecording ? 'bg-red-500 border-red-500 text-white animate-pulse' : 'bg-white border-gray-200 text-forcall-600 hover:bg-forcall-50 hover:border-forcall-300'
            }`}
            title={isRecording ? t('transcription.stop') : t('transcription.start')}
          >
            <span className="material-symbols-outlined text-2xl">{isRecording ? 'stop' : 'mic'}</span>
          </button>
        </div>
      </div>

      {isRecording && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <input
            type="text"
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
            placeholder={t('transcription.recordingName')}
            className="flex-1 px-4 py-2 bg-white border border-amber-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-300"
          />
          <button
            onClick={saveToHistory}
            disabled={!transcription.trim() || !recordingName.trim()}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-black active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('transcription.finishRecording')}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[400px]">
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center no-print">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('transcription.originalTranscript')}</span>
          <button
            onClick={saveCurrentPdf}
            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
          >
            {t('transcription.savePdf')}
          </button>
        </div>
        <div id="trans-area" className="p-6 flex-1 overflow-y-auto">
          <textarea
            value={transcription + interimText}
            onChange={(e) => {
              setTranscription(e.target.value);
              setInterimText('');
            }}
            className="w-full h-full resize-none border-none focus:ring-0 text-sm font-medium leading-relaxed text-gray-800"
            placeholder={t('transcription.pressMic')}
          />
        </div>
      </div>

      {/* Historial de grabaciones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">history</span>
            {t('transcription.historyTitle')}
          </h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[10px] font-bold text-gray-500 hover:text-gray-700 uppercase tracking-widest"
          >
            {showHistory ? t('common.hide') : t('common.show')}
          </button>
        </div>

        {showHistory && sortedHistory.length === 0 && (
          <div className="text-center py-8 opacity-30 text-[10px] font-black uppercase tracking-widest bg-gray-50 rounded-2xl">
            {t('transcription.noRecordings')}
          </div>
        )}

        {showHistory && sortedHistory.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {sortedHistory.map((record) => (
              <div key={record.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group">
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={record.name}
                        onChange={(e) => {
                          const updated = history.map((r) => (r.id === record.id ? { ...r, name: e.target.value } : r));
                          setHistory(updated);
                        }}
                        className="bg-gray-50 text-sm font-bold text-gray-800 border-none outline-none focus:ring-2 focus:ring-forcall-400 rounded px-1 w-full"
                      />
                      <span className="text-[10px] text-gray-400 font-bold flex-shrink-0">
                        {new Date(record.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{record.text.replace(/\n/g, ' ').slice(0, 120)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => saveAsPDF(record)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[10px] align-middle">download</span> PDF
                    </button>
                    <button
                      onClick={() => deleteFromHistory(record.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title={t('common.delete')}
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};