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
      toast.error(t('failed_load_requests'));
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
      toast.success(`${t('request_submitted')} [${itemData.item_code}]`);
      setShowRequestModal(false);
      fetchRequests();
    } catch (error) {
      toast.error(t('failed_submit_request'));
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
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none text-start">
            {t('requests_description')}
          </p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
        >
          <Plus size={18} />
          {t('create_official_request')}
        </button>
      </div>

      <div className="fintech-card p-4 lg:p-6 bg-white flex flex-col md:flex-row items-center gap-4 lg:gap-6">
        <div className="relative flex-1 w-full text-start">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-5" : "left-5")} size={18} />
          <input 
            type="text" 
            placeholder={t('lookup_request_placeholder')}
            className={cn(
              "w-full bg-slate-50 border-none rounded-2xl py-4.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700",
              t('lang_direction') === 'rtl' ? "pr-14 pl-6" : "pl-14 pr-6"
            )}
          />
        </div>
        <button 
          onClick={() => toast.info(t('pipeline_filtering_soon'))}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-50 text-slate-400 px-8 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-primary-teal transition-all border border-slate-100 shadow-sm"
        >
          <Filter size={18} />
          {t('refine_pipeline')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          ))
        ) : (
          requests.map((req) => (
            <RequestListItem key={req.id} request={req} onUpdate={fetchRequests} />
          ))
        )}
      </div>
    </div>
  );
};

const RequestListItem: React.FC<{ request: any, onUpdate: () => void }> = ({ request, onUpdate }) => {
  const { t } = useTranslation();
  const statusConfig: Record<string, { color: string, icon: any }> = {
    'Pending': { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock },
    'Approved': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
    'Delivered': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
    'Procurement': { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: FileText },
    'Rejected': { color: 'text-red-600 bg-red-50 border-red-100', icon: XCircle },
  };

  const translatedStatus: Record<string, string> = {
    'Pending': t('status_pending'),
    'Approved': t('status_approved'),
    'Delivered': t('status_delivered'),
    'Procurement': t('status_procurement'),
    'Rejected': t('status_rejected'),
  };

  const handleUpdate = async (status: string, progress: number) => {
    try {
      await requestService.updateStatus(request.id, { status, progress });
      toast.success(`${t('requests')} ${status.toLowerCase()} ${t('auth_success').toLowerCase()}`); // Approximation
      onUpdate();
    } catch (e) {
      toast.error(t('process_failed'));
    }
  };

  const config = statusConfig[request.status] || statusConfig['Pending'];

  return (
    <div className="fintech-card p-8 bg-white group hover:shadow-2xl transition-all border border-slate-100">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="flex items-start gap-6 flex-1">
          <div className={cn("w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", config.color)}>
            <config.icon size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] bg-[#1A1D1F] text-white px-2 py-0.5 rounded-lg font-black tracking-widest shadow-sm">
                {request.item_code}
              </span>
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest", config.color)}>
                {translatedStatus[request.status] || request.status}
              </span>
            </div>
            <h4 className="text-2xl font-black text-[#1A1D1F] mt-2 group-hover:text-primary-teal transition-colors tracking-tight leading-tight text-start">{request.title}</h4>
            <div className="flex items-center gap-5 text-[10px] text-slate-400 mt-2.5 font-black uppercase tracking-widest">
              <span>{request.requester}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>{request.date}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 w-full xl:w-auto">
          <div className="flex-1 w-full lg:w-56 text-start">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
              <span>{t('pipeline_progress')}</span>
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
          
          <div className="flex items-center gap-3">
             {request.status === 'Pending' && (
               <>
                 <button 
                   onClick={() => handleUpdate('Approved', 100)}
                   className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                 >
                   {t('approve_issue')}
                 </button>
                 <button 
                   onClick={() => handleUpdate('Rejected', 0)}
                   className="px-6 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 whitespace-nowrap"
                 >
                   {t('reject')}
                 </button>
               </>
             )}
             <button className={cn("w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl group-hover:bg-primary-teal group-hover:text-white transition-all shadow-sm flex items-center justify-center border border-slate-100 group-hover:border-primary-teal", t('lang_direction') === 'rtl' && "rotate-180")}>
               <ChevronRight size={24} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
