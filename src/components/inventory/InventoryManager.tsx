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
  Package,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { ItemHierarchyModal } from './ItemHierarchyModal';
import api from '@/src/services/api';
import { useLocation } from 'react-router-dom';

export const InventoryManager = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    if (location.state) {
      if (location.state.filter === 'low_stock') {
        setActiveFilter('low_stock');
        toast.info(t('filtering_low_stock') || "Filtering items with low stock");
      } else if (location.state.faculty) {
        setSearchTerm(location.state.faculty);
        toast.info(`${t('filtering_by') || 'Filtering by'}: ${location.state.faculty}`);
      }
    }
  }, [location.state]);

  const filteredItems = items.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = (
      item.name?.toLowerCase().includes(searchStr) ||
      item.item_code?.toLowerCase().includes(searchStr) ||
      item.category?.toLowerCase().includes(searchStr) ||
      item.department?.toLowerCase().includes(searchStr) ||
      item.location?.toLowerCase().includes(searchStr)
    );

    if (activeFilter === 'low_stock') {
      return matchesSearch && item.status === 'Low Stock';
    }

    return matchesSearch;
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getItems();
      setItems(res.data);
    } catch (error) {
      toast.error(t('failed_load_inventory'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData: any) => {
    try {
      // Set default quantity for new official items
      const payload = { ...itemData, quantity: 0, unit: t('unit_pcs') };
      await api.post('/items', payload);
      toast.success(`${t('mapped_added')}: ${itemData.name}`);
      setShowAddModal(false);
      fetchItems();
    } catch (error) {
      toast.error(t('failed_add_item'));
    }
  };

  const handleMoveToTrash = async (id: string) => {
    if (!window.confirm("Are you sure you want to move this item to trash?")) return;
    try {
      await api.post(`/items/${id}/trash`, { reason: "Manual Cleanup" });
      toast.success("Item moved to trash");
      fetchItems();
    } catch (error) {
      toast.error("Failed to move item to trash");
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/items/${editingItem.id}`, editingItem);
      toast.success(t('item_updated') || "Item updated successfully");
      setShowEditModal(false);
      fetchItems();
    } catch (error) {
      toast.error(t('failed_update_item') || "Failed to update item");
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
            {t('inventory_description')}
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
              {t('grid')}
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest hidden sm:block",
                view === 'list' ? "bg-white shadow-xl shadow-black/5 text-primary-teal" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {t('list')}
            </button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
          >
            <Plus size={18} />
            {t('map_new_sku')}
          </button>
        </div>
      </div>

      <div className="fintech-card p-4 lg:p-6 flex flex-col md:flex-row items-center gap-4 lg:gap-6 bg-white/50 backdrop-blur-sm">
        <div className="relative flex-1 w-full text-start">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-5" : "left-5")} size={18} />
          <input 
            type="text" 
            placeholder={t('search_inventory_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full bg-slate-50 border-none rounded-2xl py-4.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700 shadow-inner",
              t('lang_direction') === 'rtl' ? "pr-14 pl-6" : "pl-14 pr-6"
            )}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          {(activeFilter || searchTerm) && (
            <button 
              onClick={() => { setActiveFilter(null); setSearchTerm(''); }}
              className="flex items-center gap-2 px-6 py-4.5 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              <X size={14} />
              {t('clear_filters')}
            </button>
          )}
          <button 
            onClick={() => toast.info(t('advanced_filter_coming_soon'))}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-slate-400 px-8 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-primary-teal transition-all border border-slate-100 shadow-sm"
          >
            <Filter size={18} />
            {t('filter')}
          </button>
          <button 
            onClick={() => toast.success(t('inventory_ledger_exported'))}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-slate-400 px-8 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-primary-teal transition-all border border-slate-100 shadow-sm"
          >
            <ArrowUpRight size={18} />
            {t('export')}
          </button>
        </div>
      </div>

      {(activeFilter || (location.state && location.state.faculty)) && (
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Filters:</div>
           {activeFilter === 'low_stock' && (
             <div className="bg-amber-50 text-amber-600 border border-amber-100 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
               {t('status_low_stock')}
               <X size={12} className="cursor-pointer" onClick={() => setActiveFilter(null)} />
             </div>
           )}
           {searchTerm && (
             <div className="bg-primary-teal/5 text-primary-teal border border-primary-teal/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
               {searchTerm}
               <X size={12} className="cursor-pointer" onClick={() => setSearchTerm('')} />
             </div>
           )}
        </div>
      )}

      <div className={cn(
        "grid gap-8 pb-32",
        view === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1"
      )}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 fintech-card animate-pulse" />
          ))
        ) : (
          Array.isArray(filteredItems) && filteredItems.map((item) => (
            <InventoryCard 
              key={item.id} 
              item={item} 
              horizontal={view === 'list'} 
              onDelete={() => handleMoveToTrash(item.id)}
              onEdit={() => { setEditingItem(item); setShowEditModal(true); }}
            />
          ))
        )}
      </div>

      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden p-10 animate-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-8">
                 <div className="text-start">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">{t('edit_item') || 'Edit Item'}</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{t('update_item_metadata') || 'Update Item Metadata'}</p>
                 </div>
                 <button onClick={() => setShowEditModal(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={20} className="rotate-45" />
                 </button>
              </div>

              <form onSubmit={handleUpdateItem} className="space-y-6">
                 <div className="space-y-4 text-start">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('item_name')}</label>
                       <input 
                         required
                         value={editingItem.name}
                         onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('item_code')}</label>
                          <input 
                            required
                            value={editingItem.item_code}
                            onChange={(e) => setEditingItem({...editingItem, item_code: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all font-mono"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('unit')}</label>
                          <input 
                            required
                            value={editingItem.unit}
                            onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('location')}</label>
                       <input 
                         value={editingItem.location}
                         onChange={(e) => setEditingItem({...editingItem, location: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all"
                       />
                    </div>
                 </div>

                 <button 
                   type="submit"
                   className="w-full bg-slate-900 text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all shadow-2xl shadow-slate-900/20"
                 >
                    {t('save_changes')}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const InventoryCard: React.FC<{ item: any, horizontal?: boolean, onDelete: () => void, onEdit: () => void }> = ({ item, horizontal, onDelete, onEdit }) => {
  const { t } = useTranslation();
  const statusStyles: Record<string, string> = {
    'In Stock': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Low Stock': 'bg-amber-50 text-amber-600 border-amber-100',
    'Out of Stock': 'bg-red-50 text-red-600 border-red-100',
  };

  const translatedStatus: Record<string, string> = {
    'In Stock': t('status_in_stock'),
    'Low Stock': t('status_low_stock'),
    'Out of Stock': t('status_out_of_stock'),
  };

  const handlePrintLedger = (item: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${t('inventory_ledger')} - ${item.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1d1f; direction: ${t('lang_direction') === 'rtl' ? 'rtl' : 'ltr'}; }
            .header { border-bottom: 3px solid #0F8F7F; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .university-name { font-weight: 900; text-transform: uppercase; letter-spacing: 2px; font-size: 24px; color: #0F8F7F; }
            .document-type { font-weight: 700; border: 1px solid #e2e8f0; padding: 5px 15px; border-radius: 8px; font-size: 12px; }
            .item-info { margin-bottom: 40px; background: #f8fafc; padding: 25px; border-radius: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
            .info-value { font-size: 16px; font-weight: 900; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: ${t('lang_direction') === 'rtl' ? 'right' : 'left'}; padding: 15px; background: #f1f5f9; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
            td { padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature-box { border-top: 1px solid #64748b; width: 200px; padding-top: 10px; text-align: center; font-size: 10px; font-weight: 800; text-transform: uppercase; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="university-name">${t('app_name')}</div>
            <div class="document-type">${t('official_ledger')}</div>
          </div>

          <div class="item-info">
            <div>
              <div class="info-label">${t('item_nomenclature')}</div>
              <div class="info-value">${item.name}</div>
            </div>
            <div>
              <div class="info-label">${t('standard_id_bab')}</div>
              <div class="info-value">${item.item_code} / ${item.bab_code}</div>
            </div>
            <div>
              <div class="info-label">${t('physical_stock')}</div>
              <div class="info-value">${item.quantity} ${item.unit || t('unit_pcs')}</div>
            </div>
            <div>
              <div class="info-label">${t('registry_date')}</div>
              <div class="info-value">${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <h3>${t('transaction_history')}</h3>
          <table>
            <thead>
              <tr>
                <th>${t('date')}</th>
                <th>${t('reference')}</th>
                <th>${t('operation')}</th>
                <th>${t('entity')}</th>
                <th>${t('change')}</th>
                <th>${t('balance')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${new Date().toLocaleDateString()}</td>
                <td>REG-001</td>
                <td>${t('initial_load')}</td>
                <td>${t('system')}</td>
                <td>+${item.quantity}</td>
                <td>${item.quantity}</td>
              </tr>
              <tr>
                <td>-</td>
                <td>-</td>
                <td>${t('no_prior_history')}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div class="signature-box">${t('warehouse_rep')}</div>
            <div class="signature-box">${t('chancellor_office')}</div>
          </div>

          <script>
            window.onload = () => { 
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className={cn(
      "fintech-card p-6 flex flex-col justify-between group overflow-hidden h-full",
      horizontal && "flex-row items-center p-8 h-auto"
    )}>
      <div className={cn("flex flex-col gap-5", horizontal && "flex-row items-center flex-1 gap-12")}>
        <div className="flex items-start justify-between w-full overflow-hidden">
          <div className="flex items-center gap-5 overflow-hidden">
             <div className="w-14 h-14 rounded-2xl bg-primary-teal/5 border border-primary-teal/10 flex items-center justify-center text-primary-teal shrink-0 group-hover:scale-110 transition-transform">
               <Package size={28} />
             </div>
             <div className="overflow-hidden">
               <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
                 <span className="font-mono text-[10px] bg-[#1A1D1F] text-white px-2 py-0.5 rounded-lg font-black tracking-widest shadow-sm truncate">
                   {item.item_code}
                 </span>
                 <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none truncate">
                    {t('select_bab')?.split(' ')[0]} {item.bab_code}
                 </div>
               </div>
               <div className="text-xl font-black text-[#1A1D1F] tracking-tight leading-tight group-hover:text-primary-teal transition-colors truncate w-full">
                 {item.name}
               </div>
             </div>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest shrink-0 ml-2", statusStyles[item.status])}>
            {translatedStatus[item.status] || item.status}
          </div>
        </div>

        <div className={cn("mt-2 flex gap-8", horizontal && "mt-0")}>
           <div className="flex flex-col text-start">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('current_stock')}</span>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-[#1A1D1F] leading-none">{item.quantity}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.unit || t('unit_pcs')}</span>
             </div>
           </div>
        </div>
      </div>

      <div className={cn("mt-10 flex gap-3 flex-wrap", horizontal && "mt-0 ml-12")}>
        <button 
          onClick={onEdit}
          className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 hover:text-primary-teal transition-all border border-slate-100 shadow-sm shrink-0"
        >
          <Edit size={24} />
        </button>
        <button 
          onClick={() => handlePrintLedger(item)}
          className="flex-1 min-w-[120px] bg-[#1A1D1F] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10"
        >
          {t('inventory_ledger')}
          <ArrowUpRight size={14} className="opacity-50" />
        </button>
        <button 
          onClick={onDelete}
          className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-all border border-red-100 shrink-0"
        >
          <Trash2 size={24} />
        </button>
      </div>
    </div>
  );
}
