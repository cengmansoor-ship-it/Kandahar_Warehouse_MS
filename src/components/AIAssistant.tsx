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
import { toast } from 'sonner';

import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const AIAssistant = ({ isFullPage = false, forceOpen = false }: { isFullPage?: boolean, forceOpen?: boolean }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(isFullPage || forceOpen);
  const isPashto = i18n.language === 'ps';
  const isRtl = i18n.dir() === 'rtl';

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: isPashto ? "سلام! زه ستاسو هوښیار مرستندوی ییم. زه څنګه کولی شم تاسو سره د ګودام مدیریت کې مرسته وکړم؟" : "Hello! I'm your Intelligent Warehouse Assistant. How can I help you manage inventory today?", 
      sender: 'bot', 
      timestamp: new Date() 
    }
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
      // Get context from API to provide to AI
      const contextRes = await api.get('/reports/inventory');
      const dbInfo = contextRes.data;

      const systemPrompt = `
        You are the Intelligent WMS Copilot for Kandahar University (KDRU) Warehouse Management System.
        Current System Context:
        - Total unique items (SKUs): ${dbInfo.totalItems}
        - Total items currently in stock: ${dbInfo.totalStock}
        - Low stock alerts: ${dbInfo.lowStockCount} items.
        
        You can assist with:
        1. Checking stock levels for specific items.
        2. Tracking procurement status.
        3. Explaining system activities.
        4. i18n support (English, Dari, Pashto).
        
        User is asking in ${i18n.language === 'ps' ? 'Pashto' : i18n.language === 'fa' ? 'Dari' : 'English'}.
        Answer professionally and concisely.
      `;

      const response = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Acknowledged. I am ready to assist as the KDRU Warehouse Co-Pilot." }] },
          { role: "user", parts: [{ text: input }] }
        ]
      });
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text || t('noResponse'),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      
      if (isSpeaking) {
        speak(botMsg.text);
      }
    } catch (e: any) {
      console.error("Gemini Frontend Error:", e);
      let errorText = "Assistant connection lost";
      
      if (e.message?.includes("API_KEY_INVALID") || e.message?.includes("API key not valid")) {
        errorText = "I'm currently in 'Offline Mode' because the GEMINI_API_KEY hasn't been configured or is invalid. Please ensure the key is correctly set in system settings.";
      }

      const botErrorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botErrorMsg]);
      toast.error("Assistant connection issues detected");
    } finally {
      setIsTyping(false);
    }
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.language === 'ps' ? 'ps-AF' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeechRec = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('voiceNotSupported'));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = isPashto ? 'ps-AF' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      toast.info(isPashto ? "غوږ نیسم..." : "Assistant is listening...");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onspeechend = () => {
      recognition.stop();
    };
    recognition.onerror = (e: any) => {
      console.error("Voice recognition error:", e);
      alert(t('voiceError'));
    };
    recognition.start();
  };

  const ChatUI = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header - Only show if not forced open (which means it's the floating window) */}
      {!forceOpen && (
        <div className="bg-primary-teal p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest">{t('chatbotTitle')}</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{isPashto ? "آنلاین" : "Online"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSpeaking(!isSpeaking)}
              className={cn("p-2 rounded-lg hover:bg-white/10 transition-all", isSpeaking ? "text-white" : "text-white/40")}
            >
              {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-all text-white/60"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

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
              msg.sender === 'user' ? (isPashto ? "mr-auto flex-row" : "ml-auto flex-row-reverse") : (isPashto ? "ml-auto flex-row-reverse" : "mr-auto")
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
                ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
                : "bg-slate-900 text-white shadow-xl",
              msg.sender === 'user'
                ? (isPashto ? "rounded-tr-none" : "rounded-tl-none")
                : (isPashto ? "rounded-tl-none" : "rounded-tr-none")
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className={cn("flex gap-4 max-w-[85%]", isPashto ? "ml-auto" : "mr-auto")}>
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
            placeholder={t('ask_ai_placeholder') || "Ask about inventory..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-6 pr-24 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all shadow-inner"
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
               <Send size={18} className={cn(isPashto && "rotate-180")} />
             </button>
           </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
           {[t('check_stock') || 'Check Stock', t('create_request') || 'Create Request', t('low_stock_items') || 'Low Stock'].map(s => (
             <button 
              key={s}
              onClick={() => { setInput(s); handleSend(); }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-400 py-2 px-4 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all"
             >
               {s}
             </button>
           ))}
        </div>
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className={cn("flex flex-col h-full bg-slate-50", isPashto ? "rtl" : "ltr")} dir={isPashto ? "rtl" : "ltr"}>
          <ChatUI />
      </div>
    );
  }

  if (forceOpen) {
    return (
      <div className={cn("flex flex-col h-full", isRtl ? "rtl" : "ltr")} dir={isRtl ? "rtl" : "ltr"}>
        <ChatUI />
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-[99999]" dir={isRtl ? "rtl" : "ltr"}>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "mb-6 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden",
              isPashto ? "rtl" : "ltr"
            )}
          >
            <ChatUI />
          </motion.div>
        )}
      </AnimatePresence>

      {!forceOpen && (
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
      )}
    </div>
  );
};
