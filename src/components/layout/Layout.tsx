import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  return (
    <div className={`flex h-screen bg-[#F8F9FA] font-sans`} dir={i18n.dir()}>
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 z-40">
          <div className="text-xl font-black text-primary-teal ltr-only">KANDAHAR WMS</div>
          <div className="flex items-center gap-4">
             <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
               <button onClick={() => i18n.changeLanguage('en')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", i18n.language === 'en' ? "bg-white text-primary-teal shadow-sm" : "text-slate-400")}>EN</button>
               <button onClick={() => i18n.changeLanguage('ps')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", i18n.language === 'ps' ? "bg-white text-primary-teal shadow-sm" : "text-slate-400")}>PS</button>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-teal/10 border border-primary-teal/20 flex items-center justify-center text-primary-teal">
              <span className="font-black">A</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
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
