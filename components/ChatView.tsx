import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { useChat } from '../hooks/useChat';

interface ChatViewProps {
  currentUser: User | null;
}

type Conversation =
  | { type: 'channel'; id: string; label: string }
  | { type: 'dm'; userId: string; label: string };

export const ChatView: React.FC<ChatViewProps> = ({ currentUser }) => {
  const { profiles, messagesByChannel, sendMessage, sendPrivateMessage, sendImage, sendAudio, deleteMessage, isUploading } = useChat();
  const [inputText, setInputText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const teamConv: Conversation = { type: 'channel', id: 'general', label: 'Chat de Equipo' };
  const dmConvs: Conversation[] = profiles
    .filter(p => p.id !== currentUser?.id && !p.full_name?.toLowerCase().includes('externo'))
    .map(p => ({ type: 'dm' as const, userId: p.id, label: p.full_name || p.email }));

  const [activeConv, setActiveConv] = useState<Conversation>(teamConv);

  const channelKey = activeConv.type === 'channel'
    ? 'general'
    : [currentUser?.id || '', activeConv.userId].sort().join('_');

  const conversationMessages = messagesByChannel[channelKey] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) {
        setShowAttach(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuMsgId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (activeConv.type === 'channel') {
      sendMessage(inputText);
    } else {
      sendPrivateMessage(activeConv.userId, inputText);
    }
    setInputText('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (activeConv.type === 'dm') {
        sendImage(file, activeConv.userId);
      } else {
        sendImage(file);
      }
    }
    e.target.value = '';
    setShowAttach(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (activeConv.type === 'dm') {
          sendAudio(blob, activeConv.userId);
        } else {
          sendAudio(blob);
        }
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setShowAttach(false);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderMessageContent = (msg: any) => {
    return (
      <>
        {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
        {msg.imageUrl && (
          <button onClick={() => setExpandedImage(msg.imageUrl)} className="block mt-1">
            <img
              src={msg.imageUrl}
              alt="Imagen"
              className="max-w-[250px] max-h-[200px] rounded-xl object-cover border border-black/10 hover:opacity-90 transition-opacity"
            />
          </button>
        )}
        {msg.audioUrl && (
          <audio controls preload="none" className="mt-1 h-10 max-w-[200px]">
            <source src={msg.audioUrl} type="audio/webm" />
          </audio>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 bg-earth-50 border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Team channel */}
        <div className="p-3 border-b border-gray-200 bg-earth-50">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Canales</h2>
        </div>
        <button
          onClick={() => setActiveConv(teamConv)}
          className={`w-full flex items-center gap-3 p-3 transition-all ${
            activeConv.type === 'channel' && activeConv.id === teamConv.id
              ? 'bg-white shadow-sm ring-1 ring-gray-200'
              : 'hover:bg-earth-100/50'
          }`}
        >
          <div className="p-2 rounded-full bg-blue-100 text-blue-700">
            <span className="material-symbols-outlined text-sm">forum</span>
          </div>
          <span className={`font-medium text-sm ${activeConv.type === 'channel' && activeConv.id === teamConv.id ? 'text-gray-900' : 'text-gray-600'}`}>
            {teamConv.label}
          </span>
        </button>

        {/* Direct messages */}
        <div className="p-3 border-b border-t border-gray-200 bg-earth-50 mt-2">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mensajes Directos</h2>
        </div>
        <div className="flex-1">
          {dmConvs.map(conv => (
            <button
              key={conv.userId}
              onClick={() => setActiveConv(conv)}
              className={`w-full flex items-center gap-3 p-3 transition-all ${
                activeConv.type === 'dm' && activeConv.userId === conv.userId
                  ? 'bg-white shadow-sm ring-1 ring-gray-200'
                  : 'hover:bg-earth-100/50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-forcall-100 text-forcall-700 flex items-center justify-center text-sm font-bold shrink-0">
                {conv.label.charAt(0).toUpperCase()}
              </div>
              <div className="text-left min-w-0">
                <span className={`block font-medium text-sm truncate ${activeConv.type === 'dm' && activeConv.userId === conv.userId ? 'text-gray-900' : 'text-gray-600'}`}>
                  {conv.label}
                </span>
              </div>
            </button>
          ))}
          {dmConvs.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No hay otros usuarios</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
          <div className="flex items-center gap-3">
            {activeConv.type === 'channel' ? (
              <span className="material-symbols-outlined text-blue-500">forum</span>
            ) : (
              <div className="w-8 h-8 rounded-full bg-forcall-100 text-forcall-700 flex items-center justify-center text-sm font-bold">
                {activeConv.label.charAt(0).toUpperCase()}
              </div>
            )}
            <h3 className="font-bold text-gray-800 text-lg">{activeConv.label}</h3>
          </div>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
            {conversationMessages.length} mensajes
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
          {conversationMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <span className="material-symbols-outlined text-5xl mb-3">
                {activeConv.type === 'channel' ? 'forum' : 'chat'}
              </span>
              <p className="font-medium">No hay mensajes aquí.</p>
              <p className="text-sm">¡Sé el primero en escribir!</p>
            </div>
          ) : (
            conversationMessages.map((msg) => {
              const isOwn = msg.senderId === currentUser?.id;
              return (
                <div key={msg.id} className={`flex items-end gap-1 group ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {isOwn && (
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                        className="p-1 rounded-full hover:bg-gray-200 text-gray-400"
                      >
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                      {menuMsgId === msg.id && (
                        <div ref={menuRef} className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px] z-50">
                          <button
                            onClick={() => {
                              deleteMessage(msg);
                              setMenuMsgId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm relative group ${
                    isOwn
                      ? 'bg-gradient-to-r from-forcall-600 to-forcall-700 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}>
                    {!isOwn && (
                      <p className="text-xs font-bold mb-1 text-blue-600">{msg.senderName}</p>
                    )}
                    {renderMessageContent(msg)}
                    <div className={`text-[10px] mt-1 text-right opacity-70 flex items-center justify-end gap-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                      <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOwn && <span className="material-symbols-outlined text-[10px]">done_all</span>}
                    </div>
                  </div>
                  {!isOwn && activeConv.type === 'dm' && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {msg.senderName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-gray-200">
          {isRecording ? (
            <div className="flex items-center gap-3 bg-red-50 rounded-xl px-4 py-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-red-600 text-sm">{formatTime(recordingTime)}</span>
              <span className="text-red-500 text-sm flex-1">Grabando nota de voz...</span>
              <button
                onClick={stopRecording}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">stop</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <div ref={attachRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowAttach(!showAttach)}
                  disabled={isUploading}
                  className="p-2.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-xl">add_circle</span>
                </button>
                {showAttach && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 flex gap-2 z-50">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-2xl text-blue-500">image</span>
                      <span className="text-[10px] font-bold text-gray-600">Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-2xl text-red-500">mic</span>
                      <span className="text-[10px] font-bold text-gray-600">Audio</span>
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={activeConv.type === 'channel' ? 'Mensaje en #Chat de Equipo...' : `Mensaje para ${activeConv.label}...`}
                  className={`w-full border border-gray-300 rounded-full pl-5 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow shadow-sm ${
                    isUploading ? 'opacity-50' : 'focus:ring-forcall-500'
                  }`}
                  disabled={isUploading}
                />
              </div>
              <button
                type="submit"
                disabled={!inputText.trim() || isUploading}
                className="bg-forcall-600 text-white p-3 rounded-full hover:bg-forcall-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-md flex items-center justify-center"
              >
                {isUploading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">send</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Image expansion modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <img
            src={expandedImage}
            alt="Imagen ampliada"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
