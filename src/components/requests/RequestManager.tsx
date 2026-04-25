import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { requestService } from '@/src/services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { ItemHierarchyModal } from '../inventory/ItemHierarchyModal';
import api from '@/src/services/api';

export const RequestManager = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await requestService.getRequests();
      setRequests(res.data);
    } catch (error) {
      toast.error('Failed to load requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestItem = async (itemData: any) => {
    try {
      const payload = { 
        title: `Requirement: ${itemData.name}`,
        requester: 'Faculty Head', // Mock name
        status: 'Pending',
        progress: 10,
        item_code: itemData.item_code,
        bab_code: itemData.bab_code,
        fasl_code: itemData.fasl_code
      };
      await api.post('/requests', payload);
      toast.success(`Government-coded request submitted for [${itemData.item_code}]`);
      setShowRequestModal(false);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  return (
    <div className="space-y-6">
      {showRequestModal && (
        <ItemHierarchyModal 
          onClose={() => setShowRequestModal(false)}
          onSelect={handleRequestItem}
        />
      )}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('requests')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none">
            Official Item Coding & Requirement Tracking (Bab 220 / Fasl 22300)
          </p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
        >
          <Plus size={18} />
          Create Official Request
        </button>
      </div>

      <div className="fintech-card p-4 lg:p-6 bg-white flex flex-col md:flex-row items-center gap-4 lg:gap-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Lookup by Tracking ID, Requirement Title, or Requester Name..."
            className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700"
          />
        </div>
        <button 
          onClick={() => toast.info("Pipeline filtering panel coming soon...")}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-50 text-slate-400 px-8 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-primary-teal transition-all border border-slate-100 shadow-sm"
        >
          <Filter size={18} />
          Refine Pipeline
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          ))
        ) : (
          requests.map((req) => (
            <RequestListItem key={req.id} request={req} />
          ))
        )}
      </div>
    </div>
  );
};

const RequestListItem: React.FC<{ request: any }> = ({ request }) => {
  const statusConfig: Record<string, { color: string, icon: any }> = {
    'Pending': { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock },
    'Approved': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
    'Procurement': { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: FileText },
    'Rejected': { color: 'text-red-600 bg-red-50 border-red-100', icon: XCircle },
  };

  const config = statusConfig[request.status];

  return (
    <div 
      onClick={() => toast.info(`Viewing request detail for ${request.title}`)}
      className="fintech-card p-8 bg-white group cursor-pointer"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="flex items-start gap-6">
          <div className={cn("w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", config.color)}>
            <config.icon size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] bg-[#1A1D1F] text-white px-2 py-0.5 rounded-lg font-black tracking-widest shadow-sm">
                {request.item_code}
              </span>
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest", config.color)}>
                {request.status}
              </span>
            </div>
            <h4 className="text-2xl font-black text-[#1A1D1F] mt-2 group-hover:text-primary-teal transition-colors tracking-tight leading-tight">{request.title}</h4>
            <div className="flex items-center gap-5 text-[10px] text-slate-400 mt-2.5 font-black uppercase tracking-widest">
              <span>{request.requester}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>{request.date}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10 w-full lg:w-auto">
          <div className="flex-1 lg:w-56">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
              <span>Pipeline Progress</span>
              <span className="text-primary-teal">{request.progress}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${request.progress}%` }}
                className={cn(
                  "h-full rounded-full transition-all",
                  request.status === 'Rejected' ? 'bg-red-500' : 'bg-primary-teal shadow-[0_0_12px_rgba(15,143,127,0.5)]'
                )}
              />
            </div>
          </div>
          <button className="w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl group-hover:bg-primary-teal group-hover:text-white transition-all shadow-sm flex items-center justify-center border border-slate-100 group-hover:border-primary-teal">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
