import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className="p-8 text-center">
            <div className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6",
              variant === 'danger' ? "bg-rose-50 text-rose-500" : 
              variant === 'warning' ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-500"
            )}>
              <AlertCircle size={40} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic mb-2">
              {title}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex p-6 gap-3 bg-slate-50/50 border-t border-slate-50">
            <button 
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={cn(
                "flex-1 py-4 px-6 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg",
                variant === 'danger' ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200" : 
                variant === 'warning' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" : "bg-[#0F8F7F] hover:bg-[#0D7A6D] shadow-emerald-200"
              )}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
