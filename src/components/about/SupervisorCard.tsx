import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Quote, GraduationCap, Building2, UserCheck } from 'lucide-react';

interface SupervisorCardProps {
  name: string;
  faculty: string;
  department: string;
  role: string;
  bio: string;
  quote: string;
  imagePath: string;
}

const SupervisorCard: React.FC<SupervisorCardProps> = ({ 
  name, faculty, department, role, bio, quote, imagePath 
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-[40px] p-8 lg:p-12 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-teal/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      
      <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full border-8 border-primary-teal/5 -m-4" />
          <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden shadow-2xl bg-slate-50 border-4 border-white flex items-center justify-center">
            {!imageError ? (
              <img 
                src={imagePath} 
                alt={name} 
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-teal/5 flex items-center justify-center text-primary-teal">
                <UserCheck size={80} strokeWidth={1} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-teal/10 rounded-full text-[#0F8F7F]">
              <GraduationCap size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{role}</span>
            </div>
            
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
              {name}
            </h2>
            
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2 text-slate-500">
                <Building2 size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{faculty}</span>
              </div>
              <div className="w-1 h-1 bg-slate-200 rounded-full" />
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {department}
              </div>
            </div>
          </div>

          <p className="text-sm lg:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
            {bio}
          </p>

          <div className="relative pt-8">
            <Quote className="absolute top-0 left-0 text-primary-teal/20 w-12 h-12 -mt-4 -ml-4" />
            <p className="text-lg lg:text-xl font-bold text-slate-800 italic leading-relaxed pl-8">
              "{quote}"
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SupervisorCard;
