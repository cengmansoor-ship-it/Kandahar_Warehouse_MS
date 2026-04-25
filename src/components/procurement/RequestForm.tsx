import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface RequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const RequestForm: React.FC<RequestFormProps> = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [projectName, setProjectName] = useState('');
  const [items, setItems] = useState<any[]>([
    { name: '', spec: '', unit: 'pcs', qty: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { name: '', spec: '', unit: 'pcs', qty: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/procurement/requests', { projectName, items });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Error submitting request");
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
        className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Procurement Request</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">General Warehouse Standard Form</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
           <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Project / Purchase Name</label>
              <input 
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Krypton and Paving for Literature Faculty exterior"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-[#0F8F7F]/20 focus:outline-none transition-all"
              />
           </div>

           <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Items for Acquisition</h3>
                <button type="button" onClick={addItem} className="flex items-center gap-2 text-primary-teal font-black text-xs">
                  <Plus size={16} /> Add More
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 bg-slate-50 p-6 rounded-3xl relative group">
                    <div className="col-span-12 lg:col-span-4 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase">Item Name</label>
                       <input 
                          required
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          placeholder="e.g. Krypton"
                          className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-sm"
                       />
                    </div>
                    <div className="col-span-12 lg:col-span-4 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase">Specifications</label>
                       <input 
                          required
                          value={item.spec}
                          onChange={(e) => updateItem(index, 'spec', e.target.value)}
                          placeholder="Technical description..."
                          className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-sm"
                       />
                    </div>
                    <div className="col-span-6 lg:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase">Unit</label>
                       <select 
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-sm"
                       >
                         <option value="pcs">PCS</option>
                         <option value="m2">m²</option>
                         <option value="kg">KG</option>
                       </select>
                    </div>
                    <div className="col-span-6 lg:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase">Qty</label>
                       <input 
                          required
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value))}
                          className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-sm"
                       />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      className="absolute -top-2 -right-2 p-2 bg-white text-rose-500 rounded-full shadow-md border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
           </div>
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
           <button 
             onClick={onClose}
             className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest"
           >
             Discard
           </button>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="flex items-center gap-2 px-8 py-4 bg-[#0F8F7F] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#0F8F7F]/20 disabled:opacity-50"
           >
             <Save size={16} />
             {loading ? 'Submitting...' : 'Submit Official Request'}
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RequestForm;
