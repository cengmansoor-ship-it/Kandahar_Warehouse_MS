import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api, { trashService } from '@/src/services/api';
import { Trash2, RotateCcw, Search, Trash } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

export const TrashManager = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      const res = await trashService.getTrash();
      setItems(res.data || []);
    } catch (error) {
      toast.error(t('failed_load_inventory'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.post(`/trash/restore/${id}`);
      fetchTrash();
      toast.success("Item restored to active inventory");
    } catch (error) {
      toast.error("Failed to restore item");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setItemToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmPermanentDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/trash/permanent/${itemToDelete}`);
      fetchTrash();
      toast.success("Item permanently erased");
    } catch (error) {
      toast.error("Failed to delete permanently");
    } finally {
      setShowConfirmModal(false);
      setItemToDelete(null);
    }
  };

  const handleRecoveryRequest = () => {
    toast.success("Recovery request sent to IT Governance Committee. Reference ID: REC-" + Math.floor(Math.random() * 10000));
    // Simulation of a workflow initiation
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('trash_bin')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none text-start">
            {t('trash_description')}
          </p>
        </div>
        <button 
          onClick={handleRecoveryRequest}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10"
        >
          <RotateCcw size={18} />
          {t('recovery_request')}
        </button>
      </div>

      <div className="fintech-card p-6 bg-white flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full text-start">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-5" : "left-5")} size={18} />
          <input 
            type="text" 
            placeholder={t('search_trash_placeholder')}
            className={cn(
               "w-full bg-slate-50 border-none rounded-2xl py-4.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700",
               t('lang_direction') === 'rtl' ? "pr-14 pl-6" : "pl-14 pr-6"
            )}
          />
        </div>
      </div>

      <div className="fintech-card bg-white overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[900px] text-start">
             <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start">{t('item_detail')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start">{t('trash_date')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start">{t('reason')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-end">{t('actions')}</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {items.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="px-8 py-12 text-center">
                       <div className="flex flex-col items-center gap-4 text-slate-300">
                          <Trash size={48} className="opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">{t('no_items_garbage')}</p>
                       </div>
                    </td>
                 </tr>
               ) : (
                 Array.isArray(items) && items.map((item) => (
                    <tr key={item.trashId || item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-center",
                            item.originalModule === 'inventory' ? "bg-blue-50 text-blue-600" :
                            item.originalModule === 'receiving' ? "bg-emerald-50 text-emerald-600" :
                            (item.originalModule === 'request' || item.originalModule === 'requests') ? "bg-purple-50 text-purple-600" :
                            item.originalModule === 'tender' ? "bg-amber-50 text-amber-600" :
                            "bg-slate-100 text-slate-500"
                          )}>
                             {((item.originalModule || 'item').slice(0, 3))}
                          </div>
                          <div className="text-start">
                            <div className="font-black text-slate-900">
                              {item.name || item.item_name || item.title || item.projectName || item.tenderNumber || item.poNumber || 'Unnamed Item'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest whitespace-nowrap">
                              {item.item_code || item.trackingId || (item.id && typeof item.id === 'string' && item.id.length > 8 ? item.id.slice(0, 8) : item.id) || 'No Code'} • {item.originalModule || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                     <td className="px-8 py-6 text-start">
                        <div className="text-xs text-slate-600 font-medium">{new Date(item.trashDate).toLocaleDateString()}</div>
                     </td>
                     <td className="px-8 py-6 text-start">
                        <span className="text-[10px] bg-red-50 text-red-600 font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                           {item.reason}
                        </span>
                     </td>
                      <td className="px-8 py-6 text-end">
                        <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => handleRestore(item.trashId)}
                             className="p-3 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 rounded-xl"
                             title="Restore"
                           >
                              <RotateCcw size={18} />
                           </button>
                           <button 
                             onClick={() => handlePermanentDelete(item.trashId)}
                             className="p-3 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-xl"
                             title="Delete Permanently"
                           >
                              <Trash2 size={18} />
                           </button>
                        </div>
                      </td>
                   </tr>
                 ))
               )}
             </tbody>
          </table>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmPermanentDelete}
        title="Permanent Deletion"
        message="This action is absolute and permanent. The data will be purged from the system forever. Are you sure?"
        variant="danger"
      />
    </div>
  );
};
