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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('requests')}</h2>
          <p className="text-slate-500">Official Item Coding & Requirement Tracking (Bab 220 / Fasl 22300)</p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
        >
          <Plus size={18} />
          Create Official Request
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search requests by ID, title, or requester..."
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
          />
        </div>
        <button className="flex items-center gap-2 bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all border border-slate-200">
          <Filter size={18} />
          Status
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
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0", config.color)}>
            <config.icon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">
                {request.item_code}
              </span>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", config.color)}>
                {request.status}
              </span>
            </div>
            <h4 className="text-lg font-bold text-slate-800 mt-1">{request.title}</h4>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">
              <span>{request.requester}</span>
              <span>•</span>
              <span>{request.date}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 w-full lg:w-auto">
          <div className="flex-1 lg:w-48">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <span>Progress</span>
              <span>{request.progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${request.progress}%` }}
                className={cn(
                  "h-full rounded-full",
                  request.status === 'Rejected' ? 'bg-red-500' : 'bg-blue-500'
                )}
              />
            </div>
          </div>
          <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
