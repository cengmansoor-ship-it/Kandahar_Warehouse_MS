import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout = ({ children, onLogout }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  return (
    <div className={`flex h-screen bg-[#F8F9FA] font-sans`} dir={i18n.dir()}>
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        onLogout={onLogout}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-white flex items-center justify-between px-4 lg:px-10 z-40">
          <div className="flex items-center gap-4 lg:gap-0">
            <button 
              onClick={() => setCollapsed(false)}
              className="lg:hidden p-3 bg-slate-50 text-slate-500 rounded-2xl border border-slate-100 shadow-sm"
            >
              <Menu size={20} />
            </button>
            <div className="text-xl lg:text-2xl font-black text-primary-teal ltr-only tracking-tighter">KANDAHAR WMS</div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
             <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 scale-90 lg:scale-100">
               <button onClick={() => i18n.changeLanguage('en')} className={cn("px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", i18n.language === 'en' ? "bg-white text-primary-teal shadow-xl shadow-black/5" : "text-slate-400 hover:text-slate-600")}>EN</button>
               <button onClick={() => i18n.changeLanguage('ps')} className={cn("px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", i18n.language === 'ps' ? "bg-white text-primary-teal shadow-xl shadow-black/5" : "text-slate-400 hover:text-slate-600")}>PS</button>
               <button onClick={() => i18n.changeLanguage('dr')} className={cn("px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", i18n.language === 'dr' ? "bg-white text-primary-teal shadow-xl shadow-black/5" : "text-slate-400 hover:text-slate-600")}>DR</button>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary-teal/5 border border-primary-teal/10 flex items-center justify-center text-primary-teal shadow-inner group cursor-pointer hover:bg-primary-teal/10 transition-colors">
              <span className="font-black text-lg">A</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
