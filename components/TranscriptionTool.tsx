
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

declare var html2pdf: any;

export const TranscriptionTool: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => { return () => { if (timerRef.current) window.clearInterval(timerRef.current); }; }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder; chunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setAudioURL(URL.createObjectURL(blob));
      handleTranscription(blob);
    };
    mediaRecorder.start(); setIsRecording(true); setRecordingTime(0);
    timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
  };

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ parts: [{ inlineData: { mimeType: "audio/webm", data: base64 } }, { text: "Transcribe el audio clínico a texto estructurado en español." }] }]
        });
        setTranscription(res.text || '');
      };
    } finally { setIsTranscribing(false); }
  };

  const handleSummarize = async () => {
    if (!transcription || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Genera un resumen clínico ejecutivo estructurado (puntos clave, diagnóstico diferencial, plan actuación) de esta transcripción: "${transcription}"`
      });
      setSummary(res.text || '');
    } catch (e) { console.error(e); } finally { setIsSummarizing(false); }
  };

  const savePDF = (id: string, name: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    html2pdf().set({ margin: 10, filename: `${name}.pdf`, html2canvas: { scale: 2 }, jsPDF: { orientation: 'portrait' } }).from(element).save();
  };

  const sendEmail = (txt: string) => {
    window.location.href = `mailto:?subject=Informe Clinico Forcall&body=${encodeURIComponent(txt)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-emerald-800 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2"><span className="material-symbols-outlined text-3xl">mic</span> Dictado Inteligente</h2>
          <p className="text-xs opacity-70 font-bold uppercase tracking-widest mt-1">IA Generativa ZBS Forcall</p>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white text-emerald-800 hover:scale-110'}`}>
            <span className="material-symbols-outlined text-3xl">{isRecording ? 'stop' : 'mic'}</span>
          </button>
          <span className="text-xs font-mono mt-2 font-black">{Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2,'0')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Transcripción */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center no-print">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transcripción Original</span>
            <div className="flex gap-2">
              {transcription && <button onClick={handleSummarize} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 active:scale-95"><span className="material-symbols-outlined text-sm">auto_awesome</span> RESUMIR IA</button>}
              <button onClick={() => savePDF('trans-area', 'transcripcion')} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[9px] font-black uppercase">GUARDAR PDF</button>
            </div>
          </div>
          <div id="trans-area" className="p-6 flex-1 overflow-y-auto">
            {isTranscribing ? <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2"><span className="material-symbols-outlined animate-spin text-4xl">sync</span><p className="text-[10px] font-black uppercase">IA Procesando audio...</p></div> : 
             <textarea value={transcription} onChange={(e) => setTranscription(e.target.value)} className="w-full h-full resize-none border-none focus:ring-0 text-sm font-medium leading-relaxed text-gray-800" placeholder="El texto aparecerá aquí..." />}
          </div>
        </div>

        {/* Resumen IA */}
        {(summary || isSummarizing) && (
          <div className="bg-indigo-50/30 rounded-3xl shadow-lg border border-indigo-100 flex flex-col animate-slide-in-up">
            <div className="p-4 bg-indigo-100/30 border-b border-indigo-100 flex justify-between items-center no-print">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Resumen Ejecutivo Estructurado (IA)</span>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(summary)} className="p-2 bg-white text-indigo-600 rounded-lg border border-indigo-100"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                <button onClick={() => sendEmail(summary)} className="p-2 bg-white text-indigo-600 rounded-lg border border-indigo-100"><span className="material-symbols-outlined text-sm">mail</span></button>
                <button onClick={() => savePDF('sum-area', 'resumen_clínico')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase shadow-md">PDF RESUMEN</button>
              </div>
            </div>
            <div id="sum-area" className="p-6">
               {isSummarizing ? <div className="flex flex-col items-center py-12 text-indigo-400 gap-2"><span className="material-symbols-outlined animate-bounce text-4xl">psychology</span><p className="text-[10px] font-black uppercase tracking-widest">IA Analizando transcripción...</p></div> : 
                <div className="prose prose-sm font-medium text-gray-800 whitespace-pre-wrap">{summary}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
