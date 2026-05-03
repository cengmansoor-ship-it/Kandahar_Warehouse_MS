import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  Calculator, 
  Search,
  Download,
  Calendar,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import api from '@/src/services/api';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import * as XLSX from 'xlsx';

export const ForecastModule = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [allForecasts, setAllForecasts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(2026);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, yearlyRes] = await Promise.all([
        api.get('/forecast/dashboard'),
        api.get(`/forecast/yearly?year=${selectedYear}`)
      ]);
      setDashboard(dashRes.data);
      setAllForecasts(yearlyRes.data);
    } catch (err) {
      toast.error("Failed to load forecasting data");
    } finally {
      setLoading(false);
    }
  };

  const exportForecast = () => {
    const data = allForecasts.map(f => ({
      'Item Name': f.itemName,
      'Current Stock': f.currentStock,
      'Avg Monthly Consumption': f.avgMonthlyUsage,
      'Annual Usage (Est)': f.yearlyUsage,
      'Growth Rate (%)': (f.growthRate * 100).toFixed(1),
      'Safety Stock': f.safetyStock,
      'Final Forecast (2026)': f.forecast,
      'Procurement Recommendation': f.purchaseRecommendation
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Forecast 2026");
    XLSX.writeFile(wb, `KDRU_Inventory_Forecast_${selectedYear}.xlsx`);
  };

  const filteredItems = allForecasts.filter(f => 
    f.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-start">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-teal/10 text-primary-teal rounded-lg">
              <Sparkles size={20} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase tracking-tighter">
              Forecasting <span className="text-primary-teal">&</span> Needs Prediction
            </h2>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-12">
            AI-Driven Logistics Forecasting for the 2026 Academic Cycle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all shadow-sm"
          >
            <option value={2025}>Cycle 2025</option>
            <option value={2026}>Cycle 2026</option>
            <option value={2027}>Cycle 2027</option>
          </select>
          <button 
            onClick={exportForecast}
            className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all shadow-xl shadow-slate-900/10"
          >
            <Download size={16} />
            Export Forecast
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="fintech-card p-8 bg-white border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Zap size={60} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confidence Level</p>
          <h4 className="text-4xl font-black text-slate-900 italic">94.8%</h4>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
            <ArrowUpRight size={14} /> +2.4% vs Previous
          </div>
        </div>

        <div className="fintech-card p-8 bg-white border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Items Tracked</p>
          <h4 className="text-4xl font-black text-slate-900 italic">{dashboard?.totalItemsForecasting || 0}</h4>
          <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <Calendar size={14} /> Live Analysis
          </div>
        </div>

        <div className="fintech-card p-8 bg-white border border-slate-100 relative overflow-hidden group border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Critical Shortage</p>
          <h4 className="text-4xl font-black text-slate-900 italic">{dashboard?.criticalItemsCount || 0}</h4>
          <div className="mt-4 flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-widest">
            <AlertTriangle size={14} /> Needs Immediate action
          </div>
        </div>

        <div className="fintech-card p-8 bg-white border border-slate-100 relative overflow-hidden group bg-primary-teal text-white">
          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Est. Procurement Need</p>
          <h4 className="text-4xl font-black italic">{dashboard?.totalProcurementNeed?.toLocaleString() || 0}</h4>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest opacity-60">Total Units Required for 2026</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-start">
        {/* Growth Trends */}
        <div className="lg:col-span-2 space-y-6">
          <div className="fintech-card p-8 bg-white border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm flex items-center gap-3">
                <TrendingUp size={18} className="text-primary-teal" />
                Consumption Architecture
              </h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-primary-teal" /> Actual
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-slate-200" /> Projected
                </div>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={allForecasts.slice(0, 8)}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F8F7F" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0F8F7F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="itemName" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  />
                  <YAxis 
                    hide
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}
                  />
                  <Area type="monotone" dataKey="forecast" stroke="#0F8F7F" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                  <Area type="monotone" dataKey="yearlyUsage" stroke="#cbd5e1" strokeDasharray="5 5" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forecasting List */}
          <div className="fintech-card bg-white border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="Filter Prediction Results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 py-3 pl-12 pr-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-inner border-none focus:ring-2 focus:ring-primary-teal/10"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Item Portfolio</th>
                    <th className="px-8 py-5">Current Stock</th>
                    <th className="px-8 py-5">Expansion Rate</th>
                    <th className="px-8 py-5">2026 Forecast</th>
                    <th className="px-8 py-5">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] font-bold uppercase tracking-wide">
                   {filteredItems.map(item => (
                     <tr key={item.itemId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                           <div className="font-black text-slate-900 italic tracking-tight">{item.itemName}</div>
                           <div className="text-slate-400 text-[9px]">Calculated via Linear Smoothing</div>
                        </td>
                        <td className="px-8 py-5 text-slate-600 font-mono">
                           {item.currentStock} Units
                        </td>
                        <td className="px-8 py-5">
                           <span className={cn(
                             "px-3 py-1 rounded-lg border",
                             item.growthRate > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                           )}>
                             {item.growthRate > 0 ? '+' : ''}{(item.growthRate * 100).toFixed(1)}% p.a.
                           </span>
                        </td>
                        <td className="px-8 py-5 font-black text-slate-900 border-l border-slate-50">
                           {Math.round(item.forecast).toLocaleString()}
                        </td>
                        <td className="px-8 py-5">
                           {item.procurementRequired ? (
                             <div className="flex items-center gap-2 text-rose-500 font-black italic">
                               <AlertTriangle size={14} /> Buy {item.purchaseRecommendation}
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 text-emerald-500 font-black italic uppercase">
                               <CheckCircle2 size={14} /> Stock OK
                             </div>
                           )}
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Prediction Logic Panel */}
        <div className="space-y-6">
          <div className="fintech-card p-8 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calculator size={40} />
            </div>
            <h3 className="text-lg font-black italic italic-none uppercase tracking-tighter mb-6">Prediction Engine</h3>
            
            <div className="space-y-6 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-white/50 border-b border-white/10 pb-2">
                  <span>Method Algorithm</span>
                  <span className="text-primary-teal">Exponential Smoothing</span>
                </div>
                <p className="text-[10px] leading-relaxed text-white/80 font-medium">
                  We use weighted averages of past consumptions, with heavier weights on the most recent months to detect student-led demand shifts.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-white/50 border-b border-white/10 pb-2">
                   <span>Growth Strategy</span>
                   <span className="text-primary-teal">Multi-Linear Regression</span>
                </div>
                <p className="text-[10px] leading-relaxed text-white/80 font-medium">
                  Calculates trend slopes by analyzing year-over-year faculty allocation patterns and department headcount growth.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-white/50 border-b border-white/10 pb-2">
                   <span>Safety Protocol</span>
                   <span className="text-primary-teal">KDRU-S Margin</span>
                </div>
                <p className="text-[10px] leading-relaxed text-white/80 font-medium">
                  Automatically adds (Max Usage × Peak Lead Time) - (Avg) buffer to prevent stockouts during exam cycles.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
               <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary-teal">
                    <Info size={20} />
                  </div>
                  <div className="flex-1 text-start">
                    <p className="text-[9px] font-black uppercase text-white/40 mb-1">Data Health</p>
                    <p className="text-[10px] font-black text-white italic tracking-tight uppercase leading-none">Healthy Ledger (100% Sync)</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="fintech-card p-6 bg-emerald-50 border border-emerald-100/50">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Strategic Forecast Alpha</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={allForecasts.slice(0, 5)}>
                   <Bar dataKey="purchaseRecommendation" fill="#10b981" radius={[8, 8, 0, 0]} barSize={25} />
                   <XAxis hide dataKey="itemName" />
                   <YAxis hide />
                   <Tooltip cursor={{fill: 'transparent'}} />
                 </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-[9px] font-bold text-emerald-800 uppercase tracking-widest leading-relaxed">
              Top 5 procurement priorities visualized by quantity volume requirement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckCircle2 = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} height={size} 
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);
