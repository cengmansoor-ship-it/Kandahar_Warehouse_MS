import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { authService } from '@/src/services/api';

export const LoginManager = ({ onLogin }: { onLogin: (userData?: any) => void }) => {
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgotPassword) {
      if (password !== confirmPassword) {
        toast.error(t('passwords_do_not_match') || "Passwords do not match");
        return;
      }
      try {
        setIsLoading(true);
        await authService.forgotPassword(email, password);
        toast.success(t('password_reset_success') || "Password updated successfully. Please sign in.");
        setIsForgotPassword(false);
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to update password");
      } finally {
        setIsLoading(false);
      }
      return;
    }
    if (!email || (!isForgotPassword && !password)) {
      toast.error(t('missing_fields'));
      return;
    }

    if (isLogin) {
      try {
        setIsLoading(true);
        const res = await authService.login({ email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success(t('auth_success') || "Authentication successful");
        onLogin(res.data.user);
      } catch (error: any) {
        toast.error(error.response?.data?.error || t('invalid_credentials') || "Login failed");
      } finally {
        setIsLoading(false);
      }
    } else {
      // For demo, just simulate registration
      toast.info("Registration is handled by Administrator");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-white overflow-hidden font-sans">
      {/* 
         LEFT / TOP PANEL (Green Section) 
      */}
      <motion.div 
        animate={{ width: '40%', x: 0 }}
        className={cn(
          "hidden lg:flex transition-all duration-700 relative p-16 flex-col justify-center items-center text-center text-white overflow-hidden",
          "bg-[#0F8F7F]"
        )}
      >
        <div className={cn(
          "absolute top-8 flex items-center gap-4 opacity-80",
          i18n.language === 'ps' ? "right-8 flex-row-reverse" : "left-8"
        )}>
          <img 
            src={logo} 
            alt="Logo" 
            className="w-32 h-32 object-contain"
          />
          <div className="flex flex-col text-start">
            <span className="text-xl font-black uppercase tracking-widest">{t('univ_name')}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">{t('ministry_name')}</span>
          </div>
        </div>

        <motion.div
          key="welcome"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xs"
        >
          <h1 className="text-4xl font-black mb-4">
            {t('welcome_back')}
          </h1>
          <p className="text-white/80 font-medium mb-10 leading-relaxed">
            {t('welcome_msg_login')}
          </p>
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
            {isForgotPassword ? t('reset_password') : t('sign_in')}
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
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

            {isForgotPassword ? (
              <>
                <div className="relative group text-start">
                  <Lock className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F8F7F] transition-colors", i18n.language === 'ps' ? "right-4" : "left-4")} size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('new_password')}
                    className={cn(
                      "w-full bg-[#f1f4f8] border-none rounded-lg py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0F8F7F]/10",
                      i18n.language === 'ps' ? "pr-12 pl-4" : "pl-12 pr-4"
                    )}
                    required
                  />
                </div>
                <div className="relative group text-start">
                  <Lock className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F8F7F] transition-colors", i18n.language === 'ps' ? "right-4" : "left-4")} size={18} />
                  <input 
                    type="password" 
                    placeholder={t('confirm_password')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "w-full bg-[#f1f4f8] border-none rounded-lg py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0F8F7F]/10",
                      i18n.language === 'ps' ? "pr-12 pl-4" : "pl-12 pr-4"
                    )}
                    required
                  />
                </div>
              </>
            ) : (
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

            {!isForgotPassword && (
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
                disabled={isLoading}
                className="bg-[#0F8F7F] text-white px-16 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#0F8F7F]/90 transition-all shadow-xl shadow-[#0F8F7F]/10 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                )}
                {isForgotPassword ? t('reset_password') : t('sign_in')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
