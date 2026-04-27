import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, 
  X, 
  Send, 
  Mic, 
  Volume2, 
  VolumeX,
  Bot,
  User,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import api from '@/src/services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const AIAssistant = ({ isFullPage = false }: { isFullPage?: boolean }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(isFullPage);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: i18n.language === 'ps' ? "سلام! زه ستاسو هوښیار مرستندوی یم. زه څنګه کولی شم تاسو سره د ګودام مدیریت کې مرسته وکړم؟" : "Hello! I'm your Intelligent Warehouse Assistant. How can I help you manage inventory today?", sender: 'bot', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/chat', { message: input, lang: i18n.language });
      console.log("Chatbot response:", res.data);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data.response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      
      if (isSpeaking) {
        speak(res.data.response);
      }
    } catch (e) {
      console.error("Chatbot API Error:", e);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: i18n.language === 'ps' ? "زه له ستونزې سره مخ شوم." : "I encountered a connection issue. Please check the backend.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.language === 'ps' ? 'ps-AF' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeechRec = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === 'ps' ? 'ps-AF' : 'en-US';
    recognition.onstart = () => {
      console.log("Voice recognition started");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Voice recognized:", transcript);
      setInput(transcript);
    };
    recognition.onerror = (e: any) => {
      console.error("Voice recognition error:", e);
    };
    recognition.start();
  };

  if (isFullPage) {
    return (
      <div className="flex flex-col h-full bg-white">
          <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary-teal flex items-center justify-center shadow-2xl shadow-primary-teal/20">
                  <Sparkles size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-2xl uppercase tracking-tighter">System Intelligence Chatbot</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Network Ready & Synchronized</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSpeaking(!isSpeaking)}
                  className={cn("w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 transition-all border border-slate-800", isSpeaking ? "text-primary-teal border-primary-teal/50" : "text-slate-500")}
                >
                  {isSpeaking ? <Volume2 size={22} /> : <VolumeX size={22} />}
                </button>
              </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/30 custom-scrollbar"
          >
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-6 max-w-[70%]",
                  msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xl",
                  msg.sender === 'user' ? "bg-slate-900" : "bg-primary-teal"
                )}>
                  {msg.sender === 'user' ? <User size={22} className="text-white" /> : <Bot size={22} className="text-white" />}
                </div>
                <div className={cn(
                  "p-6 rounded-[32px] text-sm font-bold leading-relaxed shadow-lg",
                  msg.sender === 'user' 
                    ? "bg-white text-slate-900 rounded-tr-none" 
                    : "bg-slate-900 text-white rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {isTyping && (
                <div className="flex gap-6 max-w-[70%] mr-auto">
                   <div className="w-12 h-12 rounded-2xl bg-primary-teal flex items-center justify-center shadow-xl">
                    <Bot size={22} className="text-white" />
                   </div>
                   <div className="p-6 bg-slate-900 rounded-[32px] rounded-tl-none flex gap-2 items-center">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                   </div>
                </div>
              )}
          </div>

          <div className="p-10 bg-white border-t border-slate-100">
              <div className="relative max-w-4xl mx-auto">
                 <input 
                  type="text"
                  placeholder={t('ask_ai_placeholder') || "Ask about inventory, requests, or stock levels..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-6 pl-8 pr-32 text-xs font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-primary-teal/5 focus:border-primary-teal/20 transition-all shadow-inner"
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <button 
                    onClick={toggleSpeechRec}
                    className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-primary-teal hover:bg-primary-teal/5 rounded-2xl transition-all"
                   >
                     <Mic size={24} />
                   </button>
                   <button 
                    onClick={handleSend}
                    className="w-14 h-14 bg-primary-teal text-white rounded-2xl shadow-xl shadow-primary-teal/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
                   >
                     <Send size={24} />
                   </button>
                 </div>
              </div>
              <div className="mt-8 flex justify-center gap-4 flex-wrap">
                 {[t('check_stock') || 'Check Stock', t('create_request') || 'Create Request', t('low_stock_items') || 'Low Stock Items'].map(s => (
                   <button 
                    key={s}
                    onClick={() => { setInput(s); handleSend(); }}
                    className="bg-slate-50 border border-slate-100 hover:border-primary-teal/30 hover:bg-white text-slate-400 hover:text-primary-teal py-3 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm"
                   >
                     {s}
                   </button>
                 ))}
              </div>
          </div>
      </div>
    );
  }

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-ai-assistant', handleToggle);
    return () => window.removeEventListener('toggle-ai-assistant', handleToggle);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-6 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-teal flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">{t('ai_assistant') || 'AI Assistant'}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('online_processing') || 'Online & Processing'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSpeaking(!isSpeaking)}
                  className={cn("p-2 rounded-lg hover:bg-slate-800 transition-all", isSpeaking ? "text-primary-teal" : "text-slate-500")}
                >
                  {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-all text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/50"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex gap-4 max-w-[85%]",
                    msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                    msg.sender === 'user' ? "bg-slate-900" : "bg-primary-teal"
                  )}>
                    {msg.sender === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-[11px] font-bold leading-relaxed",
                    msg.sender === 'user' 
                      ? "bg-white text-slate-900 rounded-tr-none shadow-sm" 
                      : "bg-slate-900 text-white rounded-tl-none shadow-xl"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-4 max-w-[85%] mr-auto">
                   <div className="w-8 h-8 rounded-lg bg-primary-teal flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                   </div>
                   <div className="p-4 bg-slate-900 rounded-2xl rounded-tl-none flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                   </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="relative">
                 <input 
                  type="text"
                  placeholder={t('ask_ai_placeholder') || "Ask about inventory, requests, or stock levels..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-6 pr-24 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all"
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                   <button 
                    onClick={toggleSpeechRec}
                    className="p-2.5 text-slate-400 hover:text-primary-teal transition-all"
                   >
                     <Mic size={18} />
                   </button>
                   <button 
                    onClick={handleSend}
                    className="p-2.5 bg-primary-teal text-white rounded-xl shadow-lg shadow-primary-teal/20 hover:scale-105 active:scale-95 transition-all"
                   >
                     <Send size={18} />
                   </button>
                 </div>
              </div>
              <div className="mt-4 flex gap-2">
                 {[t('check_stock') || 'Check Stock', t('create_request') || 'Create Request', t('low_stock_items') || 'Low Stock Items'].map(s => (
                   <button 
                    key={s}
                    onClick={() => { setInput(s); handleSend(); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-400 py-2 px-4 rounded-full text-[8px] font-black uppercase tracking-widest transition-all"
                   >
                     {s}
                   </button>
                 ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group relative overflow-hidden",
          isOpen ? "bg-slate-900 border border-slate-800" : "bg-primary-teal"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? <X className="text-white" size={28} /> : <MessageSquare className="text-white" size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white">1</span>
        )}
      </button>
    </div>
  );
};
