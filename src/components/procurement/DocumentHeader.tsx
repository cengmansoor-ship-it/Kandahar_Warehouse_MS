import React from 'react';
import { useTranslation } from 'react-i18next';

interface DocumentHeaderProps {
  title: React.ReactNode;
  projectTitle: React.ReactNode;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ title, projectTitle }) => {
  const { t } = useTranslation();
  const [data, setData] = React.useState({
    islamicState: t('emirate_name'),
    ministry: t('ministry_name'),
    university: t('univ_name')
  });

  // Update defaults when language changes
  React.useEffect(() => {
    setData({
      islamicState: t('emirate_name'),
      ministry: t('ministry_name'),
      university: t('univ_name')
    });
  }, [t]);

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
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <div className="flex flex-col items-center gap-1">
          <div 
            onClick={() => handleLogoChange('university')}
            className="w-[60px] h-[60px] flex items-center justify-center bg-slate-50 rounded-xl p-1 border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:ring-4 hover:ring-primary-teal/10 transition-all group relative"
          >
            <div className="absolute inset-0 bg-primary-teal/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[6px] font-black uppercase tracking-widest z-10">
              Upload
            </div>
            <img 
              src={logos.university} 
              alt="Kandahar University Logo" 
              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
              loading="eager"
            />
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Kandahar University</span>
        </div>

        <div className="flex-1 px-8 text-black font-bold">
          <input 
            value={data.islamicState} 
            onChange={(e) => setData({...data, islamicState: e.target.value})}
            className="text-lg leading-snug mb-0.5 font-black w-full bg-transparent border-none text-center focus:ring-1 focus:ring-emerald-500 rounded"
          />
          <input 
            value={data.ministry} 
            onChange={(e) => setData({...data, ministry: e.target.value})}
            className="text-base leading-snug mb-0.5 font-black w-full bg-transparent border-none text-center focus:ring-1 focus:ring-emerald-500 rounded"
          />
          <input 
            value={data.university} 
            onChange={(e) => setData({...data, university: e.target.value})}
            className="text-base leading-snug mb-4 font-black w-full bg-transparent border-none text-center focus:ring-1 focus:ring-emerald-500 rounded"
          />
          
          <div className="border-y-2 border-slate-900 py-3 mb-4 relative">
             <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-white px-4 text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Official Document</div>
             <div className="text-xl font-black tracking-tight text-black">{title}</div>
          </div>
          
          <div className="bg-slate-50 border-2 border-slate-900 text-black px-6 py-1 rounded-full inline-block shadow-xl shadow-slate-900/5">
             <div className="text-xs font-black uppercase tracking-tight text-black">{projectTitle}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div 
            onClick={() => handleLogoChange('ministry')}
            className="w-[60px] h-[60px] flex items-center justify-center bg-slate-50 rounded-xl p-1 border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:ring-4 hover:ring-primary-teal/10 transition-all group relative"
          >
             <div className="absolute inset-0 bg-primary-teal/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[6px] font-black uppercase tracking-widest z-10">
              Upload
            </div>
             <img 
              src={logos.ministry} 
              alt="Ministry Logo" 
              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
              loading="eager"
            />
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Islamic Emirate</span>
        </div>
      </div>
    </div>
  );
};
