import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

export const LoginManager = ({ onLogin }: { onLogin: () => void }) => {
  const { t, i18n } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);

  // Default credentials for the user
  const adminEmail = "admin@kandahar.edu.af";
  const adminPass = "admin123";

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      if (email === adminEmail && password === adminPass) {
        onLogin();
        toast.success("Welcome, Store Master!");
      } else {
        toast.error("Invalid credentials. Try admin@kandahar.edu.af / admin123");
      }
    } else {
      onLogin(); // Mock registration for demo
    }
  };

  const isRTL = i18n.dir() === 'rtl';

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
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-black">K</div>
          <span className="text-xs font-black uppercase tracking-widest italic">Kandahar Uni</span>
        </div>

        <motion.div
          key={isLogin ? 'welcome' : 'join'}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xs"
        >
          <h1 className="text-4xl font-black mb-4">
            {isLogin ? "Welcome Back!" : "New Here?"}
          </h1>
          <p className="text-white/80 font-medium mb-10 leading-relaxed">
            {isLogin 
              ? "To keep connected with us please login with your personal info" 
              : "Enter your personal details and start your journey with university logistics"}
          </p>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="px-12 py-3 border-2 border-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-white hover:text-[#0F8F7F] transition-all"
          >
            {isLogin ? "SIGN UP" : "SIGN IN"}
          </button>
        </motion.div>
      </motion.div>

      {/* 
         RIGHT / FORM PANEL 
      */}
      <div className="flex-1 h-full flex items-center justify-center p-8 lg:p-24 bg-slate-50/20">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md text-center"
        >
          <h2 className="text-4xl font-black text-[#0F8F7F] mb-6 tracking-tight">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>

          <div className="flex justify-center gap-4 mb-8">
            {['f', 'G+', 'in'].map((social) => (
              <div key={social} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                {social}
              </div>
            ))}
          </div>

          <p className="text-slate-400 text-xs font-medium mb-8 italic">
            or use your email for {isLogin ? 'login' : 'registration'}:
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F8F7F] transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Name"
                  className="w-full bg-[#f1f4f8] border-none rounded-lg py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0F8F7F]/10"
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F8F7F] transition-colors" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-[#f1f4f8] border-none rounded-lg py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0F8F7F]/10"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F8F7F] transition-colors" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#f1f4f8] border-none rounded-lg py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0F8F7F]/10"
              />
            </div>

            {isLogin && <button type="button" className="text-slate-400 text-xs underline block mx-auto py-2">Forgot your password?</button>}

            <div className="pt-6">
              <button 
                type="submit"
                className="bg-[#0F8F7F] text-white px-16 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#0F8F7F]/90 transition-all shadow-xl shadow-[#0F8F7F]/10"
              >
                {isLogin ? "SIGN IN" : "SIGN UP"}
              </button>
            </div>
            
            <p className="lg:hidden text-xs text-slate-400 mt-8">
              {isLogin ? "New here?" : "Already have an account?"} 
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 font-bold text-[#0F8F7F]"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
