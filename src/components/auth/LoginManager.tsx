import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

export const LoginManager = ({ onLogin }: { onLogin: () => void }) => {
  const { t, i18n } = useTranslation();
  const [logo, setLogo] = useState<string>(localStorage.getItem('system_logo') || "https://upload.wikimedia.org/wikipedia/en/2/23/Kandahar_University_Logo.png");
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedLogo = localStorage.getItem('system_logo');
      if (storedLogo) setLogo(storedLogo);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Default credentials for the user
  const adminEmail = "admin@kandahar.edu.af";
  const adminPass = "admin123";

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgotPassword) {
      toast.success(`${t('reset_link_sent')} ${email}`);
      setIsForgotPassword(false);
      return;
    }
    if (!email || (!isForgotPassword && !password)) {
      toast.error(t('missing_fields'));
      return;
    }
    if (isLogin) {
      if (email === adminEmail && password === adminPass) {
        toast.success(t('auth_success'));
        onLogin();
      } else if (password.length >= 3) {
        toast.success(`${t('access_granted')} ${email}`);
        onLogin();
      } else {
        toast.error(t('invalid_credentials'));
      }
    } else {
      toast.success(t('registry_success'));
      setTimeout(() => onLogin(), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-white overflow-hidden font-sans">
      {/* 
         LEFT / TOP PANEL (Green Section) 
         In the image, this contains the "Welcome Back!" message and a switch button.
      */}
      <motion.div 
        animate={{ width: isLogin ? '40%' : '60%', x: 0 }}
        className={cn(
          "hidden lg:flex transition-all duration-700 relative p-16 flex-col justify-center items-center text-center text-white overflow-hidden",
          "bg-[#0F8F7F]"
        )}
      >
        <div className="absolute top-8 left-8 flex items-center gap-2 opacity-80 ltr-only">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
            <img 
              src={logo} 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <motion.div
          key={isLogin ? 'welcome' : 'join'}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xs"
        >
          <h1 className="text-4xl font-black mb-4">
            {isLogin ? t('welcome_back') : t('new_here')}
          </h1>
          <p className="text-white/80 font-medium mb-10 leading-relaxed">
            {isLogin 
              ? t('welcome_msg_login') 
              : t('welcome_msg_signup')}
          </p>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="px-12 py-3 border-2 border-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-white hover:text-[#0F8F7F] transition-all"
          >
            {isLogin ? t('sign_up') : t('sign_in')}
          </button>
        </motion.div>
      </motion.div>

      {/* 
         RIGHT / FORM PANEL 
      */}
      <div className="flex-1 h-full flex items-center justify-center p-8 lg:p-24">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md text-center"
        >
          <h2 className="text-2xl font-black text-[#0F8F7F] mb-6 tracking-tight">
            {isForgotPassword ? t('reset_password') : isLogin ? t('sign_in') : t('welcome_wms')}
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && !isForgotPassword && (
              <div className="relative group text-start">
                <User className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F8F7F] transition-colors", i18n.language === 'ps' ? "right-4" : "left-4")} size={18} />
                <input 
                  type="text" 
                  placeholder={t('name')}
                  className={cn(
                    "w-full bg-[#f1f4f8] border-none rounded-lg py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0F8F7F]/10",
                    i18n.language === 'ps' ? "pr-12 pl-4" : "pl-12 pr-4"
                  )}
                />
              </div>
            )}

            <div className="relative group text-start">
              <Mail className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F8F7F] transition-colors", i18n.language === 'ps' ? "right-4" : "left-4")} size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email')}
                className={cn(
                  "w-full bg-[#f1f4f8] border-none rounded-lg py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0F8F7F]/10",
                  i18n.language === 'ps' ? "pr-12 pl-4" : "pl-12 pr-4"
                )}
                required
              />
            </div>

            {!isForgotPassword && (
              <div className="relative group text-start">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F8F7F] transition-colors", i18n.language === 'ps' ? "right-4" : "left-4")} size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('password')}
                  className={cn(
                    "w-full bg-[#f1f4f8] border-none rounded-lg py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0F8F7F]/10",
                    i18n.language === 'ps' ? "pr-12 pl-4" : "pl-12 pr-4"
                  )}
                  required
                />
              </div>
            )}

            {isLogin && !isForgotPassword && (
              <button 
                type="button" 
                onClick={() => setIsForgotPassword(true)}
                className="text-slate-400 text-xs underline block mx-auto py-2"
              >
                {t('forgot_password_q')}
              </button>
            )}

            {isForgotPassword && (
              <button 
                type="button" 
                onClick={() => setIsForgotPassword(false)}
                className="text-slate-400 text-xs underline block mx-auto py-2"
              >
                {t('back_to_signin')}
              </button>
            )}

            <div className="pt-6">
              <button 
                type="submit"
                className="bg-[#0F8F7F] text-white px-16 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#0F8F7F]/90 transition-all shadow-xl shadow-[#0F8F7F]/10"
              >
                {isForgotPassword ? t('send_link') : isLogin ? t('sign_in') : t('sign_up')}
              </button>
            </div>
            
            <p className="lg:hidden text-xs text-slate-400 mt-8">
              {isLogin ? t('new_here') : t('already_have_account')} 
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 font-bold text-[#0F8F7F]"
              >
                {isLogin ? t('sign_up') : t('sign_in')}
              </button>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
