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
  
  // Inline adding state
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      const res = await api.get('/codes');
      const data = res.data || [];
      setBudgetTree(data);
      
      // Keep selected items in sync after tree refresh
      if (selectedBab && step > 1) {
        const newBab = data.find((b: any) => b.bab === selectedBab.bab);
        if (newBab) {
          setSelectedBab(newBab);
          if (selectedFasl && step > 2) {
            const newFasl = newBab.fasls.find((f: any) => f.code === selectedFasl.code);
            if (newFasl) {
              setSelectedFasl(newFasl);
            } else {
              setStep(2);
              setSelectedFasl(null);
            }
          }
        } else {
          setStep(1);
          setSelectedBab(null);
          setSelectedFasl(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch budget structure');
    } finally {
      setLoading(false);
    }
  };

  const resetAddForm = () => {
    setIsAdding(false);
    setNewCode('');
    setNewName('');
  };

  const handleAddSubmit = async () => {
    if (!newCode || !newName) {
      toast.error("Please enter both code and name");
      return;
    }
    
    try {
      if (step === 1) {
        await api.post('/codes/bab', { bab: newCode, name: newName });
        toast.success("BaB added");
      } else if (step === 2) {
        await api.post('/codes/fasl', { bab: selectedBab.bab, code: newCode, name: newName });
        toast.success("Fasl added");
      } else if (step === 3) {
        await api.post('/codes/item', { bab: selectedBab.bab, fasl: selectedFasl.code, code: newCode, name: newName });
        toast.success("Item added");
      }
      resetAddForm();
      fetchTree();
    } catch (e) {
      toast.error("Failed to add entry. Check if code already exists.");
    }
  };

  const handleDeleteBab = async (e: React.MouseEvent, babCode: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/codes/bab/${babCode}`);
      fetchTree();
      toast.success("BaB deleted");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const handleDeleteFasl = async (e: React.MouseEvent, faslCode: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/codes/fasl/${selectedBab.bab}/${faslCode}`);
      fetchTree();
      toast.success("Fasl deleted");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const handleDeleteItem = async (e: React.MouseEvent, itemCode: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/codes/item/${selectedBab.bab}/${selectedFasl.code}/${itemCode}`);
      fetchTree();
      toast.success("Item deleted");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const renderAddForm = () => (
    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <input 
          placeholder="Code (e.g. 221)" 
          value={newCode} 
          onChange={e => setNewCode(e.target.value)}
          className="p-3 bg-white border border-emerald-200 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
        />
        <input 
          placeholder="Name" 
          value={newName} 
          onChange={e => setNewName(e.target.value)}
          className="p-3 bg-white border border-emerald-200 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleAddSubmit}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
        >
          {t('confirm')}
        </button>
        <button 
          onClick={resetAddForm}
          className="px-6 py-3 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-xs font-black uppercase hover:bg-emerald-100 transition-all"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );

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
              {isAdding && renderAddForm()}
              
              {step === 1 && !isAdding && (
                <>
                  {budgetTree.map((bab) => (
                    <div key={bab.bab} className="flex gap-2 group">
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
                      <button onClick={(e) => handleDeleteBab(e, bab.bab)} className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setIsAdding(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-black text-slate-400 border-primary-teal hover:text-primary-teal transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> ADD NEW BAB
                  </button>
                </>
              )}

              {step === 2 && !isAdding && (
                <>
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3 mb-2">
                    <div className="bg-slate-900 text-white px-2 py-1 rounded font-mono text-xs font-bold shrink-0">BAB {selectedBab.bab}</div>
                    <div className="text-xs font-black text-slate-600 uppercase tracking-widest truncate">{selectedBab.name}</div>
                  </div>
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
                      <button onClick={(e) => handleDeleteFasl(e, fasl.code)} className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setIsAdding(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-black text-slate-400 border-primary-teal hover:text-primary-teal transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> ADD NEW FASL TO BAB {selectedBab.bab}
                  </button>
                </>
              )}

              {step === 3 && !isAdding && (
                <>
                   <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-900 text-white px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0">BAB {selectedBab.bab}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{selectedBab.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-600 text-white px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0">FASL {selectedFasl.code}</div>
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest truncate">{selectedFasl.name}</div>
                    </div>
                  </div>
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
                      <button onClick={(e) => handleDeleteItem(e, item.code)} className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setIsAdding(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-black text-slate-400 border-primary-teal hover:text-primary-teal transition-all flex items-center justify-center gap-2">
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
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
             >
                {step === 2 ? t('back_to_bab') : t('back_to_fasl')}
             </button>
          ) : (
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic pl-2">
              Official Hierarchy Management
            </div>
          )}
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-black/10"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
