import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Menu, Bell, LogOut, Camera } from 'lucide-react';
import { notificationService } from '@/src/services/api';
import { toast } from 'sonner';

import { User } from '@/src/types';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: User;
}

export const Layout = ({ children, onLogout, user }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(localStorage.getItem('profile_image'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  useEffect(() => {
    notificationService.getNotifications().then(res => setNotifications(res.data || []));
  }, []);

  useEffect(() => {
    // If user has an image in profile image state, use it
    if (user.image && !profileImage) {
      setProfileImage(user.image);
    }
  }, [user]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedProfile = localStorage.getItem('profile_image');
      if (storedProfile) setProfileImage(storedProfile);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('upload_image_error'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileImage(base64);
        localStorage.setItem('profile_image', base64);
        toast.success(t('profile_updated'));
        window.dispatchEvent(new Event('storage'));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearNotifications = async () => {
    try {
      await notificationService.clearNotifications();
      setNotifications([]);
      setShowNotifications(false);
      toast.success(t('notifications_cleared'));
    } catch (error) {
      toast.error(t('failed_clear_notifications'));
    }
  };

  return (
    <div className={`flex h-screen bg-[#F8F9FA] font-sans`} dir={i18n.dir()}>
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        onLogout={onLogout}
        user={user}
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
            <div className="text-xl lg:text-2xl font-black text-[#0F8F7F] tracking-tighter">{t('app_name')}</div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#0F8F7F] hover:border-[#0F8F7F]/20 transition-all relative"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className={cn("absolute top-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full", isRtl ? "left-2" : "right-2")} />
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={cn(
                        "absolute top-16 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 p-6",
                        isRtl ? "left-0" : "right-0"
                      )}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('inbox')}</h4>
                        <button 
                          onClick={clearNotifications}
                          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                        >
                          {t('clear')}
                        </button>
                      </div>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="text-center py-10">
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('workspace_quiet')}</div>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                               <div className="text-[10px] font-black text-[#0F8F7F] uppercase tracking-widest">{n.title}</div>
                               <div className="text-xs text-slate-600 mt-1 font-medium">{n.message}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

            <div className="relative group">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/png, image/jpeg" 
                className="hidden" 
              />
              <div 
                onClick={handleImageClick}
                className="w-12 h-12 rounded-full bg-[#0F8F7F]/5 border border-[#0F8F7F]/10 flex items-center justify-center text-[#0F8F7F] shadow-inner cursor-pointer hover:bg-[#0F8F7F]/10 transition-all overflow-hidden relative group"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-lg">{t('admin_initial')}</span>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-full">
                  <Camera size={14} />
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

