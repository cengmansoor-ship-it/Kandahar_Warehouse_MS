import React from 'react';

interface DocumentHeaderProps {
  title: string;
  projectTitle: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ title, projectTitle }) => {
  const [logos, setLogos] = React.useState({
    university: localStorage.getItem('doc_logo_university') || "https://upload.wikimedia.org/wikipedia/en/2/23/Kandahar_University_Logo.png",
    ministry: localStorage.getItem('doc_logo_ministry') || "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_the_Taliban.svg/1024px-Flag_of_the_Taliban.svg.png"
  });

  const handleLogoChange = (type: 'university' | 'ministry') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const val = evt.target?.result as string;
          setLogos(prev => {
            const next = { ...prev, [type]: val };
            localStorage.setItem(`doc_logo_${type}`, val);
            return next;
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col items-center mb-8 text-center w-full">
      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex flex-col items-center gap-2">
          <div 
            onClick={() => handleLogoChange('university')}
            className="w-[100px] h-[100px] flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:ring-4 hover:ring-primary-teal/10 transition-all group"
          >
            <img 
              src={logos.university} 
              alt="Kandahar University Logo" 
              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
              loading="eager"
            />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Kandahar University</span>
        </div>
        
        <div className="flex-1 px-8 text-slate-900 font-bold">
          <p className="text-xl leading-snug mb-1 font-black">د افغانستان اسلامي امارت</p>
          <p className="text-lg leading-snug mb-1 font-black">د لوړو زده کړو وزارت</p>
          <p className="text-lg leading-snug mb-6 font-black">کندهار پوهنتون</p>
          
          <div className="border-y-2 border-slate-900 py-4 mb-6 relative">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-white px-4 text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Official Document</div>
            <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          </div>
          
          <div className="bg-slate-900 text-white px-10 py-2 rounded-full inline-block shadow-xl shadow-slate-900/10">
             <h2 className="text-sm font-black uppercase tracking-tight">{projectTitle}</h2>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div 
            onClick={() => handleLogoChange('ministry')}
            className="w-[100px] h-[100px] flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:ring-4 hover:ring-primary-teal/10 transition-all group"
          >
             <img 
              src={logos.ministry} 
              alt="Ministry Logo" 
              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
              loading="eager"
            />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Ministry Logo</span>
        </div>
      </div>
    </div>
  );
};
