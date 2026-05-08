
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '../types';

// Define the missing ChatViewProps interface
interface ChatViewProps {
  currentUser: User | null;
  messages: ChatMessage[];
  onSendMessage: (channelId: string, text: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, messages, onSendMessage }) => {
  // Define channels mapping to Meeting Types
  const channels = [
    { id: 'general', name: 'Equipo General', icon: 'groups', color: 'bg-blue-100 text-blue-700' },
    { id: 'medicina', name: 'Facultativos', icon: 'stethoscope', color: 'bg-green-100 text-green-700' },
    { id: 'enfermeria', name: 'enfermeria', icon: 'vaccines', color: 'bg-pink-100 text-pink-700' },
    { id: 'sesiones', name: 'Sesiones Clínicas', icon: 'school', color: 'bg-earth-200 text-earth-800' },
  ];

  const [activeChannelId, setActiveChannelId] = useState('general');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const channelMessages = messages.filter(m => m.channelId === activeChannelId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [channelMessages, activeChannelId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(activeChannelId, inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 bg-earth-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-earth-50">
          <h2 className="font-bold text-gray-700 text-lg">Salas de Chat</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannelId(channel.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                activeChannelId === channel.id
                  ? 'bg-white shadow-sm ring-1 ring-gray-200'
                  : 'hover:bg-earth-100/50'
              }`}
            >
              <div className={`p-2 rounded-full ${channel.color}`}>
                <span className="material-symbols-outlined text-sm">{channel.icon}</span>
              </div>
              <div className="flex-1 text-left">
                <span className={`block font-medium ${activeChannelId === channel.id ? 'text-gray-900' : 'text-gray-600'}`}>
                  {channel.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined ${
                activeChannelId === 'general' ? 'text-blue-500' :
                activeChannelId === 'medicina' ? 'text-green-500' :
                activeChannelId === 'enfermeria' ? 'text-pink-500' : 'text-earth-600'
            }`}>tag</span>
            <h3 className="font-bold text-gray-800 text-lg">{activeChannel.name}</h3>
          </div>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
            {channelMessages.length} mensajes
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
          {channelMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <span className="material-symbols-outlined text-5xl mb-3">forum</span>
              <p className="font-medium">No hay mensajes en este canal.</p>
              <p className="text-sm">¡Sé el primero en escribir!</p>
            </div>
          ) : (
            channelMessages.map((msg) => {
              const isOwn = msg.senderId === currentUser?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm relative group ${
                    isOwn 
                      ? 'bg-gradient-to-r from-forcall-600 to-forcall-700 text-white rounded-br-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}>
                    {!isOwn && (
                      <p className={`text-xs font-bold mb-1 ${
                         activeChannelId === 'general' ? 'text-blue-600' :
                         activeChannelId === 'medicina' ? 'text-green-600' :
                         activeChannelId === 'enfermeria' ? 'text-pink-600' : 'text-earth-700'
                      }`}>{msg.senderName}</p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className={`text-[10px] mt-1 text-right opacity-70 flex items-center justify-end gap-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                      <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOwn && <span className="material-symbols-outlined text-[10px]">done_all</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSend} className="flex gap-3 items-center">
             <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Mensaje en #${activeChannel.name}...`}
                  className="w-full border border-gray-300 rounded-full pl-5 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forcall-500 focus:border-transparent transition-shadow shadow-sm"
                />
             </div>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-forcall-600 text-white p-3 rounded-full hover:bg-forcall-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-md flex items-center justify-center"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
