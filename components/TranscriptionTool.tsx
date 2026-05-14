import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useT } from '../lib/i18n';
import { jsPDF } from 'jspdf';
import { useTranscriptionRecords } from '../hooks/useTranscriptionRecords';

interface TranscriptionRecord {
  id: string;
  name: string;
  date: string;
  text: string;
}

const generateAndSavePdf = (title: string, dateStr: string, text: string, filename: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 25;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(title, margin, y);
  y += 10;

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(dateStr, margin, y);
  y += 10;

  // Separator line
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Body text with wrapping
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const lines = doc.splitTextToSize(text, contentWidth);

  for (let i = 0; i < lines.length; i++) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines[i], margin, y);
    y += 7;
  }

  doc.save(filename);
};

export const TranscriptionTool: React.FC = () => {
  const { t } = useT();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingName, setRecordingName] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const { records, isLoading, error, addRecord, deleteRecord } = useTranscriptionRecords();

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => { stopAll(); };
  }, []);

  const stopAll = () => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
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
      } catch { /* MediaRecorder no es crítico */ }
    } catch { /* getUserMedia falla, seguimos con SpeechRecognition */ }

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
          if (event.results[i].isFinal) { final += transcript + ' '; } else { interim += transcript; }
        }
        if (final) { setTranscription((prev) => prev + final); }
        setInterimText(interim);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') { setErrorMessage(t('transcription.micDenied')); }
        else if (event.error === 'no-speech') { setErrorMessage(t('transcription.noSpeech')); }
        else if (event.error === 'audio-capture') { setErrorMessage(t('transcription.noMic')); }
        else if (event.error === 'network') { setErrorMessage(t('transcription.networkError')); }
        else { setErrorMessage(`${t('transcription.dictationError')} ${event.error}`); }
        setIsRecording(false);
        if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
        try { mediaRecorderRef.current?.stop(); } catch {}
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText('');
        if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
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
    if (interimText.trim()) { setTranscription((prev) => prev + interimText); }
    try { recognitionRef.current?.stop(); } catch {}
    try { mediaRecorderRef.current?.stop(); } catch {}
    setIsRecording(false);
    setInterimText('');
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const chunksRef = useRef<Blob[]>([]);

  const handleSaveToHistory = async () => {
    if (!transcription.trim()) { setErrorMessage(t('transcription.emptyTranscript')); return; }
    if (!recordingName.trim()) { setErrorMessage(t('transcription.enterName')); return; }
    await addRecord({ name: recordingName.trim(), text: transcription.trim() });
    setTranscription('');
    setRecordingName('');
  };

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
  };

const saveAsPDF = (record: any) => {
     const dateStr = new Date(record.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
     const filename = `grabacion-${record.name.replace(/\s+/g, '_')}-${new Date(record.created_at).toISOString().slice(0, 10)}.pdf`;
     generateAndSavePdf(record.name, dateStr, record.text, filename);
   };

const saveCurrentPdf = () => {
     const text = transcription || interimText || '';
     if (!text.trim()) return;
     const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
     const filename = `transcripcion-${new Date().toISOString().slice(0, 10)}.pdf`;
     generateAndSavePdf(t('transcription.originalTranscript'), dateStr, text, filename);
   };

  const sortedHistory = useMemo(() => [...records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [records]);

  if (error && !errorMessage) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="bg-red-100 border border-red-300 text-red-800 rounded-2xl p-4 text-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-800 hover:text-red-900">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    );
  }

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
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center justify-center gap-2 w-12 h-12 rounded-xl bg-forcall-600 text-white shadow-sm border border-forcall-700 hover:bg-forcall-700 transition-all active:scale-95"
              title={t('transcription.start')}
            >
              <span className="material-symbols-outlined text-2xl">mic</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center justify-center gap-2 w-12 h-12 rounded-xl bg-red-500 text-white border-red-600 shadow-sm hover:bg-red-600 transition-all"
              title={t('transcription.stop')}
            >
              <span className="material-symbols-outlined text-2xl">stop</span>
            </button>
          )}
        </div>
      </div>

      {!isRecording && transcription.trim() && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <input
            type="text"
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
            placeholder={t('transcription.recordingName')}
            className="flex-1 px-4 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-emerald-300"
          />
          <button
            onClick={handleSaveToHistory}
            disabled={!recordingName.trim()}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-black active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('transcription.saveToHistory')}
          </button>
          <button
            onClick={() => { setTranscription(''); setRecordingName(''); }}
            className="px-3 py-1.5 bg-white text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {t('common.clear')}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[400px]">
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center no-print">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('transcription.originalTranscript')}</span>
          <button onClick={saveCurrentPdf} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
            {t('transcription.savePdf')}
          </button>
        </div>
        <div id="trans-area" className="p-6 flex-1 overflow-y-auto">
          <textarea
            value={transcription + interimText}
            onChange={(e) => { setTranscription(e.target.value); setInterimText(''); }}
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
            {t('transcription.historyTitle')} ({records.length})
          </h3>
          <button onClick={() => setShowHistory(!showHistory)} className="text-[10px] font-bold text-gray-500 hover:text-gray-700 uppercase tracking-widest">
            {showHistory ? t('common.hide') : t('common.show')}
          </button>
        </div>

        {isLoading && <p className="text-center py-4 text-[10px] text-gray-400">{t('common.loading')}...</p>}

        {showHistory && !isLoading && records.length === 0 && (
          <div className="text-center py-8 opacity-30 text-[10px] font-black uppercase tracking-widest bg-gray-50 rounded-2xl">
            {t('transcription.noRecordings')}
          </div>
        )}

        {showHistory && !isLoading && records.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {sortedHistory.map((record: any) => (
              <div key={record.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group">
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={record.name}
                        onChange={async (e: any) => {
                          await addRecord({ name: e.target.value, text: record.text });
                          await handleDelete(record.id);
                        }}
                        className="bg-gray-50 text-sm font-bold text-gray-800 border-none outline-none focus:ring-2 focus:ring-forcall-400 rounded px-1 w-full"
                      />
                      <span className="text-[10px] text-gray-400 font-bold flex-shrink-0">
                        {new Date(record.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{record.text.replace(/\n/g, ' ').slice(0, 120)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => saveAsPDF(record)} className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95">
                      <span className="material-symbols-outlined text-[10px] align-middle">download</span> PDF
                    </button>
                    <button onClick={() => handleDelete(record.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title={t('common.delete')}>
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