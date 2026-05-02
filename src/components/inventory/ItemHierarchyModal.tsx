import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronRight, Check, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import api from '@/src/services/api';
import { toast } from 'sonner';

interface ItemHierarchyModalProps {
  onClose: () => void;
  onSelect: (itemData: any) => void;
}

export const ItemHierarchyModal: React.FC<ItemHierarchyModalProps> = ({ onClose, onSelect }) => {
  const { t } = useTranslation();
  const [budgetTree, setBudgetTree] = useState<any[]>([]);
  const [step, setStep] = useState(1); // 1: Bab, 2: Fasl, 3: Item
  const [selectedBab, setSelectedBab] = useState<any>(null);
  const [selectedFasl, setSelectedFasl] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      const res = await api.get('/codes');
      setBudgetTree(res.data);
    } catch (error) {
      console.error('Failed to fetch budget structure');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBab = async () => {
    const bab = prompt("Enter BaB Code (e.g. 220):");
    const name = prompt("Enter BaB Name:");
    if (bab && name) {
      try {
        await api.post('/codes/bab', { bab, name });
        fetchTree();
        toast.success("BaB added to official tree");
      } catch (e) { toast.error("Failed to add BaB"); }
    }
  };

  const handleDeleteBab = async (e: React.MouseEvent, babCode: string) => {
    e.stopPropagation();
    if (confirm(`Delete BaB ${babCode} and all its hierarchy?`)) {
      try {
        await api.delete(`/codes/bab/${babCode}`);
        fetchTree();
        toast.success("BaB deleted");
      } catch (e) { toast.error("Failed to delete"); }
    }
  };

  const handleAddFasl = async () => {
    const code = prompt("Enter Fasl Code (e.g. 221):");
    const name = prompt("Enter Fasl Name:");
    if (code && name && selectedBab) {
      try {
        await api.post('/codes/fasl', { bab: selectedBab.bab, code, name });
        fetchTree();
        toast.success("Fasl added");
      } catch (e) { toast.error("Failed to add Fasl"); }
    }
  };

  const handleDeleteFasl = async (e: React.MouseEvent, faslCode: string) => {
    e.stopPropagation();
    if (confirm(`Delete Fasl ${faslCode}?`)) {
      try {
        await api.delete(`/codes/fasl/${selectedBab.bab}/${faslCode}`);
        fetchTree();
        toast.success("Fasl deleted");
      } catch (e) { toast.error("Failed to delete"); }
    }
  };

  const handleAddItem = async () => {
    const code = prompt("Enter Item Code (e.g. 22101):");
    const name = prompt("Enter Item Name:");
    if (code && name && selectedBab && selectedFasl) {
      try {
        await api.post('/codes/item', { bab: selectedBab.bab, fasl: selectedFasl.code, code, name });
        fetchTree();
        toast.success("Item added to registry");
      } catch (e) { toast.error("Failed to add item"); }
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, itemCode: string) => {
    e.stopPropagation();
    if (confirm(`Delete Item ${itemCode} from registry?`)) {
      try {
        await api.delete(`/codes/item/${selectedBab.bab}/${selectedFasl.code}/${itemCode}`);
        fetchTree();
        toast.success("Item deleted");
      } catch (e) { toast.error("Failed to delete"); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-start">
            <h3 className="text-xl font-bold text-slate-900">{t('official_item_selection')}</h3>
            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">
              {step === 1 ? t('select_bab') : step === 2 ? t('select_fasl') : t('select_item_code')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {step === 1 && (
                <>
                  {budgetTree.map((bab) => (
                    <div key={bab.bab} className="flex gap-2">
                      <button
                        onClick={() => { setSelectedBab(bab); setStep(2); }}
                        className="flex-1 flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-900 text-white px-2 py-1 rounded font-mono text-sm font-bold">BAB {bab.bab}</div>
                          <div className="font-bold text-slate-700">{bab.name}</div>
                        </div>
                        <ChevronRight size={18} className={cn("text-slate-300", t('lang_direction') === 'rtl' && "rotate-180")} />
                      </button>
                      <button onClick={(e) => handleDeleteBab(e, bab.bab)} className="p-4 text-red-400 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button onClick={handleAddBab} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-black text-slate-400 border-primary-teal hover:text-primary-teal transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> ADD NEW BAB
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  {selectedBab.fasls.map((fasl: any) => (
                    <div key={fasl.code} className="flex gap-2">
                      <button
                        onClick={() => { setSelectedFasl(fasl); setStep(3); }}
                        className="flex-1 flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-600 text-white px-2 py-1 rounded font-mono text-sm font-bold">FASL {fasl.code}</div>
                          <div className="font-bold text-slate-700">{fasl.name}</div>
                        </div>
                        <ChevronRight size={18} className={cn("text-slate-300", t('lang_direction') === 'rtl' && "rotate-180")} />
                      </button>
                      <button onClick={(e) => handleDeleteFasl(e, fasl.code)} className="p-4 text-red-400 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button onClick={handleAddFasl} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-black text-slate-400 border-primary-teal hover:text-primary-teal transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> ADD NEW FASL TO BAB {selectedBab.bab}
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  {selectedFasl.items.map((item: any) => (
                    <div key={item.code} className="flex gap-2">
                      <button
                        onClick={() => onSelect({
                          name: item.name,
                          item_code: item.code,
                          bab_code: selectedBab.bab,
                          fasl_code: selectedFasl.code,
                          category: selectedFasl.name
                        })}
                        className="flex-1 flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-emerald-600 text-white px-2 py-1 rounded font-mono text-sm font-bold">{item.code}</div>
                          <div className="font-bold text-slate-700">{item.name}</div>
                        </div>
                        <Check size={18} className="text-emerald-400" />
                      </button>
                      <button onClick={(e) => handleDeleteItem(e, item.code)} className="p-4 text-red-400 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button onClick={handleAddItem} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-black text-slate-400 border-primary-teal hover:text-primary-teal transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> ADD NEW ITEM CODE TO FASL {selectedFasl.code}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
             <button 
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
             >
                {step === 2 ? t('back_to_bab') : t('back_to_fasl')}
             </button>
          ) : (
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic pl-2">
              Management of Official Hierarchy
            </div>
          )}
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-black/10"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
