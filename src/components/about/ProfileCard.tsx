import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Code, Database, Layout } from 'lucide-react';

interface ProfileCardProps {
  name: string;
  role: string;
  bio: string;
  skills: string[];
  imagePath: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ name, role, bio, skills, imagePath }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div 
      whileHover={{ y: -5, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm transition-all group flex flex-col items-center text-center h-full"
    >
      <div className="relative w-32 h-32 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-primary-teal/10 group-hover:border-primary-teal/30 transition-colors" />
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-50 flex items-center justify-center">
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
              <User size={48} strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">{name}</h3>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#0F8F7F] mb-4">{role}</p>
      
      <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 flex-grow">
        {bio}
      </p>

      <div className="flex flex-wrap gap-2 justify-center">
        {skills.map((skill, index) => (
          <span 
            key={index}
            className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-100"
          >
            {skill}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default ProfileCard;
