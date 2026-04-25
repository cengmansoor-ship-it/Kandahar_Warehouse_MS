import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import api from '@/src/services/api';

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

        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {step === 1 && (
                budgetTree.map((bab) => (
                  <button
                    key={bab.bab}
                    onClick={() => { setSelectedBab(bab); setStep(2); }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-900 text-white px-2 py-1 rounded font-mono text-sm font-bold">BAB {bab.bab}</div>
                      <div className="font-bold text-slate-700">{bab.name}</div>
                    </div>
                    <ChevronRight size={18} className={cn("text-slate-300", t('lang_direction') === 'rtl' && "rotate-180")} />
                  </button>
                ))
              )}

              {step === 2 && (
                selectedBab.fasls.map((fasl: any) => (
                  <button
                    key={fasl.code}
                    onClick={() => { setSelectedFasl(fasl); setStep(3); }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600 text-white px-2 py-1 rounded font-mono text-sm font-bold">FASL {fasl.code}</div>
                      <div className="font-bold text-slate-700">{fasl.name}</div>
                    </div>
                    <ChevronRight size={18} className={cn("text-slate-300", t('lang_direction') === 'rtl' && "rotate-180")} />
                  </button>
                ))
              )}

              {step === 3 && (
                selectedFasl.items.map((item: any) => (
                  <button
                    key={item.code}
                    onClick={() => onSelect({
                      name: item.name,
                      item_code: item.code,
                      bab_code: selectedBab.bab,
                      fasl_code: selectedFasl.code,
                      category: selectedFasl.name
                    })}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-600 text-white px-2 py-1 rounded font-mono text-sm font-bold">{item.code}</div>
                      <div className="font-bold text-slate-700">{item.name}</div>
                    </div>
                    <Check size={18} className="text-emerald-400" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {step > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button 
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              {step === 2 ? t('back_to_bab') : t('back_to_fasl')}
            </button>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
              {t('government_standard')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
