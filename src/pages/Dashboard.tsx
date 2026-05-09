import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, AlertTriangle, FileCheck, ArrowRight, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

const StatCard: React.FC<{ title: string, value: string, subValue: string, icon: React.ReactNode, color: string, onClick?: () => void }> = ({ title, value, subValue, icon, color, onClick }) => {
  const { t } = useTranslation();
  const colorMap: Record<string, string> = {
    blue: "bg-[#0F8F7F]/5 border-[#0F8F7F]/10 text-[#0F8F7F]",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
  };

  return (
    <div 
      id={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn(
        "fintech-card p-8 group transition-all duration-300",
        onClick ? "cursor-pointer hover:border-primary-teal hover:shadow-2xl hover:shadow-primary-teal/10" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-4 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110", colorMap[color] || "bg-slate-50 border-slate-100")}>
          {icon}
        </div>
        <div className="text-[10px] font-black p-1 px-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 uppercase tracking-widest">
          {t('live')}
        </div>
      </div>
      <div className="mt-8">
        <div className="text-slate-400 text-xs font-black uppercase tracking-widest">{title}</div>
        <div className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{value}</div>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-600">
            <TrendingUp size={10} />
          </div>
          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{subValue}</div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({
    totalStock: "...",
    pendingRequests: "...",
    lowStock: "...",
    activeTenders: "..."
  });
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/activities')
        ]);

        const statsData = statsRes.data || {};
        setStats({
          totalStock: (statsData.totalStock || 0).toLocaleString(),
          pendingRequests: (statsData.pendingRequests || 0).toString(),
          lowStock: (statsData.lowStock || 0).toString(),
          activeTenders: (statsData.activeTenders || 0).toString()
        });

        setRecentActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);
      } catch (e) {
        console.error("Dashboard: Error fetching unified stats", e);
        setRecentActivities([]);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 lg:space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('welcome')}, {t('admin_role')}</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none text-start">
            {t('university_logistics_hub')}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('system_online')}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        <StatCard 
          title={t('stock_summary')} 
          value={stats.totalStock} 
          subValue={t('today_stat')} 
          icon={<Package size={24} />}
          color="blue"
          onClick={() => navigate('/inventory')}
        />
        <StatCard 
          title={t('recent_requests')} 
          value={stats.pendingRequests} 
          subValue={t('pending_stat')} 
          icon={<FileCheck size={24} />}
          color="emerald"
          onClick={() => navigate('/requests')}
        />
        <StatCard 
          title={t('low_stock')} 
          value={stats.lowStock} 
          subValue={t('critical_items')} 
          icon={<AlertTriangle size={24} />}
          color="amber"
          onClick={() => navigate('/inventory', { state: { filter: 'low_stock' } })}
        />
        <StatCard 
          title={t('procurement')} 
          value={stats.activeTenders} 
          subValue={t('active_tenders')} 
          icon={<TrendingUp size={24} />}
          color="indigo"
          onClick={() => navigate('/procurement')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
        <div 
          className="xl:col-span-2 fintech-card bg-white p-6 lg:p-10 min-h-[400px] flex flex-col group cursor-pointer hover:border-primary-teal transition-all"
          onClick={() => navigate('/receiving')}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <div className="w-1.5 h-6 bg-primary-teal rounded-full" />
               <h3 className="font-black text-xl text-slate-900 tracking-tight">{t('inventory_movement')}</h3>
            </div>
            <div className="flex items-center gap-2 text-primary-teal text-[10px] font-black uppercase tracking-widest group-hover:gap-4 transition-all">
              {t('view_all_logs')}
              <ArrowRight size={16} />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center text-slate-400 italic bg-primary-teal/[0.02] rounded-3xl border border-dashed border-primary-teal/10 uppercase tracking-[0.3em] text-[10px] p-8 text-center leading-relaxed">
            {recentActivities.length > 0 ? t('movement_tracked_successfully') || 'Live Movement Tracked Successfully' : t('realtime_initializing')}
          </div>
        </div>
        <div className="fintech-card bg-white p-6 lg:p-10 group">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
             <h3 className="font-black text-xl text-slate-900 tracking-tight">{t('recent_activities')}</h3>
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity, i) => (
              <div 
                key={activity.id || i} 
                className="flex gap-5 group/item cursor-pointer p-3 rounded-2xl border border-transparent hover:border-primary-teal/20 hover:bg-slate-50 transition-all"
                onClick={() => navigate('/receiving', { state: { highlightId: activity.id } })}
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover/item:border-primary-teal group-hover/item:bg-primary-teal/5 transition-all text-slate-400 group-hover/item:text-primary-teal">
                  {activity.type === 'receiving' && <Package size={20} />}
                  {activity.type === 'request' && <FileCheck size={20} />}
                  {activity.type === 'allocation' && <UserIcon size={20} />}
                  {!['receiving', 'request', 'allocation'].includes(activity.type || '') && <Package size={20} />}
                </div>
                <div className="flex flex-col justify-center text-start flex-1">
                  <div className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover/item:text-primary-teal transition-colors text-start">{activity.title}</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest leading-tight">{activity.description}</div>
                  <div className="text-[10px] text-primary-teal/50 mt-1 uppercase font-black tracking-widest italic">{activity.timestamp}</div>
                </div>
                <div className="flex items-center">
                  <ArrowRight size={14} className="text-slate-200 group-hover/item:text-primary-teal transition-all group-hover/item:translate-x-1" />
                </div>
              </div>
            )) : (
              [1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="flex gap-5 group/item cursor-pointer opacity-40 shrink-0"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <Package size={20} className="text-slate-300" />
                  </div>
                  <div className="flex flex-col justify-center text-start">
                    <div className="h-3 w-24 bg-slate-100 rounded mb-2"></div>
                    <div className="h-2 w-32 bg-slate-50 rounded"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
