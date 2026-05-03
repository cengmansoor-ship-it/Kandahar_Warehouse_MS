import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Send, 
  ShoppingCart,
  LayoutDashboard,
  ClipboardList
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TenderForm } from './TenderForm';
import { ComparisonForm } from './ComparisonForm';
import { PurchaseOrderForm } from './PurchaseOrderForm';

export const ProcurementManager: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'tender' | 'comparison' | 'po'>('overview');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            {t('procurement_workflow')}
          </h1>
          <p className="text-slate-400 font-medium uppercase text-[10px] tracking-widest leading-none">
            {t('procurement_description')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: t('dashboard'), icon: LayoutDashboard },
          { id: 'tender', label: t('tender_creation'), icon: FileText },
          { id: 'comparison', label: t('comparison_matrix'), icon: ClipboardList },
          { id: 'po', label: t('purchase_order'), icon: ShoppingCart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0 ${
              activeTab === tab.id ? 'text-[#0F8F7F]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="proc-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-1 bg-[#0F8F7F] rounded-t-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="col-span-1 md:col-span-2 space-y-8">
                    <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-[44px] space-y-4">
                      <h3 className="text-2xl font-black text-emerald-900 tracking-tight">{t('official_doc_mgmt')}</h3>
                      <p className="text-emerald-700 font-medium leading-relaxed">
                        {t('procurement_welcome')}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <DocumentFeatureCard 
                        title={t('tender_acquisition')} 
                        desc={t('tender_acq_desc')}
                        onClick={() => setActiveTab('tender')}
                        icon={<FileText size={28} />}
                      />
                       <DocumentFeatureCard 
                        title={t('comparison_matrix')} 
                        desc={t('comparison_matrix_desc')}
                        onClick={() => setActiveTab('comparison')}
                        icon={<ClipboardList size={28} />}
                      />
                    </div>
                 </div>
                  <div className="bg-white border border-slate-100 p-10 rounded-[44px] shadow-sm space-y-8">
                     <h4 
                       onClick={() => setActiveTab('po')}
                       className="font-black text-[#0F8F7F] uppercase tracking-widest text-[10px] bg-emerald-50 p-3 text-center rounded-2xl cursor-pointer hover:bg-emerald-100 transition-all border border-emerald-100/50"
                     >
                       {t('logistics_governance')}
                     </h4>
                    <div className="space-y-6">
                       {[1,2,3].map(i => (
                         <div 
                           key={i} 
                           onClick={() => setActiveTab('po')}
                           className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-[#0F8F7F]/30 transition-all cursor-pointer group"
                         >
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#0F8F7F] shadow-sm border border-slate-100 group-hover:bg-[#0F8F7F] group-hover:text-white transition-all"><Send size={20} /></div>
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase">PO #1404-0{i}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Awarded to Jamal Abna Co.</p>
                            </div>
                         </div>
                       ))}
                    </div>
                     <div className="pt-6 border-t border-dashed border-slate-100">
                        <button 
                          onClick={() => {
                            toast.success("Navigating to traceability audit gateway...");
                            navigate('/reports', { state: { tab: 'traceability' } });
                          }} 
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                        >
                          {t('view_audit_trail')}
                        </button>
                     </div>
                  </div>
              </div>
            )}
            
            {activeTab === 'tender' && <TenderForm />}
            {activeTab === 'comparison' && <ComparisonForm />}
            {activeTab === 'po' && <PurchaseOrderForm />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const DocumentFeatureCard = ({ title, desc, onClick, icon }: { title: string, desc: string, onClick: () => void, icon: React.ReactNode }) => {
  const { t } = useTranslation();
  return (
    <button 
      onClick={onClick}
      className="group bg-white p-10 rounded-[44px] border border-slate-100 shadow-sm text-start hover:border-[#0F8F7F] hover:shadow-xl hover:shadow-slate-200/40 transition-all flex flex-col h-full"
    >
      <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-400 group-hover:bg-[#0F8F7F] group-hover:text-white transition-all mb-8 shadow-inner">
        {icon}
      </div>
      <h4 className="font-black text-xl text-slate-900 mb-3 tracking-tight">{title}</h4>
      <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">{desc}</p>
      <div className="mt-8 flex items-center gap-2 text-[#0F8F7F] font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
         {t('initialize_form')}
      </div>
    </button>
  );
};

