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
import { Download, FileSpreadsheet, FileJson as FilePdf, Filter, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const data = [
  { name: 'Engineering', stock: 4000, requests: 2400 },
  { name: 'Computer Sc', stock: 3000, requests: 1398 },
  { name: 'Medicine', stock: 2000, requests: 9800 },
  { name: 'Agriculture', stock: 2780, requests: 3908 },
  { name: 'Humanities', stock: 1890, requests: 4800 },
];

const pieData = [
  { name: 'Electronics', value: 400 },
  { name: 'Furniture', value: 300 },
  { name: 'Stationery', value: 300 },
  { name: 'Medical', value: 200 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const ReportManager = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('reports')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none">
            Business Intelligence & Asset Analytics
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => toast.success("Excel report generated successfully")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white text-slate-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100 shadow-sm"
          >
            <FileSpreadsheet size={18} />
            Excel
          </button>
          <button 
            onClick={() => toast.loading("Generating encrypted PDF report...")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
          >
            <FilePdf size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="fintech-card p-8 bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <div className="w-1.5 h-6 bg-primary-teal rounded-full" />
               <h3 className="font-black text-xl text-slate-900 tracking-tight">Stock vs Requests</h3>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
               <TrendingUp size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest">+12%</span>
            </div>
          </div>
          <div className="h-80 w-full">
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
             <h3 className="font-black text-xl text-slate-900 tracking-tight">Inventory Distribution</h3>
          </div>
          <div className="h-80 w-full flex items-center justify-center">
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
    </div>
  );
};
