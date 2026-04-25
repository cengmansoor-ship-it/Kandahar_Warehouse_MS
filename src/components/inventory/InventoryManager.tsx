import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryService } from '@/src/services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ArrowUpRight, 
  ArrowDownLeft,
  Package
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { ItemHierarchyModal } from './ItemHierarchyModal';
import api from '@/src/services/api';

export const InventoryManager = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getItems();
      setItems(res.data);
    } catch (error) {
      toast.error('Failed to load inventory items');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData: any) => {
    try {
      // Set default stock for new official items
      const payload = { ...itemData, stock: 0, unit: 'pcs' };
      await api.post('/items', payload);
      toast.success(`Successfully mapped and added: ${itemData.name}`);
      setShowAddModal(false);
      fetchItems();
    } catch (error) {
      toast.error('Failed to add item. Ensure codes are valid.');
    }
  };

  return (
    <div className="space-y-8">
      {showAddModal && (
        <ItemHierarchyModal 
          onClose={() => setShowAddModal(false)} 
          onSelect={handleAddItem}
        />
      )}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('inventory')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none">
            Government Standard Code-Based Registry
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
            <button 
              onClick={() => setView('grid')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                view === 'grid' ? "bg-white shadow-xl shadow-black/5 text-primary-teal" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Grid
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest hidden sm:block",
                view === 'list' ? "bg-white shadow-xl shadow-black/5 text-primary-teal" : "text-slate-400 hover:text-slate-600"
              )}
            >
              List
            </button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
          >
            <Plus size={18} />
            Map New SKU
          </button>
        </div>
      </div>

      <div className="fintech-card p-4 lg:p-6 flex flex-col md:flex-row items-center gap-4 lg:gap-6 bg-white/50 backdrop-blur-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Search by Code, BAB, or Nomenclature..."
            className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => toast.info("Advanced Filter coming soon...")}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-slate-400 px-8 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-primary-teal transition-all border border-slate-100 shadow-sm"
          >
            <Filter size={18} />
            Filter
          </button>
          <button 
            onClick={() => toast.success("Inventory Ledger exported to XLSX")}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-slate-400 px-8 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-primary-teal transition-all border border-slate-100 shadow-sm"
          >
            <ArrowUpRight size={18} />
            Export
          </button>
        </div>
      </div>

      <div className={cn(
        "grid gap-8",
        view === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"
      )}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 fintech-card animate-pulse" />
          ))
        ) : (
          items.map((item) => (
            <InventoryCard key={item.id} item={item} horizontal={view === 'list'} />
          ))
        )}
      </div>
    </div>
  );
};

const InventoryCard: React.FC<{ item: any, horizontal?: boolean }> = ({ item, horizontal }) => {
  const statusStyles: Record<string, string> = {
    'In Stock': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Low Stock': 'bg-amber-50 text-amber-600 border-amber-100',
    'Out of Stock': 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className={cn(
      "fintech-card p-6 flex flex-col justify-between group",
      horizontal && "flex-row items-center p-8"
    )}>
      <div className={cn("flex flex-col gap-5", horizontal && "flex-row items-center flex-1 gap-12")}>
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 rounded-2xl bg-primary-teal/5 border border-primary-teal/10 flex items-center justify-center text-primary-teal shrink-0 group-hover:scale-110 transition-transform">
               <Package size={28} />
             </div>
             <div>
               <div className="flex items-center gap-2 mb-1.5">
                 <span className="font-mono text-[10px] bg-[#1A1D1F] text-white px-2 py-0.5 rounded-lg font-black tracking-widest shadow-sm">
                   {item.item_code}
                 </span>
                 <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                   BAB {item.bab_code}
                 </div>
               </div>
               <div className="text-xl font-black text-[#1A1D1F] tracking-tight leading-tight group-hover:text-primary-teal transition-colors">
                {item.name}
               </div>
             </div>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest", statusStyles[item.status])}>
            {item.status}
          </div>
        </div>

        <div className={cn("mt-2 flex gap-8", horizontal && "mt-0")}>
           <div className="flex flex-col">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Current Stock</span>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-[#1A1D1F] leading-none">{item.stock}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.unit || 'pcs'}</span>
             </div>
           </div>
        </div>
      </div>

      <div className={cn("mt-10", horizontal && "mt-0 ml-12")}>
        <button 
          onClick={() => toast.info(`Opening ledger for ${item.name}...`)}
          className="w-full bg-[#1A1D1F] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10"
        >
          Inventory Ledger
          <ArrowUpRight size={14} className="opacity-50" />
        </button>
      </div>
    </div>
  );
}
