import React, { useState, useRef, useEffect } from 'react';
import { useT } from '../lib/i18n';

declare var html2pdf: any;

export const TranscriptionTool: React.FC = () => {
  const { t } = useT();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage(t('transcription.notSupported'));
      return;
    }

    // Solicitamos permiso de micrófono por MediaRecorder como respaldo, pero no bloqueamos
    // el dictado si no está disponible (por ejemplo, sin micrófono físico en el equipo).
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

  const savePDF = (id: string, name: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const clone = element.cloneNode(true) as HTMLElement;
    const textareas = clone.querySelectorAll('textarea');
    textareas.forEach((ta) => {
      const div = document.createElement('div');
      div.style.whiteSpace = 'pre-wrap';
      div.style.fontFamily = 'Inter, sans-serif';
      div.style.fontSize = '14px';
      div.style.lineHeight = '1.6';
      div.style.color = '#1f2937';
      div.textContent = (ta as HTMLTextAreaElement).value;
      ta.parentNode?.replaceChild(div, ta);
    });

    const opt = {
      margin: 10,
      filename: `${name}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const },
    };

    html2pdf().set(opt).from(clone).save();
  };

  const sendEmail = (txt: string) => {
    window.location.href = `mailto:?subject=Informe Clinico Forcall&body=${encodeURIComponent(txt)}`;
  };

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
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border transition-all ${
              isRecording ? 'bg-red-500 border-red-500 text-white animate-pulse' : 'bg-white border-gray-200 text-forcall-600 hover:bg-forcall-50 hover:border-forcall-300'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{isRecording ? 'stop' : 'mic'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[400px]">
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center no-print">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('transcription.originalTranscript')}</span>
          <button
            onClick={() => savePDF('trans-area', 'transcripcion')}
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
    </div>
  );
};
