import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Users, Building2, FileDown, Printer, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ReportFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filters: any) => void;
  type: 'excel' | 'pdf' | 'print';
}

export const ReportFilterModal: React.FC<ReportFilterModalProps> = ({ isOpen, onClose, onConfirm, type }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const [filters, setFilters] = React.useState({
    faculty: 'All',
    person: 'All',
    fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  });

  const [faculties, setFaculties] = React.useState<any[]>([]);
  const [personnel, setPersonnel] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [facRes, perRes] = await Promise.all([
          api.get('/faculties'),
          api.get('/personnel')
        ]);
        setFaculties(facRes.data || []);
        setPersonnel(perRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  if (!isOpen) return null;

  const Icon = type === 'excel' ? FileSpreadsheet : type === 'pdf' ? FileDown : Printer;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-[44px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="text-start">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                {type === 'print' ? 'Print' : type === 'excel' ? 'Export Excel' : 'Export PDF'}
                <Icon size={24} className="text-primary-teal" />
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Configure parameters for professional report generation</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 text-start">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Faculty</label>
                  <div className="relative">
                    <Building2 className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", isRtl ? "right-4" : "left-4")} size={18} />
                    <select 
                      value={filters.faculty}
                      onChange={(e) => setFilters({...filters, faculty: e.target.value})}
                      className={cn("w-full bg-slate-50 border-none rounded-2xl py-4.5 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700 appearance-none", isRtl ? "pr-12 pl-6" : "pl-12 pr-6")}
                    >
                       <option value="All">All Faculties</option>
                       {faculties.map(f => (
                         <option key={f.id} value={f.name}>{f.name}</option>
                       ))}
                    </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Person</label>
                  <div className="relative">
                    <Users className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", isRtl ? "right-4" : "left-4")} size={18} />
                    <select 
                      value={filters.person}
                      onChange={(e) => setFilters({...filters, person: e.target.value})}
                      className={cn("w-full bg-slate-50 border-none rounded-2xl py-4.5 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700 appearance-none", isRtl ? "pr-12 pl-6" : "pl-12 pr-6")}
                    >
                       <option value="All">All Personnel</option>
                       {personnel.map(p => (
                         <option key={p.id} value={p.name}>{p.name}</option>
                       ))}
                    </select>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From Date</label>
                  <div className="relative">
                    <Calendar className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", isRtl ? "right-4" : "left-4")} size={18} />
                    <input 
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                      className={cn("w-full bg-slate-50 border-none rounded-2xl py-4.5 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700", isRtl ? "pr-12 pl-6" : "pl-12 pr-6")}
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To Date</label>
                  <div className="relative">
                    <Calendar className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", isRtl ? "right-4" : "left-4")} size={18} />
                    <input 
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                      className={cn("w-full bg-slate-50 border-none rounded-2xl py-4.5 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700", isRtl ? "pr-12 pl-6" : "pl-12 pr-6")}
                    />
                  </div>
               </div>
            </div>

            <div className="pt-8">
               <button 
                onClick={() => onConfirm(filters)}
                className="w-full bg-slate-900 text-white py-6 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-teal transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 group"
               >
                 Generate {type.toUpperCase()} Document
                 <ArrowRight size={18} className={cn("group-hover:translate-x-1 transition-transform", isRtl && "rotate-180")} />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
