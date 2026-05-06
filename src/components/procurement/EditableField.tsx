import React, { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  isEditable?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  className,
  multiline = false,
  placeholder = "Click to edit...",
  isEditable = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (!isEditable) {
    return <div className={cn("inline-block", className)}>{value || placeholder}</div>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full group transition-all animate-in fade-in zoom-in duration-200">
        {multiline ? (
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={cn(
              "flex-1 bg-white border-2 border-[#0F8F7F] rounded-xl p-3 outline-none font-bold text-slate-700 min-h-[100px] shadow-lg",
              className
            )}
            autoFocus
          />
        ) : (
          <input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={cn(
              "flex-1 bg-white border-b-4 border-[#0F8F7F] outline-none font-black text-slate-800 py-1 transition-all",
              className
            )}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        )}
        <div className="flex flex-col gap-1">
          <button
            onClick={handleSave}
            className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
          >
            <Check size={18} />
          </button>
          <button
            onClick={handleCancel}
            className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 shadow-lg shadow-rose-500/20 active:scale-90 transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={cn(
        "group cursor-pointer hover:bg-slate-50 rounded px-2 -mx-2 transition-all border-b border-transparent hover:border-slate-200 relative",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span>{value || <span className="text-slate-300 italic">{placeholder}</span>}</span>
        <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-teal shrink-0" />
      </div>
    </div>
  );
};
