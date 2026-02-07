
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

export const TranscriptionTool: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        handleTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      setError("No se pudo acceder al micrófono. Por favor, asegúrate de dar los permisos necesarios.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "audio/webm",
                  data: base64Audio
                }
              },
              {
                text: "Transcribe este audio médico o clínico a texto claro y estructurado en español. Si hay términos técnicos, asegúrate de escribirlos correctamente. Devuelve solo la transcripción."
              }
            ]
          }
        ]
      });

      setTranscription(response.text || "No se detectó habla clara.");
    } catch (err) {
      console.error("Error en la transcripción:", err);
      setError("Error al transcribir el audio. Inténtalo de nuevo.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExportPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent("Dictado Clínico - ZBS Forcall");
    const body = encodeURIComponent(transcription);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* CABECERA DE INFORME PARA IMPRESIÓN */}
      <div className="print-only mb-10 border-b-2 border-gray-900 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase">Informe de Dictado Clínico</h1>
            <p className="text-lg font-bold text-gray-700">Zona Básica de Salud Forcall</p>
          </div>
          <div className="text-right">
            <p className="font-bold">FECHA: {new Date().toLocaleDateString()}</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Validado por IA Gemini</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex-1">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl">mic</span>
            Dictado Inteligente
          </h2>
          <p className="opacity-80 mt-2 font-medium">Graba notas clínicas, actas o avisos y transcríbelos automáticamente con IA.</p>
        </div>
        <div className="flex flex-col items-center gap-2">
           {!isRecording ? (
             <button 
               onClick={startRecording}
               className="w-20 h-20 bg-white text-emerald-700 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group shadow-emerald-900/40"
             >
               <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">mic</span>
             </button>
           ) : (
             <button 
               onClick={stopRecording}
               className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl animate-pulse active:scale-95 transition-all"
             >
               <span className="material-symbols-outlined text-4xl">stop</span>
             </button>
           )}
           <span className={`text-xl font-mono font-black ${isRecording ? 'text-white' : 'text-white/50'}`}>
             {formatTime(recordingTime)}
           </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-800 shadow-sm animate-shake no-print">
          <span className="material-symbols-outlined">error</span>
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px] print:border-0 print:shadow-none">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center no-print">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <span className="material-symbols-outlined text-emerald-600">description</span>
                 Transcripción
               </h3>
               {isTranscribing && (
                 <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest animate-pulse">
                   <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                   Procesando con IA...
                 </div>
               )}
            </div>
            
            <div className="p-8 flex-1 relative print:p-0">
              {transcription ? (
                <div className="space-y-4">
                  <textarea 
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    className="w-full h-full min-h-[300px] border-none focus:ring-0 text-gray-800 leading-relaxed font-medium resize-none text-lg scrollbar-hide bg-transparent print:hidden"
                  />
                  {/* Vista alternativa para impresión que hereda el texto */}
                  <div className="hidden print:block text-gray-900 text-lg leading-relaxed whitespace-pre-wrap font-serif italic">
                    {transcription}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 opacity-50 p-12 text-center no-print">
                   <span className="material-symbols-outlined text-6xl mb-4">text_snippet</span>
                   <p className="text-sm font-bold uppercase tracking-widest">Inicia la grabación para transcribir</p>
                </div>
              )}
            </div>

            {transcription && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3 justify-end no-print">
                 <button 
                   onClick={() => navigator.clipboard.writeText(transcription)}
                   className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all flex items-center gap-2"
                 >
                   <span className="material-symbols-outlined text-sm">content_copy</span>
                   Copiar
                 </button>
                 <button 
                   onClick={handleSendEmail}
                   className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all flex items-center gap-2"
                 >
                   <span className="material-symbols-outlined text-sm">mail</span>
                   Email
                 </button>
                 <button 
                   onClick={handleExportPDF}
                   className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95"
                 >
                   <span className="material-symbols-outlined text-sm">print</span>
                   Imprimir / PDF
                 </button>
              </div>
            )}
          </div>
          
          <div className="print-only mt-20 border-t border-gray-300 pt-10 text-center">
            <div className="flex justify-around">
               <div className="w-48 border-t border-gray-900 pt-2 text-xs font-bold uppercase">Firma del Facultativo</div>
               <div className="w-48 border-t border-gray-900 pt-2 text-xs font-bold uppercase">Sello de la ZBS</div>
            </div>
          </div>
        </div>

        <div className="space-y-6 no-print">
           <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
               <span className="material-symbols-outlined text-teal-600">help</span>
               Instrucciones
             </h3>
             <ul className="space-y-4 text-xs text-gray-600">
               <li className="flex gap-3">
                 <span className="bg-teal-50 text-teal-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black">1</span>
                 <p>Pulsa el botón circular para empezar a dictar.</p>
               </li>
               <li className="flex gap-3">
                 <span className="bg-teal-50 text-teal-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black">2</span>
                 <p>Vuelve a pulsar para detener y transcribir con IA.</p>
               </li>
               <li className="flex gap-3">
                 <span className="bg-teal-50 text-teal-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black">3</span>
                 <p>Utiliza el botón de imprimir para generar un reporte profesional.</p>
               </li>
             </ul>
           </div>

           {audioURL && (
             <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm animate-slide-in-up no-print">
               <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase">
                 <span className="material-symbols-outlined text-emerald-500">audiotrack</span>
                 Grabación Original
               </h3>
               <audio src={audioURL} controls className="w-full h-10" />
             </div>
           )}

           <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 no-print">
             <div className="flex items-center gap-3 mb-2 text-emerald-900">
               <span className="material-symbols-outlined">security</span>
               <h4 className="font-bold text-sm">Privacidad LOPD</h4>
             </div>
             <p className="text-[10px] text-emerald-800 leading-relaxed opacity-80">
               Asegúrate de no dictar datos personales identificables (DNI, Nombre Completo) de pacientes si vas a exportar el informe fuera de la red segura.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};
