import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Truck, 
  Calendar, 
  User, 
  ArrowRight,
  ClipboardList,
  Upload,
  Download,
  FileSpreadsheet,
  X,
  Package,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  Tag,
  Hash,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { receivingService, inventoryService } from '@/src/services/api';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

  const ConditionBadge = ({ condition }: { condition: string }) => {
    const { t } = useTranslation();
    const colors = {
      'New': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Used': 'bg-blue-50 text-blue-600 border-blue-100',
      'Damaged': 'bg-red-50 text-red-600 border-red-100',
      'Returned': 'bg-amber-50 text-amber-600 border-amber-100',
      'Needs Inspection': 'bg-slate-50 text-slate-600 border-slate-100'
    };
    return (
      <span className={cn(
        "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest leading-none",
        colors[condition as keyof typeof colors] || colors['Needs Inspection']
      )}>
        {condition === 'New' ? t('New') || 'New' : 
         condition === 'Used' ? t('Used') || 'Used' :
         condition === 'Damaged' ? t('Damaged') || 'Damaged' :
         condition === 'Returned' ? t('Returned') || 'Returned' :
         t('Needs Inspection') || condition}
      </span>
    );
  };

export const ReceivingManager = () => {
  const { t } = useTranslation();
  const [receivings, setReceivings] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('receivingViewMode') as 'grid' | 'list') || (window.innerWidth < 1024 ? 'grid' : 'list');
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    item_code: '',
    quantity: '',
    unit: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    warehouse_location: '',
    condition: 'New',
    notes: ''
  });

  useEffect(() => {
    localStorage.setItem('receivingViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredReceivings = receivings.filter(rec => {
    const searchStr = searchTerm.toLowerCase();
    return (
      rec.item_name?.toLowerCase().includes(searchStr) ||
      rec.item_code?.toLowerCase().includes(searchStr) ||
      rec.supplier?.toLowerCase().includes(searchStr) ||
      rec.invoice_number?.toLowerCase().includes(searchStr) ||
      rec.warehouse_location?.toLowerCase().includes(searchStr)
    );
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, itemsRes] = await Promise.all([
        receivingService.getReceivings(),
        inventoryService.getItems()
      ]);
      setReceivings(recRes.data || []);
      setItems(itemsRes.data || []);
    } catch (error) {
      toast.error(t('failed_load_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode && editingId) {
        const res = await receivingService.updateReceiving(editingId, formData);
        const updatedRec = res.data.receiving;
        setReceivings(prev => prev.map(rec => rec.id === editingId ? updatedRec : rec));
        toast.success(t('reception_updated_success'));
      } else {
        const res = await receivingService.addReceiving(formData);
        const newRec = res.data;
        setReceivings(prev => [newRec, ...prev]);
        toast.success(t('reception_logged_success'));
      }
      setShowModal(false);
      resetForm();
      // Still fetch to ensure everything is in sync (e.g. stock updates elsewhere)
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const resetForm = () => {
    setFormData({
      item_code: '',
      quantity: '',
      unit: '',
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      warehouse_location: '',
      condition: 'New',
      notes: ''
    });
    setEditMode(false);
    setEditingId(null);
  };

  const handleEdit = (rec: any) => {
    setFormData({
      item_code: rec.item_code,
      quantity: rec.quantity.toString(),
      unit: rec.unit || '',
      supplier: rec.supplier,
      date: rec.date,
      invoice_number: rec.invoice_number || '',
      warehouse_location: rec.warehouse_location || '',
      condition: rec.condition || 'New',
      notes: rec.notes || ''
    });
    setEditMode(true);
    setEditingId(rec.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete_record'))) return;
    
    // Optimistic Update
    const previousReceivings = [...receivings];
    setReceivings(prev => prev.filter(rec => rec.id !== id));
    
    try {
      await receivingService.deleteReceiving(id);
      toast.success(t('record_deleted'));
      // Optionally fetch to sync stock counters
      fetchData();
    } catch (error: any) {
      // Revert if failed
      setReceivings(previousReceivings);
      toast.error(error.response?.data?.error || t('delete_failed'));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await receivingService.uploadReceivings(file);
      const { total, success, failed, errors } = res.data;
      
      toast.success(`${t('import_complete')}: ${success}/${total} succeeded`);
      if (failed > 0) {
        toast.error(`${failed} ${t('rows_failed')}`);
        console.error("Import errors:", errors);
      }
      fetchData();
    } catch (error) {
      toast.error(t('failed_upload'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const res = await receivingService.exportReceivings();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receivings_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(t('export_failed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic leading-none">
            {t('receiving')}
            <span className="text-[10px] bg-primary-teal text-white px-3 py-1 rounded-lg not-italic font-black uppercase tracking-[0.4em] shadow-lg shadow-primary-teal/20">KDRU</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-8 bg-primary-teal/30 rounded-full" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest leading-none text-start">
              {t('inbound_logistics')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
             <button 
               onClick={() => setViewMode('list')}
               className={cn(
                 "p-2 rounded-lg transition-all",
                 viewMode === 'list' ? "bg-white text-primary-teal shadow-sm" : "text-slate-400 hover:text-slate-600"
               )}
             >
               <ListIcon size={18} />
             </button>
             <button 
               onClick={() => setViewMode('grid')}
               className={cn(
                 "p-2 rounded-lg transition-all",
                 viewMode === 'grid' ? "bg-white text-primary-teal shadow-sm" : "text-slate-400 hover:text-slate-600"
               )}
             >
               <LayoutGrid size={18} />
             </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".xlsx,.csv"
          />
          <button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <Upload size={18} />
            {t('bulk_import')}
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={18} />
            {t('export_data')}
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
          >
            <Truck size={18} />
            {t('new_receipt')}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="fintech-card p-6 bg-white flex items-center gap-6">
          <div className="relative flex-1 w-full text-start">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-5" : "left-5")} size={18} />
            <input 
              type="text" 
              placeholder={t('search_receiving_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full bg-slate-50 border-none rounded-2xl py-4.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700 shadow-inner",
                t('lang_direction') === 'rtl' ? "pr-14 pl-6" : "pl-14 pr-6"
              )}
            />
          </div>
        </div>

        {loading ? (
          <div className="fintech-card p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">
             {t('sync_ledger')}
          </div>
        ) : filteredReceivings.length === 0 ? (
          <div className="fintech-card p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] bg-slate-50 border-dashed border-2 border-slate-200">
             {searchTerm ? `${t('clear')} "${searchTerm}"` : t('no_arrival_records')}
          </div>
        ) : viewMode === 'list' ? (
          <div className="fintech-card bg-white overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className={cn("w-full border-collapse min-w-[1200px]", t('lang_direction') === 'rtl' ? "text-right" : "text-left")}>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('arrival_info')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('logistics_invoice')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('location')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('quantity')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('condition')}</th>
                    <th className={cn("px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest", t('lang_direction') === 'rtl' ? "text-left" : "text-right")}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] font-bold uppercase tracking-wide">
                  {filteredReceivings.slice().reverse().map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900 text-xs leading-none mb-1 uppercase tracking-tight">{rec.item_name}</div>
                        <div className="text-slate-400 flex items-center gap-2 font-bold tracking-widest">
                           <Calendar size={12} /> {rec.date}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-slate-700 mb-1">{rec.supplier}</div>
                        <div className="text-primary-teal flex items-center gap-1 font-black tracking-widest">
                           <Hash size={12} /> {rec.invoice_number}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-600">
                           <MapPin size={12} className="text-slate-400" />
                           {rec.warehouse_location}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-lg border border-slate-200">
                          {rec.quantity} {rec.unit}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <ConditionBadge condition={rec.condition} />
                      </td>
                       <td className={cn("px-8 py-6", t('lang_direction') === 'rtl' ? "text-left" : "text-right")}>
                        <div className={cn("flex items-center gap-1", t('lang_direction') === 'rtl' ? "justify-start" : "justify-end")}>
                          <button onClick={() => handleEdit(rec)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary-teal transition-all">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(rec.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredReceivings.slice().reverse().map((rec) => (
              <div key={rec.id} className="fintech-card p-6 bg-white hover:border-primary-teal/30 transition-all group flex flex-col justify-between border border-slate-100 text-start">
                <div>
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-primary-teal/10 text-primary-teal flex items-center justify-center">
                            <Package size={16} />
                         </div>
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rec.id.slice(0, 8)}</div>
                      </div>
                      <ConditionBadge condition={rec.condition} />
                   </div>
                   <h4 className="font-black text-slate-900 text-sm tracking-tight mb-2 italic leading-tight uppercase truncate">{rec.item_name}</h4>
                   
                   <div className="space-y-3 mt-6">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                         <span className="text-slate-400 uppercase tracking-widest">{t('volume')}</span>
                         <span className="text-slate-900 uppercase font-black">{rec.quantity} {rec.unit}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold">
                         <span className="text-slate-400 uppercase tracking-widest">{t('supplier')}</span>
                         <span className="text-slate-900 truncate max-w-[120px] font-black">{rec.supplier}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold">
                         <span className="text-slate-400 uppercase tracking-widest">{t('invoice')}</span>
                         <span className="text-primary-teal font-black tracking-widest">{rec.invoice_number}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold">
                         <span className="text-slate-400 uppercase tracking-widest">{t('location')}</span>
                         <span className="text-slate-600">{rec.warehouse_location}</span>
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      <Calendar size={14} />
                      {rec.date}
                   </div>
                   <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(rec)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary-teal transition-all">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(rec.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all">
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-10">
              <div className="flex items-center justify-between mb-10">
                <div className="text-start">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">
                     {editMode ? t('edit_receipt') : t('log_receipt')}
                   </h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{t('manual_ledger_admission')}</p>
                </div>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-6">
                 <div className="space-y-2 text-start">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('arrival_item')}</label>
                    <div className="relative">
                      <Package className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-4" : "left-4")} size={18} />
                      <select 
                        required
                        value={formData.item_code}
                        onChange={(e) => setFormData({...formData, item_code: e.target.value})}
                        className={cn(
                          "w-full bg-slate-50 border-none rounded-2xl py-4.5 pr-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all appearance-none text-slate-700",
                          t('lang_direction') === 'rtl' ? "pr-12 pl-6" : "pl-12 pr-6"
                        )}
                      >
                         <option value="">{t('select_sku')}</option>
                         {items.map(item => (
                           <option key={item.id} value={item.item_code}>{item.name} ({item.item_code})</option>
                         ))}
                      </select>
                    </div>
                 </div>

                  <div className="grid grid-cols-2 gap-6 text-start">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('quantity')}</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="000"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('unit_of_measure')}</label>
                       <select 
                         required
                         value={formData.unit}
                         onChange={(e) => setFormData({...formData, unit: e.target.value})}
                         className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all appearance-none text-slate-700"
                       >
                          <option value="">{t('select_unit') || 'Select Unit'}</option>
                          <option value="PCS">{t('pcs_long')}</option>
                          <option value="KG">{t('kg_long')}</option>
                          <option value="LTR">{t('ltr_long')}</option>
                          <option value="BOX">{t('box_long')}</option>
                          <option value="UNIT">{t('unit_long')}</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 text-start">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('arrival_date')}</label>
                      <input 
                        type="date" 
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('invoice_reference')}</label>
                       <input 
                         type="text" 
                         required
                         placeholder="INV-XXXXX"
                         value={formData.invoice_number}
                         onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                         className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700 font-mono tracking-widest"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 text-start">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('warehouse_location')}</label>
                       <div className="relative">
                         <MapPin className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-4" : "left-4")} size={18} />
                         <select 
                           required
                           value={formData.warehouse_location}
                           onChange={(e) => setFormData({...formData, warehouse_location: e.target.value})}
                           className={cn(
                             "w-full bg-slate-50 border-none rounded-2xl py-4.5 pr-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all appearance-none text-slate-700",
                             t('lang_direction') === 'rtl' ? "pr-12 pl-6" : "pl-12 pr-6"
                           )}
                         >
                            <option value="">{t('select_location')}</option>
                            <option value="Zone A-01">Zone A-01</option>
                            <option value="Zone B-12">Zone B-12</option>
                            <option value="Cold Storage">Cold Storage</option>
                            <option value="Main Rack 4">Main Rack 4</option>
                            <option value="Overflow">Overflow</option>
                         </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('entry_condition')}</label>
                       <div className="relative">
                         <Tag className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-4" : "left-4")} size={18} />
                         <select 
                           required
                           value={formData.condition}
                           onChange={(e) => setFormData({...formData, condition: e.target.value})}
                           className={cn(
                             "w-full bg-slate-50 border-none rounded-2xl py-4.5 pr-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all appearance-none text-slate-700",
                             t('lang_direction') === 'rtl' ? "pr-12 pl-6" : "pl-12 pr-6"
                           )}
                         >
                            <option value="New">{t('New') || 'New'}</option>
                            <option value="Used">{t('Used') || 'Used'}</option>
                            <option value="Damaged">{t('Damaged') || 'Damaged'}</option>
                            <option value="Returned">{t('Returned') || 'Returned'}</option>
                            <option value="Needs Inspection">{t('Needs Inspection') || 'Needs Inspection'}</option>
                         </select>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2 text-start">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('supplier_entity')}</label>
                    <div className="relative">
                      <User className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-4" : "left-4")} size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder={t('provider_placeholder')}
                        value={formData.supplier}
                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        className={cn(
                          "w-full bg-slate-50 border-none rounded-2xl py-4.5 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700",
                          t('lang_direction') === 'rtl' ? "pr-12 pl-6" : "pl-12 pr-6"
                        )}
                      />
                    </div>
                 </div>

                 {/* Notes */}
                 <div className="space-y-2 text-start">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('notes_optional')}</label>
                    <textarea 
                      placeholder={t('notes_placeholder')}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all h-24 resize-none"
                    />
                 </div>

                 <div className="pt-6">
                    <button 
                      type="submit"
                      className="w-full bg-slate-900 text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4"
                    >
                      {editMode ? t('update_record') : t('acknowledge_sync')}
                      <ArrowRight size={18} className={cn(t('lang_direction') === 'rtl' && "rotate-180")} />
                    </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
