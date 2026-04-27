import React from 'react';

interface DocumentHeaderProps {
  title: string;
  projectTitle: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ title, projectTitle }) => {
  return (
    <div className="flex flex-col items-center mb-6 text-center">
      <div className="w-full flex justify-between items-start mb-4">
        <div className="w-[100px]">
          <img 
            src="https://upload.wikimedia.org/wikipedia/en/2/23/Kandahar_University_Logo.png" 
            alt="Kandahar University Logo" 
            className="w-full h-auto"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              console.warn('Failed to load University Logo');
            }}
          />
        </div>
        
        <div className="flex-1 px-4 text-slate-900 font-bold">
          <p className="text-lg leading-tight mb-1">د افغانستان اسلامي امارت</p>
          <p className="text-base leading-tight mb-1">د لوړو زده کړو وزارت</p>
          <p className="text-base leading-tight mb-4">کندهار پوهنتون</p>
          
          <div className="border-y-2 border-slate-900 py-2 mb-4">
            <h1 className="text-xl font-black">{title}</h1>
          </div>
          
          <div className="text-red-600 px-8 py-1 rounded border border-red-600/30 bg-red-50/50 inline-block">
             <h2 className="text-lg font-black">{projectTitle}</h2>
          </div>
        </div>

        <div className="w-[100px] flex justify-end">
           <img 
            src="https://seeklogo.com/images/A/afghanistan-ministry-of-education-logo-8803EA4A9F-seeklogo.com.png" 
            alt="Ministry Logo" 
            className="w-full h-auto opacity-80"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              console.warn('Failed to load Ministry Logo');
            }}
          />
        </div>
      </div>
    </div>
  );
};
