import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, AlertCircle, CheckCircle2, ShoppingCart } from 'lucide-react';
import axios from 'axios';

interface ComparisonMatrixProps {
  tender: any;
  onClose: () => void;
  onSuccess: () => void;
}

const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({ tender, onClose, onSuccess }) => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await axios.get('/api/procurement/quotations');
      setQuotations(res.data.filter((q: any) => q.tenderId === tender.id));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectWinner = async (quotationId: string) => {
    try {
      await axios.post('/api/procurement/select-winner', { tenderId: tender.id, quotationId });
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error awarding tender");
    }
  };

  const getGrandTotal = (items: any[]) => {
    return items.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white w-full max-w-6xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Standard Comparison Table (Matrix)</h2>
            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">Kandahar University Procurement Evaluation</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-x-auto p-8">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 border-4 border-[#0F8F7F]/20 border-t-[#0F8F7F] rounded-full animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Generating Matrix...</p>
             </div>
           ) : quotations.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">No Bids Received Yet</h3>
                  <p className="text-sm font-medium text-slate-500 max-w-sm">
                    You must register at least three (3) quotation responses before the evaluation board can award this tender.
                  </p>
                </div>
             </div>
           ) : (
             <div className="space-y-8">
                {quotations.length < 3 && (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 text-amber-700">
                     <AlertCircle size={20} />
                     <p className="text-xs font-bold font-mono">WARNING: LEGAL REQUIREMENT - Only {quotations.length}/3 bids received. Minimum 3 required to award.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {quotations.map((q) => (
                      <div 
                        key={q.id} 
                        className={`p-8 rounded-[40px] border-2 transition-all relative overflow-hidden flex flex-col justify-between h-full ${
                          q.isWinner ? 'border-[#0F8F7F] bg-[#0F8F7F]/5 ring-8 ring-[#0F8F7F]/5' : 'border-slate-100 bg-white hover:border-slate-300'
                        }`}
                      >
                         {q.isWinner && (
                           <div className="absolute top-0 right-0 bg-[#0F8F7F] text-white p-4 rounded-bl-[28px]">
                              <Trophy size={20} />
                           </div>
                         )}

                         <div className="space-y-6">
                            <div className="space-y-1">
                               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</h4>
                               <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{q.supplierName}</h3>
                               <p className="text-xs font-medium text-slate-500">{q.supplierAddress}</p>
                            </div>

                            <div className="space-y-3">
                               {q.items.map((item: any, i: number) => (
                                 <div key={i} className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                                    <div className="text-xs font-bold text-slate-600">
                                      {item.name} <span className="text-[10px] text-slate-400 font-medium">({item.qty})</span>
                                    </div>
                                    <div className="text-xs font-black text-slate-900">
                                      {item.unitPrice.toLocaleString()} AFN
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="pt-8 space-y-6">
                            <div className="flex justify-between items-end">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                               <span className="text-2xl font-black text-[#0F8F7F] tracking-tighter">
                                 {getGrandTotal(q.items).toLocaleString()} <span className="text-sm">AFN</span>
                               </span>
                            </div>
                            
                            {!q.isWinner && (
                              <button 
                                onClick={() => selectWinner(q.id)}
                                disabled={quotations.length < 3}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                  quotations.length < 3 
                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20'
                                }`}
                              >
                                {quotations.length < 3 ? 'Incomplete Bidding' : 'Award Tender'}
                              </button>
                            )}

                            {q.isWinner && (
                              <div className="flex items-center justify-center gap-2 py-4 bg-white rounded-2xl text-[#0F8F7F] font-black text-xs uppercase tracking-widest border border-[#0F8F7F]/20">
                                <CheckCircle2 size={16} /> Selected Winner
                              </div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Evaluation Board: N. Qadri, M. Abdullah, G. Hashmi</p>
        </div>
      </motion.div>
    </div>
  );
};

export default ComparisonMatrix;
