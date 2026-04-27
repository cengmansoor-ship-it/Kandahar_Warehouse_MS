import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryService } from '@/src/services/api';
import { 
  PackageMinus, 
  Search, 
  MapPin, 
  User, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import api from '@/src/services/api';

export const ExitClearanceManager = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    item_code: '',
    quantity: 0,
    recipient: '',
    department: '',
    purpose: '',
    location: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getItems();
      setItems(res.data);
    } catch (e) {
      toast.error(t('failed_load_inventory'));
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity <= 0) return toast.error("Quantity must be greater than zero");
    
    const item = items.find(i => i.item_code === formData.item_code);
    if (!item || item.quantity < formData.quantity) {
      return toast.error("Insufficient stock on hand");
    }

    try {
      // Logic: Update item stock and record movement
      await api.post('/v1/receiving', {
        ...formData,
        quantity: -formData.quantity, // Negative for exit
        type: 'EXIT'
      });
      toast.success("Exit clearance successfully recorded");
      setFormData({ item_code: '', quantity: 0, recipient: '', department: '', purpose: '', location: '' });
      fetchItems();
    } catch (e) {
      toast.error("Process failed");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-start">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('distribution')} / {t('exit_clearance')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none">
            Manage item asset distribution and faculty clearance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form */}
        <div className="xl:col-span-1 fintech-card bg-white p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
             <div className="w-1.5 h-6 bg-red-500 rounded-full" />
             <h3 className="font-black text-xl text-slate-900 tracking-tight">Record Exit</h3>
          </div>
          
          <form onSubmit={handleExit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Item from Stock</label>
              <div className="relative">
                <PackageMinus className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select 
                  required
                  value={formData.item_code}
                  onChange={(e) => setFormData({...formData, item_code: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-14 pr-6 text-xs font-bold outline-none focus:ring-4 focus:ring-red-500/5 transition-all appearance-none"
                >
                  <option key="default" value="">Choose item...</option>
                  {items.filter(i => i.quantity > 0).map(item => (
                    <option key={item.id} value={item.item_code}>{item.name} ({item.quantity} available)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                <input 
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-red-500/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text"
                    required
                    placeholder="Room/Lab"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-12 pr-6 text-xs font-bold outline-none focus:ring-4 focus:ring-red-500/5"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recipient Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text"
                  required
                  placeholder="Official Name"
                  value={formData.recipient}
                  onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-12 pr-6 text-xs font-bold outline-none focus:ring-4 focus:ring-red-500/5"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
            >
              Authorize Asset Exit
            </button>
          </form>
        </div>

        {/* History / Current Distribution */}
        <div className="xl:col-span-2 space-y-6">
          <div className="fintech-card bg-white p-6 flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-4">
               <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
               <h3 className="font-black text-xl text-slate-900 tracking-tight">Recent Distributions</h3>
            </div>
            <div className="relative w-64">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
               <input 
                type="text" 
                placeholder="Search history..."
                className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest outline-none"
               />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             {[1, 2, 3].map(i => (
               <div key={i} className="fintech-card bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:translate-y-[-2px] transition-all border border-slate-100">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                       <PackageMinus size={24} />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">
                          <span>Paper A4 - Batch {i}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="flex items-center gap-1"><Calendar size={10} /> Apr 24, 2024</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 leading-tight">Faculty of Medicine Supplies</h4>
                        <div className="text-[10px] font-black text-red-500/70 mt-1 uppercase tracking-widest">Released: 10 BOX • Room 402</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                       <CheckCircle2 size={12} /> Cleared
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
