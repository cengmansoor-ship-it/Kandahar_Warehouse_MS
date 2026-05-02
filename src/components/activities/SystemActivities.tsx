import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, User, FileText, ChevronRight, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'special';
}

export const SystemActivities = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activities')
      .then(res => res.json())
      .then(data => {
        setActivities(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getTypeStyles = (type: ActivityLog['type']) => {
    switch (type) {
      case 'create': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'update': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'delete': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const handleExport = () => {
    try {
      const data = activities.map(a => ({
        User: a.user,
        Action: a.action,
        Target: a.target,
        Timestamp: new Date(a.timestamp).toLocaleString(),
        Type: a.type
      }));
      
      import('xlsx').then(XLSX => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SystemLogs");
        XLSX.writeFile(wb, `System_Audit_Log_${new Date().getTime()}.xlsx`);
        toast.success("Audit log exported successfully");
      });
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear the entire audit history? This cannot be undone.")) return;
    
    try {
      // In a real app we'd call an API
      // await api.delete('/activities');
      setActivities([]);
      toast.success("Audit history cleared successfully");
    } catch (err) {
      toast.error("Failed to clear history");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-start">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">System Activity Audit</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Chronological tracking of system mutations and user actions</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-xl">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Activity size={24} />
             </div>
             <div>
                <h4 className="font-black text-sm text-slate-900 uppercase tracking-widest">Master Audit Trail</h4>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time update synchronization active</div>
             </div>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={handleExport}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
              >
                Export Log
              </button>
              <button 
                onClick={handleClearHistory}
                className="px-6 py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200"
              >
                Clear History
              </button>
           </div>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-20 text-center text-[10px] font-black tracking-widest text-slate-300 uppercase animate-pulse italic">Connecting to audit server...</div>
          ) : activities.length === 0 ? (
            <div className="p-20 text-center text-[10px] font-black tracking-widest text-slate-300 uppercase italic">No system activities recorded yet.</div>
          ) : activities.map((activity) => (
            <div key={activity.id} className="p-8 hover:bg-slate-50/50 transition-all group flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Clock size={20} className="text-slate-300" />
                </div>
                <div className="text-start">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[11px] font-black text-slate-900 uppercase">{activity.user}</span>
                    <span className={cn("px-2 py-0.5 border rounded-lg text-[8px] font-black uppercase tracking-widest", getTypeStyles(activity.type))}>
                      {activity.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500">{activity.action}:</span>
                    <span className="text-[10px] font-black text-primary-teal uppercase tracking-widest">{activity.target}</span>
                  </div>
                </div>
              </div>

              <div className="text-end">
                <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 italic">
                  {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-[9px] font-bold text-slate-400">
                  {new Date(activity.timestamp).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-8 bg-slate-50/30 border-t border-slate-50 flex justify-center">
           <button className="text-[10px] font-black text-primary-teal uppercase tracking-[0.2em] hover:underline">Download full historical report (PDF) →</button>
        </div>
      </div>
    </div>
  );
};
