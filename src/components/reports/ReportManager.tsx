import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, FileSpreadsheet, FileJson as FilePdf, Filter, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const ReportManager = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState('analytics');

  const data = [
    { name: t('dept_engineering'), stock: 4000, requests: 2400 },
    { name: t('dept_computer_science'), stock: 3000, requests: 1398 },
    { name: t('dept_medicine'), stock: 2000, requests: 9800 },
    { name: t('dept_agriculture'), stock: 2780, requests: 3908 },
    { name: t('dept_humanities'), stock: 1890, requests: 4800 },
  ];

  const pieData = [
    { name: t('cat_electronics'), value: 400 },
    { name: t('cat_furniture'), value: 300 },
    { name: t('cat_stationery'), value: 300 },
    { name: t('cat_medical'), value: 200 },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('reports')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none text-start">
            {t('reports_description')}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => toast.success(t('excel_report_success'))}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white text-slate-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100 shadow-sm"
          >
            <FileSpreadsheet size={18} />
            {t('excel')}
          </button>
          <button 
            onClick={() => toast.loading(t('generating_pdf'))}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
          >
            <FilePdf size={18} />
            {t('export_pdf')}
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'analytics' ? "bg-white text-primary-teal shadow-xl shadow-black/5" : "text-slate-400 hover:text-slate-600"
          )}
        >
          {t('analytics')}
        </button>
        <button 
          onClick={() => setActiveTab('needs')}
          className={cn(
            "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'needs' ? "bg-white text-primary-teal shadow-xl shadow-black/5" : "text-slate-400 hover:text-slate-600"
          )}
        >
          {t('needs_analysis')}
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="fintech-card p-8 bg-white">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-1.5 h-6 bg-primary-teal rounded-full" />
                 <h3 className="font-black text-xl text-slate-900 tracking-tight">{t('stock_vs_requests')}</h3>
              </div>
              <div className="flex items-center gap-2 text-emerald-600">
                 <TrendingUp size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">+12%</span>
              </div>
            </div>
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                  />
                  <Bar dataKey="stock" fill="#0F8F7F" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="requests" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="fintech-card p-8 bg-white">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
               <h3 className="font-black text-xl text-slate-900 tracking-tight">{t('inventory_distribution')}</h3>
            </div>
            <div className="h-80 w-full flex items-center justify-center" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#0F8F7F' : COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: index === 0 ? '#0F8F7F' : COLORS[index % COLORS.length]}}></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="fintech-card p-10 bg-white space-y-12">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 rounded-3xl bg-primary-teal text-white flex items-center justify-center shadow-2xl shadow-primary-teal/30 shrink-0">
                    <Calendar size={32} />
                 </div>
                 <div className="text-start">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">{t('needs_analysis_title')}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{t('fiscal_year_hijri')}</p>
                 </div>
              </div>
              <button 
                onClick={() => toast.info(t('forecasting_initializing'))}
                className="bg-[#1A1D1F] text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all flex items-center gap-4 shadow-2xl justify-center"
              >
                {t('run_ai_forecasting')}
                <ArrowRight size={18} className={cn(t('lang_direction') === 'rtl' && "rotate-180")} />
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <AnalysisMetric title={t('projected_budget')} value="$420,000" sub={t('avg_consumption')} />
              <AnalysisMetric title={t('top_required_sku')} value={t('printing_paper')} sub={t('est_units')} />
              <AnalysisMetric title={t('procurement_cycle')} value={t('quarterly')} sub={t('recommended_frequency')} />
           </div>

           <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-500 text-xs font-medium leading-relaxed text-start">
             {t('needs_analysis_note')}
           </div>
        </div>
      )}
    </div>
  );
};

const AnalysisMetric: React.FC<{ title: string, value: string, sub: string }> = ({ title, value, sub }) => (
  <div className="p-8 bg-slate-100/50 rounded-3xl border border-slate-100 flex flex-col justify-between group hover:bg-white hover:shadow-2xl transition-all">
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{title}</div>
    <div>
       <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-primary-teal transition-colors">{value}</div>
       <div className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wide">{sub}</div>
    </div>
  </div>
);
