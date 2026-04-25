import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Send, 
  Plus, 
  ArrowRight,
  Clock,
  ShoppingCart
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RequestForm from './RequestForm';
import QuotationForm from './QuotationForm';
import ComparisonMatrix from './ComparisonMatrix';
import axios from 'axios';

export const ProcurementManager: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'requests' | 'tenders' | 'orders'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTender, setSelectedTender] = useState<any>(null);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqs, ts, os] = await Promise.all([
        axios.get('/api/procurement/requests'),
        axios.get('/api/procurement/tenders'),
        axios.get('/api/procurement/orders')
      ]);
      setRequests(reqs.data);
      setTenders(ts.data);
      setOrders(os.data);
    } catch (error) {
      console.error("Failed to fetch procurement data", error);
    }
  };

  const createTender = async (requestId: string) => {
    try {
      await axios.post('/api/procurement/tenders', { requestId });
      fetchData();
    } catch (error) {
      alert("Failed to create tender");
    }
  };

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
        <button 
          onClick={() => setShowRequestModal(true)}
          className="flex items-center justify-center gap-3 bg-[#0F8F7F] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-[#0F8F7F]/20"
        >
          <Plus size={18} />
          {t('create_official_request')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        {[
          { id: 'requests', label: t('requests'), icon: FileText },
          { id: 'tenders', label: t('active_tenders'), icon: Send },
          { id: 'orders', label: t('purchase_order'), icon: ShoppingCart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.id ? 'text-[#0F8F7F]' : 'text-slate-400'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-1 bg-[#0F8F7F] rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {requests.map((req) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex justify-between items-start">
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-slate-900 group-hover:bg-[#0F8F7F]/10 group-hover:text-[#0F8F7F] transition-colors">
                    <FileText size={20} />
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    req.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-tight">{req.projectName}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{req.issuer}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                     <Clock size={12} />
                     {new Date(req.createdAt).toLocaleDateString()}
                   </div>
                   <div className="text-[10px] font-black text-[#0F8F7F] uppercase tracking-widest">
                     {req.items.length} Items
                   </div>
                </div>
                {req.status === 'PENDING' && (
                  <button 
                    onClick={() => createTender(req.id)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    Initiate Official Tender <ArrowRight size={14} />
                  </button>
                )}
              </motion.div>
            ))}
            {requests.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <FileText size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Procurement Requests Initialized</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tenders' && (
           <div className="space-y-4">
             {tenders.map((tender) => (
               <div key={tender.id} className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col lg:flex-row lg:items-center gap-8 justify-between hover:shadow-lg transition-all group">
                 <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-900 group-hover:bg-[#0F8F7F]/10 group-hover:text-[#0F8F7F] transition-colors shrink-0">
                      <Send size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Reference: {tender.tenderNumber}</h4>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Active Tender Panel</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="px-3 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
                          {tender.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">• {tender.items.length} Category Mapped</span>
                      </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { setSelectedTender(tender); setShowQuotationModal(true); }}
                      className="px-8 py-4 bg-slate-50 text-slate-900 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors border border-slate-100"
                    >
                      Receive Bid
                    </button>
                    <button 
                      onClick={() => { setSelectedTender(tender); setShowComparisonModal(true); }}
                      className="px-8 py-4 bg-[#0F8F7F]/10 text-[#0F8F7F] rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-[#0F8F7F] hover:text-white transition-all border border-[#0F8F7F]/20"
                    >
                      Compare & Award
                    </button>
                 </div>
               </div>
             ))}
             {tenders.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Send size={32} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Active Tenders Found</p>
                </div>
             )}
           </div>
        )}

        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {orders.map(order => (
                <div key={order.id} className="bg-white p-10 rounded-[44px] border border-slate-100 shadow-sm space-y-8 group hover:shadow-xl transition-all">
                   <div className="flex justify-between items-center">
                     <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[24px] group-hover:bg-emerald-600 group-hover:text-white transition-colors"><ShoppingCart size={24} /></div>
                     <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">KDRU-WMS-PO</span>
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-[#0F8F7F] uppercase tracking-widest leading-none">{order.poNumber}</h4>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{order.supplierName}</h3>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Clock size={12} />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                   </div>
                   <div className="pt-6 border-t border-dashed border-slate-100">
                      <button className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/20">
                        Print Official PO
                      </button>
                   </div>
                </div>
             ))}
             {orders.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <ShoppingCart size={32} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Purchase Orders Issued</p>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showRequestModal && (
          <RequestForm 
            onClose={() => setShowRequestModal(false)}
            onSuccess={() => { setShowRequestModal(false); fetchData(); }}
          />
        )}
        {showQuotationModal && selectedTender && (
          <QuotationForm 
            tender={selectedTender}
            onClose={() => { setShowQuotationModal(false); setSelectedTender(null); }}
            onSuccess={() => { setShowQuotationModal(false); setSelectedTender(null); fetchData(); }}
          />
        )}
        {showComparisonModal && selectedTender && (
          <ComparisonMatrix 
            tender={selectedTender}
            onClose={() => { setShowComparisonModal(false); setSelectedTender(null); }}
            onSuccess={() => { setShowComparisonModal(false); setSelectedTender(null); fetchData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
