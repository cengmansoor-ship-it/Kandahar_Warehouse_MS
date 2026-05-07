import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AIAssistant } from '../AIAssistant';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Menu, Bell, LogOut, Camera, Sparkles, X, Sun, Moon, Eye, Mail, Edit2, Send, RotateCcw } from 'lucide-react';
import { notificationService, emailService } from '@/src/services/api';
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
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState<'system' | 'email'>('system');
  const [showChatbot, setShowChatbot] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(localStorage.getItem('profile_image'));
  const [theme, setTheme] = useState<'light' | 'dark' | 'comfort'>(localStorage.getItem('theme') as any || 'light');
  const [editingEmail, setEditingEmail] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'comfort-mode');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    if (theme === 'comfort') document.documentElement.classList.add('comfort-mode');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchLogs = async () => {
    try {
      const [notifRes, emailRes] = await Promise.all([
        notificationService.getNotifications(),
        emailService.getEmails()
      ]);
      setNotifications(notifRes.data || []);
      setSentEmails(emailRes.data || []);
    } catch (err) {
      console.error("Failed to load logs", err);
    }
  };

  useEffect(() => {
    fetchLogs();
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
            <div className="flex items-center gap-3">
              <div className="text-xl lg:text-2xl font-black text-[#0F8F7F] tracking-tighter">{t('app_name')}</div>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all duration-500 shadow-sm",
                isOnline 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                  : "bg-red-50 text-red-600 border-red-100 animate-pulse"
              )}>
                 <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-red-500")} />
                 {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
             <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1 shadow-sm">
                <button 
                  onClick={() => setTheme('light')}
                  className={cn("p-2 rounded-xl transition-all", theme === 'light' ? "bg-white text-amber-500 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                  title="Light Mode"
                >
                  <Sun size={18} />
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={cn("p-2 rounded-xl transition-all", theme === 'dark' ? "bg-slate-900 text-slate-100 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                  title="Dark Mode"
                >
                  <Moon size={18} />
                </button>
                <button 
                  onClick={() => setTheme('comfort')}
                  className={cn("p-2 rounded-xl transition-all", theme === 'comfort' ? "bg-[#efe7d5] text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                  title="Eye Comfort Shield"
                >
                  <Eye size={18} />
                </button>
             </div>

             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#0F8F7F] hover:border-[#0F8F7F]/20 transition-all relative"
                >
                  <Bell size={20} />
                  {(notifications.length > 0 || sentEmails.length > 0) && (
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
                        "absolute top-16 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden",
                        isRtl ? "left-0" : "right-0"
                      )}
                    >
                      <div className="p-6 border-b border-slate-50">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('inbox')}</h4>
                          <button 
                            onClick={clearNotifications}
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                          >
                            {t('clear')}
                          </button>
                        </div>
                        
                        <div className="flex bg-slate-50 p-1 rounded-xl mb-2">
                           <button 
                             onClick={() => setActiveNotificationTab('system')}
                             className={cn("flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", activeNotificationTab === 'system' ? "bg-white text-primary-teal shadow-sm" : "text-slate-400")}
                           >
                             System
                           </button>
                           <button 
                             onClick={() => {
                               setActiveNotificationTab('email');
                               fetchLogs();
                             }}
                             className={cn("flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", activeNotificationTab === 'email' ? "bg-white text-primary-teal shadow-sm" : "text-slate-400")}
                           >
                             Emails Sent
                           </button>
                        </div>
                      </div>

                      <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {activeNotificationTab === 'system' ? (
                          notifications.length === 0 ? (
                            <div className="text-center py-10">
                              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('workspace_quiet')}</div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {notifications.map((n) => (
                                <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                   <div className="text-[10px] font-black text-[#0F8F7F] uppercase tracking-widest">{n.title}</div>
                                   <div className="text-xs text-slate-600 mt-1 font-medium">{n.message}</div>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <div className="space-y-4">
                            {sentEmails.length === 0 ? (
                              <div className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No emails sent yet</div>
                            ) : (
                              sentEmails.map((email) => (
                                <div key={email.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                   <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                         <Mail size={12} className="text-primary-teal" />
                                         <span className="text-[9px] font-black text-slate-900 truncate max-w-[120px]">{email.to}</span>
                                      </div>
                                      <span className={cn("text-[7px] font-black uppercase px-1.5 py-0.5 rounded", email.status === 'Sent' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>{email.status}</span>
                                   </div>
                                   <div className="text-[10px] font-black text-slate-600 uppercase mb-2 truncate">{email.subject}</div>
                                   
                                   <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50">
                                      <button 
                                        onClick={() => {
                                          setEditingEmail(email);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase text-slate-400 hover:text-primary-teal hover:border-primary-teal transition-all"
                                      >
                                        <Edit2 size={10} /> Edit
                                      </button>
                                      <button 
                                        onClick={async () => {
                                          const tId = toast.loading("Resending...");
                                          try {
                                            const resPromise = emailService.sendEmail({
                                              to: email.to,
                                              subject: email.subject,
                                              text: email.text,
                                              html: email.html,
                                              requestId: email.requestId,
                                              type: email.type
                                            });

                                            // Add an 8-second safety timeout for the UI feedback
                                            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000));
                                            
                                            await Promise.race([resPromise, timeoutPromise]);
                                            
                                            toast.success("Message re-queued successfully", { id: tId });
                                            fetchLogs();
                                          } catch (e: any) {
                                            const msg = e.message === "Timeout" ? "Transmission is taking longer than expected, checking status..." : "Retransmission failed";
                                            toast.error(msg, { id: tId });
                                          } finally {
                                            // Safety dismiss
                                            setTimeout(() => toast.dismiss(tId), 5000);
                                          }
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase hover:bg-primary-teal transition-all"
                                      >
                                        <RotateCcw size={10} /> Send Again
                                      </button>
                                   </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {editingEmail && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                 <div className="bg-white w-full max-w-lg rounded-[44px] shadow-2xl p-10 space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Refine Message</h3>
                       <button onClick={() => setEditingEmail(null)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-red-500"><X size={20} /></button>
                    </div>
                    <div className="space-y-4 text-start">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                          <input 
                            value={editingEmail.subject}
                            onChange={(e) => setEditingEmail({...editingEmail, subject: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-black focus:ring-4 focus:ring-primary-teal/5 outline-none" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                          <textarea 
                            value={editingEmail.text}
                            onChange={(e) => setEditingEmail({...editingEmail, text: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-medium focus:ring-4 focus:ring-primary-teal/5 outline-none min-h-[200px]" 
                          />
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <button 
                          onClick={async () => {
                            try {
                              await emailService.updateEmail(editingEmail.id, editingEmail);
                              toast.success("Draft updated successfully");
                              setEditingEmail(null);
                              fetchLogs();
                            } catch (e) {
                              toast.error("Failed to save changes");
                            }
                          }}
                          className="flex-1 bg-white border-2 border-slate-900 text-slate-900 py-5 rounded-[28px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                       >
                         Save Draft
                       </button>
                       <button 
                          onClick={async () => {
                            const tId = toast.loading("Sending refined message...");
                            try {
                              await emailService.updateEmail(editingEmail.id, editingEmail);
                              await emailService.sendEmail({
                                to: editingEmail.to,
                                subject: editingEmail.subject,
                                body: editingEmail.text,
                                recipientName: editingEmail.to.split('@')[0]
                              });
                              toast.success("Refined message dispatched!", { id: tId });
                              setEditingEmail(null);
                              fetchLogs();
                            } catch (e) {
                              toast.error("Dispatch failure", { id: tId });
                            }
                          }}
                          className="flex-2 bg-slate-900 text-white py-5 rounded-[28px] text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all shadow-xl shadow-black/10"
                       >
                         Send Refined Now
                       </button>
                    </div>
                 </div>
               </div>
             )}

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
          <div className="max-w-7xl mx-auto w-full">
             {children}
          </div>
        </main>

        <AIAssistant />
      </div>
    </div>
  );
};

