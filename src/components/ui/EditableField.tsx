import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { Check, X, Edit2 } from 'lucide-react';

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => void;
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
  placeholder = "Edit content...",
  isEditable = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTempValue(value);
    setIsEditing(false);
  };

  if (!isEditable) {
    return <div className={cn("text-start", className)}>{value || placeholder}</div>;
  }

  if (isEditing) {
    return (
      <div className="relative group/edit flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
        {multiline ? (
          <textarea
            autoFocus
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className={cn(
              "w-full bg-slate-50 border-2 border-primary-teal rounded-xl p-2 text-inherit outline-none resize-none min-h-[60px]",
              className
            )}
            placeholder={placeholder}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className={cn(
              "w-full bg-slate-50 border-b-2 border-primary-teal outline-none py-1",
              className
            )}
            placeholder={placeholder}
          />
        )}
        <div className="flex flex-col gap-1">
          <button 
            onClick={handleSave}
            className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
          >
            <Check size={12} />
          </button>
          <button 
            onClick={handleCancel}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group/hover relative cursor-pointer hover:bg-slate-50/50 rounded transition-colors px-1 -mx-1 text-start min-h-[1.5em]",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      {value || <span className="text-slate-300 italic">{placeholder}</span>}
      <div className="absolute top-1/2 -right-6 -translate-y-1/2 opacity-0 group-hover/hover:opacity-100 transition-opacity bg-white/80 backdrop-blur p-1 rounded-full text-primary-teal no-print">
        <Edit2 size={10} />
      </div>
    </div>
  );
};
