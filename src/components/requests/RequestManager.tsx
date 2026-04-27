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
  FileText,
  PlusCircle,
  Tag,
  Package,
  List as ListIcon
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
  const [selectedItemForRequest, setSelectedItemForRequest] = useState<any>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests'); // Direct call
      setRequests(res.data || []);
    } catch (error) {
      toast.error("Failed to load requests");
      console.error(error);
    } finally {
      setTimeout(() => setLoading(false), 500); // Small delay to ensure state settles
    }
  };

  const [approvers, setApprovers] = useState<{name: string, role: string, approved: boolean}[]>([
    { name: '', role: 'Supervisor', approved: false },
    { name: '', role: 'Finance', approved: false },
    { name: '', role: 'Director', approved: false }
  ]);

  const addApproverSlot = () => {
    setApprovers([...approvers, { name: '', role: 'Member', approved: false }]);
  };

  const updateApprover = (idx: number, field: string, value: any) => {
    const newApprovers = [...approvers];
    // @ts-ignore
    newApprovers[idx][field] = value;
    setApprovers(newApprovers);
  };

  const handleRequestItem = async (itemData: any) => {
    try {
      setLoading(true);
      const payload = { 
        title: `Requirement: ${itemData.name}`,
        requester: 'Faculty Admin',
        status: 'Pending',
        progress: 0,
        item_code: itemData.item_code,
        bab_code: itemData.bab_code,
        fasl_code: itemData.fasl_code,
        items: [{ ...itemData, quantity: 1 }],
        approvalChain: approvers.filter(a => a.name.trim() !== '')
      };
      await api.post('/requests', payload);
      toast.success(`Request for ${itemData.name} submitted successfully`);
      setShowRequestModal(false);
      fetchRequests();
    } catch (error) {
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {showRequestModal && (
        <ItemHierarchyModal 
          onClose={() => setShowRequestModal(false)}
          onSelect={(item) => {
            setSelectedItemForRequest(item);
            setShowRequestModal(false);
          }}
        />
      )}

      {selectedItemForRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-8">
            <div className="flex items-center justify-between text-start">
              <div>
                <h3 className="text-3xl font-black text-slate-900 italic">Finalize Request</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Configure approval chain</p>
              </div>
              <button 
                onClick={() => setSelectedItemForRequest(null)} 
                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-6 pt-6 border-t border-slate-100 text-start">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Approval Chain</h4>
                <button 
                  type="button"
                  onClick={addApproverSlot}
                  className="w-10 h-10 bg-primary-teal/5 text-primary-teal rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <PlusCircle size={20} />
                </button>
              </div>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {approvers.map((approver, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-1">
                      <input 
                        placeholder="Person Name"
                        value={approver.name}
                        onChange={(e) => updateApprover(idx, 'name', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all"
                      />
                    </div>
                    <div className="w-1/3">
                      <select 
                        value={approver.role}
                        onChange={(e) => updateApprover(idx, 'role', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all"
                      >
                        <option>Supervisor</option>
                        <option>Finance</option>
                        <option>Director</option>
                        <option>Member</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                handleRequestItem(selectedItemForRequest);
                setSelectedItemForRequest(null);
              }}
              disabled={loading}
              className="w-full bg-slate-900 text-white py-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary-teal transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? 'Processing...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
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
          Array.isArray(requests) && requests.map((req) => (
            <RequestListItem key={req.id} request={req} onUpdate={fetchRequests} />
          ))
        )}
      </div>
    </div>
  );
};

import { smsService } from '@/src/services/smsService';

const RequestListItem: React.FC<{ request: any, onUpdate: () => void }> = ({ request, onUpdate }) => {
  const { t } = useTranslation();
  
  const stages = [
    { name: 'Request', threshold: 0, icon: FileText },
    { name: 'Approval', threshold: 25, icon: CheckCircle2 },
    { name: 'Tender', threshold: 50, icon: Tag },
    { name: 'Comparison', threshold: 75, icon: ListIcon },
    { name: 'PO', threshold: 100, icon: Package }
  ];

  const statusConfig: Record<string, { color: string, icon: any }> = {
    'Pending': { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock },
    'Approved': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
    'Delivered': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
    'Procurement': { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: FileText },
    'Rejected': { color: 'text-red-600 bg-red-50 border-red-100', icon: XCircle },
    'TENDER_CREATED': { color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: Tag },
    'WINNER_SELECTED': { color: 'text-purple-600 bg-purple-50 border-purple-100', icon: Package },
  };

  const translatedStatus: Record<string, string> = {
    'Pending': t('status_pending'),
    'Approved': t('status_approved'),
    'Delivered': t('status_delivered'),
    'Procurement': t('status_procurement'),
    'Rejected': t('status_rejected'),
    'TENDER_CREATED': 'Tender Open',
    'WINNER_SELECTED': 'Winner Selected',
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
    if (progress > 0) return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]';
    return 'bg-slate-300';
  };

  const handleUpdate = async (status: string, progress: number) => {
    try {
      await requestService.updateStatus(request.id, { status, progress });
      toast.success(`Request ${status} successfully`);
      
      // Send SMS
      await smsService.notifyRequestUpdate(request, status);
      
      onUpdate();
    } catch (e) {
      toast.error(t('process_failed'));
    }
  };

  const config = statusConfig[request.status] || statusConfig['Pending'];
  const currentProgress = request.progress || 0;

  return (
    <div className="fintech-card p-8 bg-white group hover:shadow-2xl transition-all border border-slate-100">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-10">
        <div className="flex items-start gap-6 flex-1">
          <div className={cn("w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", config.color)}>
            <config.icon size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] bg-[#1A1D1F] text-white px-2 py-0.5 rounded-lg font-black tracking-widest shadow-sm">
                {request.trackingId}
              </span>
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest", config.color)}>
                {translatedStatus[request.status] || request.status}
              </span>
            </div>
            <h4 className="text-2xl font-black text-[#1A1D1F] mt-2 group-hover:text-primary-teal transition-colors tracking-tight leading-tight text-start">{request.title}</h4>
            <div className="flex items-center gap-5 text-[10px] text-slate-400 mt-2.5 font-black uppercase tracking-widest">
              <span>{request.requester}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>{new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
            
            {/* Visual Stepper */}
            <div className="mt-8 relative pt-2">
              <div className="flex items-center justify-between w-full relative z-10">
                {stages.map((stage, i) => {
                  const isActive = currentProgress >= stage.threshold;
                  const StageIcon = stage.icon;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 group/step">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2",
                        isActive 
                          ? "bg-primary-teal border-primary-teal text-white shadow-lg shadow-primary-teal/20" 
                          : "bg-white border-slate-100 text-slate-300"
                      )}>
                        <StageIcon size={16} />
                      </div>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-tighter opacity-0 group-hover/step:opacity-100 transition-opacity",
                        isActive ? "text-primary-teal" : "text-slate-300"
                      )}>{stage.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-[21px] left-5 right-5 h-0.5 bg-slate-100 -z-0">
                <div 
                  className="h-full bg-primary-teal shadow-[0_0_8px_rgba(13,148,136,0.3)] transition-all duration-700" 
                  style={{ width: `${Math.min(100, currentProgress)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 w-full xl:w-auto self-center">
          <div className="flex-1 w-full lg:w-48 text-start">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
              <span>{t('pipeline_progress')}</span>
              <span className="text-primary-teal">{currentProgress}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress}%` }}
                className={cn(
                  "h-full rounded-full transition-all",
                  request.status === 'Rejected' ? 'bg-red-500' : getProgressColor(currentProgress)
                )}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {request.status === 'Pending' && (
               <>
                 <button 
                   onClick={() => handleUpdate('Approved', 25)}
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
             <button className={cn("w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl hover:bg-primary-teal hover:text-white transition-all shadow-sm flex items-center justify-center border border-slate-100 group-hover:border-primary-teal", t('lang_direction') === 'rtl' && "rotate-180")}>
               <ChevronRight size={24} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
