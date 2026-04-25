import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Building2, MapPin } from 'lucide-react';
import axios from 'axios';

interface QuotationFormProps {
  tender: any;
  onClose: () => void;
  onSuccess: () => void;
}

const QuotationForm: React.FC<QuotationFormProps> = ({ tender, onClose, onSuccess }) => {
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [itemPrices, setItemPrices] = useState<any>(
    tender.items.map((item: any) => ({ ...item, unitPrice: 0 }))
  );
  const [loading, setLoading] = useState(false);

  const updatePrice = (index: number, price: number) => {
    const newItems = [...itemPrices];
    newItems[index].unitPrice = price;
    setItemPrices(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/procurement/quotations', {
        tenderId: tender.id,
        supplierName,
        supplierAddress,
        items: itemPrices
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Error submitting quotation");
    } finally {
      setLoading(false);
    }
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
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="relative bg-white w-full max-w-4xl rounded-[44px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bid Reception</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
              Tender: <span className="text-[#0F8F7F]">{tender.tenderNumber}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                   <Building2 size={14} /> Supplier Name
                 </label>
                 <input 
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Enter official vendor name"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-[#0F8F7F]/10 focus:outline-none transition-all"
                 />
              </div>
              <div className="space-y-4">
                 <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                   <MapPin size={14} /> Business Address
                 </label>
                 <input 
                    required
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    placeholder="Physical location"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-[#0F8F7F]/10 focus:outline-none transition-all"
                 />
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Financial Proposal (Unit Prices in AFN)</h3>
              <div className="border border-slate-100 rounded-[32px] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Spec</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemPrices.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 font-black text-slate-900 text-sm">{item.name}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{item.spec}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-600">{item.qty} {item.unit}</td>
                        <td className="px-6 py-4">
                           <input 
                              required
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updatePrice(index, parseFloat(e.target.value))}
                              className="w-24 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-[#0F8F7F]"
                           />
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">
                           {(item.unitPrice * item.qty).toLocaleString()} AFN
                        </td>
                      </tr>
                    ))}
                  </tbody>
                   <tfoot className="bg-slate-50/50">
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</td>
                        <td className="px-6 py-4 text-lg font-black text-slate-900">
                           {itemPrices.reduce((acc: number, item: any) => acc + (item.unitPrice * item.qty), 0).toLocaleString()} AFN
                        </td>
                      </tr>
                   </tfoot>
                </table>
              </div>
           </div>
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
           <button onClick={onClose} className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest">Cancel</button>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20"
           >
             <Save size={16} />
             {loading ? 'Processing...' : 'Register Bid Response'}
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default QuotationForm;
