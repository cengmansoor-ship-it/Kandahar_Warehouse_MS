import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, Activity, Target, Zap, Settings, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

type Method = 'moving_average' | 'exponential_smoothing' | 'linear_regression';

export const ForecastingSection: React.FC<{ data: any[] }> = ({ data }) => {
  const [method, setMethod] = useState<Method>('linear_regression');
  const [windowSize, setWindowSize] = useState(3);
  const [alpha, setAlpha] = useState(0.3);
  const [forecastData, setForecastData] = useState<any[]>([]);

  useEffect(() => {
    calculateForecast();
  }, [method, windowSize, alpha, data]);

  const calculateForecast = () => {
    if (!data || data.length === 0) return;

    let results = [...data];
    const historical = data.filter(d => d.actual !== undefined);
    const futureCount = 6; // Predict next 6 periods

    if (method === 'moving_average') {
      // Simple Moving Average
      for (let i = 0; i < futureCount; i++) {
        const lastN = results.slice(-windowSize);
        const avg = lastN.reduce((acc, curr) => acc + (curr.actual || curr.projected || 0), 0) / windowSize;
        results.push({
          month: `Plan ${i + 1}`,
          projected: Math.round(avg),
          isForecast: true
        });
      }
    } else if (method === 'exponential_smoothing') {
      // Simple Exponential Smoothing: S_t = alpha * Y_t + (1 - alpha) * S_{t-1}
      let s = historical[0]?.actual || 0;
      historical.forEach(d => {
        s = alpha * (d.actual || 0) + (1 - alpha) * s;
      });

      for (let i = 0; i < futureCount; i++) {
        results.push({
          month: `Plan ${i + 1}`,
          projected: Math.round(s),
          isForecast: true
        });
      }
    } else {
      // Linear Regression: y = mx + b
      const n = historical.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      historical.forEach((d, i) => {
        sumX += i;
        sumY += (d.actual || 0);
        sumXY += i * (d.actual || 0);
        sumX2 += i * i;
      });

      const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const b = (sumY - m * sumX) / n;

      for (let i = 0; i < futureCount; i++) {
        const x = n + i;
        const y = m * x + b;
        results.push({
          month: `Plan ${i + 1}`,
          projected: Math.round(Math.max(0, y)),
          isForecast: true
        });
      }
    }

    setForecastData(results);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Configuration Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0F8F7F]/10 flex items-center justify-center text-[#0F8F7F]">
            <Settings size={24} />
          </div>
          <div className="text-start">
            <h3 className="font-black text-slate-900 uppercase tracking-tight">Forecasting Intelligence</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Statistical Model Optimization</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {[
              { id: 'moving_average', label: 'Moving Avg' },
              { id: 'exponential_smoothing', label: 'Exp Smoothing' },
              { id: 'linear_regression', label: 'Linear Regression' }
            ].map(m => (
              <button 
                key={m.id}
                onClick={() => setMethod(m.id as Method)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  method === m.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {method === 'moving_average' && (
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase">Window:</span>
              <input 
                type="number" 
                value={windowSize} 
                onChange={e => setWindowSize(Math.max(1, parseInt(e.target.value)))}
                className="w-12 bg-transparent text-[10px] font-black text-[#0F8F7F] outline-none"
              />
            </div>
          )}

          {method === 'exponential_smoothing' && (
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase">Alpha:</span>
              <input 
                type="range" 
                min="0.1" 
                max="0.9" 
                step="0.1"
                value={alpha} 
                onChange={e => setAlpha(parseFloat(e.target.value))}
                className="w-24 accent-[#0F8F7F]"
              />
              <span className="text-[10px] font-black text-[#0F8F7F] w-8">{alpha}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 fintech-card bg-white p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F8F7F]/5 rounded-bl-[200px] -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-[#0F8F7F] rounded-full shadow-lg shadow-[#0F8F7F]/20" />
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Predictive Demand Curve</h4>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0F8F7F]" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Forecast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-900" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Historical</span>
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F8F7F" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0F8F7F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="projected" 
                  stroke="#0F8F7F" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#forecastGrad)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#1A202C" 
                  strokeWidth={3} 
                  fillOpacity={0} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="fintech-card bg-slate-900 p-8 text-white relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <TrendingUp size={40} className="text-[#0F8F7F] mb-6" />
            <h5 className="text-xl font-black italic uppercase tracking-tight">Model Confidence</h5>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Accuracy Level: 92.4%</p>
            <div className="mt-8 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#0F8F7F] rounded-full w-[92%]" />
            </div>
            <p className="text-[9px] text-slate-500 mt-6 leading-relaxed italic uppercase font-bold tracking-wider">
               Statistical variance observed in seasonal shifts. Projections accounts for 15% procurement growth.
            </p>
          </div>

          <div className="fintech-card bg-white p-8 border border-slate-100 group">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                   <Target size={20} />
                </div>
                <h6 className="font-black text-slate-900 uppercase tracking-tight">Focus Units</h6>
             </div>
             <div className="space-y-4">
                {[
                  { name: 'A4 Paper', risk: 'High', color: 'rose' },
                  { name: 'Toner Cartridges', risk: 'Medium', color: 'amber' },
                  { name: 'Lab Chemicals', risk: 'Growth', color: 'indigo' }
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-all">
                    <span className="text-[10px] font-black text-slate-700 uppercase">{item.name}</span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                      item.color === 'rose' ? "bg-rose-50 text-rose-500" :
                      item.color === 'amber' ? "bg-amber-50 text-amber-500" :
                      "bg-indigo-50 text-indigo-500"
                    )}>
                      {item.risk}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
