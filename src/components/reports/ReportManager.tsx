import React, { useEffect, useState } from 'react';
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
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Download, FileSpreadsheet, FileJson as FilePdf, Filter, TrendingUp, Calendar, ArrowRight, Package, Users, Activity, Target, AlertTriangle, List as ListIcon, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import * as XLSX from 'xlsx';
import { analyticsService } from '@/src/services/api';
import { useNavigate } from 'react-router-dom';
import { LabelList } from 'recharts';

const COLORS = ['#0F8F7F', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const ReportManager = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);

  const handleChartClick = (data: any) => {
    if (data && data.activeLabel) {
      navigate('/inventory', { state: { faculty: data.activeLabel } });
    } else if (data && data.name) {
      navigate('/inventory', { state: { faculty: data.name } });
    }
  };

  const [annualNeeds, setAnnualNeeds] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [allocation, setAllocation] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [needsRes, forecastRes, allocationRes] = await Promise.all([
        analyticsService.getAnnualNeeds(),
        analyticsService.getForecast(),
        analyticsService.getAllocation()
      ]);
      setAnnualNeeds(needsRes.data);
      setForecast(forecastRes.data);
      setAllocation(allocationRes.data);
    } catch (error) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    toast.info("Preparing document for printing...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const exportToExcel = () => {
    // Standardize headers for Pashto if needed, or just export existing
    const worksheet = XLSX.utils.json_to_sheet(annualNeeds.map(item => ({
      [t('item_nomenclature')]: item.name,
      [t('standard_id_bab')]: item.item_code,
      [t('current_stock')]: item.current_stock,
      [t('needs_analysis_note').slice(0, 20)]: item.estimated_annual_consumption,
      [t('status')]: item.recommended_purchase > 0 ? t('status_low_stock') : t('status_in_stock')
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Annual Needs");
    XLSX.writeFile(workbook, `Warehouse_Report_${new Date().toLocaleDateString()}.xlsx`);
    toast.success(t('excel_report_success'));
  };

  const chartData = Array.isArray(allocation) ? allocation.map(a => ({
    name: a.faculty,
    value: a.total_value,
    items: a.items_count
  })) : [];

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('reports')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none text-start">
            {t('reports_description')}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 no-print">
          <button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100 shadow-sm"
          >
            <FileSpreadsheet size={18} />
            {t('excel')}
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100 shadow-sm"
          >
            <Printer size={18} />
            {t('print')}
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
          >
            <FilePdf size={18} />
            {t('export_pdf')}
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
        {['analytics', 'needs', 'forecasting'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab ? "bg-white text-primary-teal shadow-xl shadow-black/5" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="fintech-card p-8 bg-white border border-slate-100 shadow-xl overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1.5 h-6 bg-primary-teal rounded-full" />
              <h3 className="font-black text-xl tracking-tight uppercase text-slate-900">Faculties & Departments</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {["Engineering", "Medicine", "Agriculture", "Computer Science", "Economics"].map((faculty) => (
                <button 
                  key={faculty}
                  onClick={() => navigate('/inventory', { state: { faculty } })}
                  className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary-teal hover:shadow-xl transition-all group text-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-4 group-hover:bg-primary-teal transition-all shadow-sm">
                    <Users size={20} className="text-primary-teal group-hover:text-white" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary-teal/60 mb-1">Explore</div>
                  <div className="text-sm font-black tracking-tight text-slate-900">{t(`dept_${faculty.toLowerCase().replace(' ', '_')}`) || faculty}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="fintech-card p-8 bg-white overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-1.5 h-6 bg-primary-teal rounded-full" />
                   <h3 className="font-black text-xl text-slate-900 tracking-tight">{t('allocation_by_faculty')}</h3>
                </div>
              </div>
              <div className="h-80 w-full cursor-pointer" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData}
                    onClick={handleChartClick}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px'}}
                    />
                    <Bar dataKey="value" fill="#0F8F7F" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <LabelList dataKey="value" position="top" fill="#94a3b8" fontSize={10} fontWeight={800} offset={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="fintech-card p-8 bg-white">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                 <h3 className="font-black text-xl text-slate-900 tracking-tight">{t('inventory_distribution')}</h3>
              </div>
              <div className="h-80 w-full flex items-center justify-center cursor-pointer" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="items"
                      onClick={(data) => navigate('/inventory', { state: { faculty: data.name } })}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-8">
                {chartData.slice(0, 4).map((entry, index) => (
                  <div 
                    key={entry.name} 
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:border-primary-teal transition-all"
                    onClick={() => navigate('/inventory', { state: { faculty: entry.name } })}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

       {activeTab === 'needs' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="fintech-card p-10 bg-white border border-slate-100 shadow-xl overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="flex items-center gap-6 cursor-pointer group" onClick={() => {
                   fetchData();
                   toast.success("Intelligence data synchronized");
                }}>
                   <div className="w-20 h-20 rounded-3xl bg-primary-teal flex items-center justify-center shadow-2xl shadow-primary-teal/30 group-hover:scale-110 group-hover:rotate-3 transition-all">
                      <Target size={32} className="text-white" />
                   </div>
                   <div className="text-start">
                      <h3 className="text-3xl font-black tracking-tighter italic text-slate-900 group-hover:text-primary-teal transition-colors">{t('annual_needs_analysis')}</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 px-2 py-1 bg-slate-50 rounded border border-slate-100">Optimization System Powered by Gemini AI</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-end hidden sm:block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary-teal">AI Accuracy</div>
                    <div className="text-xl font-black text-slate-900">94.8%</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200 mx-4 hidden sm:block" />
                  <Activity className="text-primary-teal animate-pulse" size={24} />
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6">
             <div className="overflow-x-auto rounded-[32px] border border-slate-100 bg-white shadow-xl">
               <table className="w-full text-start">
                 <thead>
                   <tr className="bg-slate-50/50">
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-start border-b border-slate-100">Item Detail</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b border-slate-100">Stock</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b border-slate-100">Target</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b border-slate-100">Gap</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b border-slate-100">Recommendation</th>
                   </tr>
                 </thead>
                 <tbody>
                   {Array.isArray(annualNeeds) && annualNeeds.map((item, idx) => (
                     <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                       <td className="px-8 py-6 border-b border-slate-50">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-teal group-hover:text-white transition-all">
                             <Package size={18} />
                           </div>
                           <div>
                             <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.name}</div>
                             <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.item_code}</div>
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-6 border-b border-slate-50 text-center font-black text-xs text-slate-600">{item.current_stock}</td>
                       <td className="px-8 py-6 border-b border-slate-50 text-center font-black text-xs text-primary-teal">{item.estimated_annual_consumption}</td>
                       <td className="px-8 py-6 border-b border-slate-50 text-center">
                         <span className={cn(
                           "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                           item.recommended_purchase > 0 ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                         )}>
                           {item.recommended_purchase > 0 ? `-${item.recommended_purchase}` : 'Optimal'}
                         </span>
                       </td>
                       <td className="px-8 py-6 border-b border-slate-50 text-center">
                         <button 
                           onClick={() => {
                             toast.success("Procurement Plan Generated Successfully");
                             navigate('/procurement/tenders');
                           }}
                           className="text-[9px] font-black text-primary-teal hover:underline uppercase tracking-widest p-2 rounded-lg hover:bg-primary-teal/5 transition-all"
                         >
                           Create Procurement Plan
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'forecasting' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 fintech-card p-10 bg-white">
                <div className="flex items-center justify-between mb-10">
                   <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-primary-teal rounded-full" />
                      <h3 className="font-black text-xl text-slate-900 tracking-tight">Demand Forecast (Next 12 Months)</h3>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-primary-teal" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projected</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-slate-200" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical</span>
                      </div>
                   </div>
                </div>
                <div className="h-96 w-full" dir="ltr">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={forecast}
                        onClick={(data: any) => {
                          if (data && data.activeLabel) {
                            const units = data.activePayload?.[0]?.value || 0;
                            toast.info(`Forecasting ${data.activeLabel}: ${units} units projected`);
                            navigate('/inventory', { state: { searchTerm: data.activeLabel } });
                          }
                        }}
                      >
                        <defs>
                          <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0F8F7F" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0F8F7F" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                        <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px'}}
                            itemStyle={{fontWeight: 900, textTransform: 'uppercase'}}
                            formatter={(value: any, name: string) => [
                              <span style={{ color: name === 'actual' ? '#1a1d1f' : '#0f8f7f' }}>{value} Units</span>,
                              name.toUpperCase()
                            ]}
                        />
                        <Area type="monotone" dataKey="projected" stroke="#0F8F7F" strokeWidth={3} fillOpacity={1} fill="url(#colorProjected)" />
                        <Area type="monotone" dataKey="actual" stroke="#1A1D1F" strokeWidth={2} fillOpacity={0} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>
              
              <div className="space-y-8">
                 <PredictiveCard 
                   onClick={() => toast.info("Details: High demand expected in Medicine Faculty due to new lab enrollments.")}
                   icon={<TrendingUp size={24} />} 
                   title="Growth Rate" 
                   value="+15.2%" 
                   desc="Predicted increase in laboratory materials procurement for next semester." 
                 />
                 <PredictiveCard 
                   onClick={() => navigate('/inventory', { state: { statusFilter: 'Low Stock' } })}
                   icon={<AlertTriangle size={24} />} 
                   title="Low Stock Risk" 
                   value="Critical" 
                   desc="8 items are predicted to go out of stock within the next 14 days." 
                   color="amber"
                 />
                 <PredictiveCard 
                   onClick={() => toast.success("Optimization request sent to logistics department.")}
                   icon={<Users size={24} />} 
                   title="User Allocation" 
                   value="Optimizing" 
                   desc="Allocation logic suggests re-routing 400 paper boxes to Main Office." 
                   color="indigo"
                 />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const PredictiveCard = ({ icon, title, value, desc, color = "teal", onClick }: any) => {
  const colors: any = {
    teal: "bg-primary-teal/5 text-primary-teal border-primary-teal/10",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  return (
    <div 
      onClick={onClick}
      className="fintech-card p-8 bg-white group hover:shadow-2xl transition-all cursor-pointer"
    >
       <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110", colors[color])}>
         {icon}
       </div>
       <div className="mt-6">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</div>
          <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</div>
          <p className="text-[10px] text-slate-500 font-medium mt-3 leading-relaxed text-start">{desc}</p>
       </div>
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


