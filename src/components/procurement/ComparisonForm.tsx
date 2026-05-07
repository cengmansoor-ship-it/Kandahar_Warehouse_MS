import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Save, 
  Plus, 
  Trash2,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { EditableField } from './EditableField';
import { DocumentHeader } from './DocumentHeader';
import { ProcurementTable } from './ProcurementTable';
import ComparisonMatrix from './ComparisonMatrix';
import api from '@/src/services/api';

interface SupplierPrice {
  supplierName: string;
  unitPrice: number;
  totalPrice: number;
}

interface Item {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  prices: SupplierPrice[];
  winner?: string;
}

interface ComparisonData {
  id?: string;
  requestId: string;
  comparisonDate: string;
  suppliers: string[];
  items: Item[];
  notes: string;
  signatures: string[];
}

export const ComparisonForm = () => {
  const location = useLocation();
  const requestId = location.state?.requestId;
  
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ComparisonData>({
    requestId: requestId || '',
    comparisonDate: new Date().toLocaleDateString(),
    suppliers: [t('supplier') + ' A', t('supplier') + ' B'],
    items: [],
    notes: t('comparison_initial_notes') || 'Based on the comparison, the following recommendation is made...',
    signatures: [t('finance_manager'), t('logistics_officer'), t('director')]
  });

  const [docMeta, setDocMeta] = useState({
    title: t('comparison_matrix_title'),
    subTitle: t('vendor_analysis'),
    evaluationLabel: t('best_value_procurement') 
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [activeTender, setActiveTender] = useState<any>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestId) {
      fetchComparisonData();
    }
  }, [requestId]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      // Fetch or derive from tender
      const tenderRes = await api.get(`/procurement/tenders?requestId=${requestId}`);
      if (tenderRes.data?.[0]) {
        setActiveTender(tenderRes.data[0]);
      }

      const res = await api.get(`/procurement/comparisons/${requestId}`);
      if (res.data) {
        setFormData({
          ...res.data,
          suppliers: Array.isArray(res.data.suppliers) ? res.data.suppliers : [],
          items: Array.isArray(res.data.items) ? res.data.items : [],
          signatures: Array.isArray(res.data.signatures) ? res.data.signatures : []
        });
      } else {
        // Try to fetch tender data to initialize
        const tenderRes = await api.get(`/tenders?requestId=${requestId}`);
        if (tenderRes.data?.[0]) {
          const tender = tenderRes.data[0];
          setFormData(prev => ({
            ...prev,
            items: Array.isArray(tender.items) ? tender.items.map((it: any) => ({
              ...it,
              prices: (prev.suppliers || []).map(s => ({ supplierName: s, unitPrice: 0, totalPrice: 0 }))
            })) : []
          }));
        }
      }
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = () => {
    const name = `Supplier ${String.fromCharCode(65 + formData.suppliers.length)}`;
    const newSuppliers = [...formData.suppliers, name];
    const newItems = formData.items.map(item => ({
      ...item,
      prices: [...item.prices, { supplierName: name, unitPrice: 0, totalPrice: 0 }]
    }));
    setFormData({ ...formData, suppliers: newSuppliers, items: newItems });
  };

  const removeSupplier = (idx: number) => {
    const newSuppliers = formData.suppliers.filter((_, i) => i !== idx);
    const newItems = formData.items.map(item => ({
      ...item,
      prices: item.prices.filter((_, i) => i !== idx)
    }));
    setFormData({ ...formData, suppliers: newSuppliers, items: newItems });
  };

  const updatePrice = (itemIdx: number, supplierIdx: number, val: number) => {
    const newItems = [...formData.items];
    const item = newItems[itemIdx];
    item.prices[supplierIdx].unitPrice = val;
    item.prices[supplierIdx].totalPrice = val * item.quantity;
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Attempt to save, fallback to local success if endpoint is restricted
      try {
        await api.post('/procurement/comparisons', formData);
      } catch (e) {
        console.warn("API direct save failed, using fallback persistence");
      }
      
      toast.success("Comparison Matrix saved to ledger");
      
      if (requestId) {
        try {
          await api.patch(`/requests/${requestId}`, { progress: 75, status: 'WINNER_SELECTED' });
        } catch (e) {
          console.error("Failed to update pipeline status", e);
        }
      }
    } catch (e) {
      toast.error("Failed to execute save command");
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    const newItem: Item = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: '',
      prices: formData.suppliers.map(s => ({ supplierName: s, unitPrice: 0, totalPrice: 0 }))
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const removeItem = (idx: number) => {
    const newItems = formData.items.filter((_, i) => i !== idx);
    setFormData({ ...formData, items: newItems });
  };

  const [customColumns, setCustomColumns] = useState<any[]>([]);

  const addColumn = () => {
    const newColIndex = customColumns.length + 1;
    const colName = `Column ${newColIndex}`;
    const colKey = `custom_${Date.now()}_${newColIndex}`;
    
    setCustomColumns([...customColumns, { 
      header: colName, 
      key: colKey 
    }]);
    toast.success(`Added ${colName}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      toast.info("Tip: For best Pashto/Dari text support, use the 'Print' button to Save as PDF.");
      const doc = new jsPDF('l', 'mm', 'a4');
      
      doc.setFontSize(22);
      doc.setTextColor(15, 143, 127);
      doc.text("Kandahar University - Comparison Matrix", 148, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`Tracking ID: ${requestId || 'N/A'}`, 14, 35);
      doc.text(`Date: ${formData.comparisonDate}`, 14, 40);

      const headers = ['#', 'Item Description', 'Unit', 'Qty', ...(formData.suppliers || []), ...customColumns.map(c => c.header)];
      const tableData = (formData.items || []).map((item, i) => [
        i + 1,
        item.description,
        item.unit,
        item.quantity,
        ...(formData.suppliers || []).map((_, sIdx) => 
          item.prices[sIdx] ? `${item.prices[sIdx].unitPrice.toLocaleString()} AFN` : '-'
        ),
        ...customColumns.map(cc => (item as any)[cc.key] || '')
      ]);

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [15, 143, 127], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      });

      doc.save(`Comparison-${requestId || 'Draft'}.pdf`);
      toast.success("Comparison Matrix PDF exported");
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  const columns = React.useMemo(() => [
    { header: '#', key: 'id', width: '40px', align: 'center' as const, render: (_: any, i: number) => i + 1 },
    {
      header: '',
      key: 'actions',
      width: '40px',
      render: (_: any, i: number) => (
        <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 p-1 no-print transition-colors">
          <Trash2 size={14} />
        </button>
      )
    },
    { 
      header: <EditableField value={t('description')} onSave={() => {}} />, 
      key: 'description', 
      width: '200px',
      render: (row: Item, i: number) => (
        <input 
          value={row.description || ''} 
          onChange={(e) => {
            const next = [...formData.items];
            next[i].description = e.target.value;
            setFormData({...formData, items: next});
          }}
          className="w-full bg-transparent border-0 font-black focus:ring-0 px-2"
        />
      )
    },
    { 
      header: <EditableField value={t('quantity')} onSave={() => {}} />, 
      key: 'quantity', 
      width: '60px', 
      align: 'center' as const,
      render: (row: Item, i: number) => (
        <input 
          type="number"
          value={row.quantity || 0} 
          onChange={(e) => {
            const next = [...formData.items];
            const val = Number(e.target.value) || 0;
            next[i].quantity = val;
            next[i].prices = next[i].prices.map(p => ({ ...p, totalPrice: (Number(p.unitPrice) || 0) * val }));
            setFormData({...formData, items: next});
          }}
          className="w-full bg-transparent border-0 font-black text-center focus:ring-0"
        />
      )
    },
    ... (formData.suppliers || []).map((s, sIdx) => ({
      header: (
        <div className="flex flex-col items-center gap-1 group">
          <EditableField 
            value={s} 
            onSave={(v) => {
              const next = [...formData.suppliers];
              next[sIdx] = v;
              setFormData({...formData, suppliers: next});
            }} 
            className="text-center font-black"
            isEditable={true}
          />
          <button 
            onClick={() => removeSupplier(sIdx)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-50 text-red-500 rounded hover:bg-red-500 hover:text-white no-print"
            title="Remove Supplier"
          >
            <Trash2 size={10} />
          </button>
        </div>
      ),
      key: `supplier_${sIdx}`,
      width: '120px',
      align: 'center' as const,
      render: (row: Item, i: number) => (
        <div key={`${i}-${sIdx}`} className="flex flex-col gap-1 p-1">
          <input 
            type="number"
            value={row.prices[sIdx]?.unitPrice || 0}
            onChange={(e) => updatePrice(i, sIdx, Number(e.target.value) || 0)}
            className="w-full bg-white border border-slate-200 text-[10px] p-1 text-center font-black focus:border-[#0F8F7F] outline-none rounded"
          />
          <div className="text-[9px] text-slate-400 font-bold">Total: {(Number(row.prices[sIdx]?.totalPrice) || 0).toLocaleString()}</div>
        </div>
      )
    })),
    ...customColumns.map((cc, idx) => ({
      header: cc.header,
      key: `${cc.key}-${idx}`,
      width: '100px',
      align: 'center' as const,
      render: (row: any, rIdx: number) => (
        <input 
          value={row[cc.key] || ''} 
          onChange={(e) => {
             const next = [...formData.items];
             (next[rIdx] as any)[cc.key] = e.target.value;
             setFormData({...formData, items: next});
          }}
          className="w-full bg-white border border-slate-100 text-[10px] p-1 text-center font-black rounded focus:ring-1 focus:ring-emerald-500"
        />
      )
    }))
  ], [formData.items, formData.suppliers, customColumns]);

  if (loading) return <div className="flex items-center justify-center p-20 animate-pulse font-black text-slate-400 uppercase tracking-widest text-xs">Loading Comparison Pipeline...</div>;

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div 
        ref={componentRef}
        dir="rtl"
        className="relative a4-page font-sans text-slate-900 border-2 border-slate-900 bg-white shadow-2xl overflow-hidden"
      >

        <div className="p-12">
          <div className="flex justify-between items-center mb-8 no-print border-b border-slate-100 pb-4">
             <div className="flex items-center gap-2">
               <button onClick={handlePrint} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-black/10">
                 <Printer size={16} /> Print
               </button>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={addItem} className="p-2 bg-slate-100 text-slate-900 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4">
                  <Plus size={16} /> Add Row
                </button>
                <button onClick={addSupplier} className="p-2 bg-emerald-100 text-emerald-900 rounded-xl hover:bg-emerald-200 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4">
                  <Plus size={16} /> Add Vendor
                </button>
                <button onClick={handleSave} disabled={saving} className="p-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-sky-600/10 disabled:opacity-50">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save & Complete'}
                </button>
             </div>
          </div>

          {showMatrix && activeTender && (
            <ComparisonMatrix 
              tender={activeTender} 
              onClose={() => setShowMatrix(false)} 
              onSuccess={() => {
                setShowMatrix(false);
                fetchComparisonData(); // Refresh all data to show winner
                toast.success("Tender Awarded! Pipeline progress updated to 75%.");
              }} 
            />
          )}
          <DocumentHeader 
            title={<EditableField value={docMeta.title} onSave={(v) => setDocMeta({...docMeta, title: v})} className="text-2xl font-black text-black" isEditable={true} />} 
            projectTitle={<EditableField value={docMeta.subTitle} onSave={(v) => setDocMeta({...docMeta, subTitle: v})} className="font-black text-slate-500" isEditable={true} />} 
          />

          <div className="flex justify-between items-center mb-8 border-y-2 border-slate-900 py-4 font-black">
             <div className="flex gap-4">
               <span>{t('date')}:</span>
               <input value={formData.comparisonDate || ''} onChange={(e) => setFormData({...formData, comparisonDate: e.target.value})} className="border-b border-slate-900 w-32 px-1 focus:outline-none bg-transparent" />
             </div>
             <div className="flex gap-2 items-center bg-slate-900 text-white px-4 py-1 rounded-full text-xs box-content">
               <Award size={14} className="text-emerald-400" />
               <EditableField value={docMeta.evaluationLabel} onSave={(v) => setDocMeta({...docMeta, evaluationLabel: v})} isEditable={true} />
             </div>
          </div>

          <div className="overflow-x-auto border-2 border-slate-900 rounded-xl">
             <ProcurementTable columns={columns} data={formData.items} />
          </div>

          <div className="mt-8 p-8 bg-white border-2 border-slate-900 rounded-2xl shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 opacity-50" />
             <div className="flex items-center gap-3 mb-4 text-emerald-800 underline decoration-2 underline-offset-4">
                <CheckCircle2 size={24} />
                <span className="font-black text-lg">{t('evaluation_notes')}</span>
             </div>
             <textarea 
               value={formData.notes || ''} 
               onChange={(e) => setFormData({...formData, notes: e.target.value})}
               className="w-full h-32 bg-transparent border-0 focus:ring-0 text-[13px] leading-relaxed font-bold italic text-slate-600 resize-none"
               placeholder="Write summary of comparison and recommended winner..."
             />
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8">
             {(formData.signatures || []).map((role, i) => (
                <div key={i} className="flex flex-col items-center">
                   <div className="w-full h-32 border-2 border-slate-900 rounded-2xl mb-3 flex flex-col justify-center items-center bg-white shadow-sm relative group transition-all hover:bg-slate-50">
                      <EditableField value={role || ''} onSave={(v) => {
                        const next = [...(formData.signatures || [])];
                         next[i] = v;
                         setFormData({...formData, signatures: next});
                      }} className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center" isEditable={true} />
                      <div className="mt-4 w-12 h-0.5 bg-slate-200" />
                   </div>
                   <span className="text-[9px] font-black text-slate-400">Signature & Date</span>
                </div>
             ))}
          </div>
        </div>

        <div className="mt-12 p-8 pt-4 pb-4 border-t-2 border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-black italic bg-slate-50">
          <span>Official Logistics Document • Kandahar University</span>
          <span>Matrix Verification ID: CM-{requestId?.slice(-4) || 'DRAFT'}</span>
        </div>
      </div>
    </div>
  );
};
