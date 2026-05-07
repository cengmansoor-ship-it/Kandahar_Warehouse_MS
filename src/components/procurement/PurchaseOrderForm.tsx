import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Save, 
  Plus, 
  Trash2,
  CheckCircle,
  FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { EditableField } from './EditableField';
import { DocumentHeader } from './DocumentHeader';
import { ProcurementTable } from './ProcurementTable';
import api from '@/src/services/api';

interface Item {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface POData {
  id?: string;
  requestId: string;
  poNumber: string;
  poDate: string;
  equivalent: string;
  procurementDescription: string;
  entityInfo: {
    name: string;
    address: string;
    email: string;
  };
  handlerInfo: {
    name: string;
    position: string;
    phone: string;
  };
  items: Item[];
  terms: string;
}

export const PurchaseOrderForm = () => {
  const location = useLocation();
  const requestId = location.state?.requestId;
  
  const [formData, setFormData] = useState<POData>({
    requestId: requestId || '',
    poNumber: `PO-${Date.now().toString().slice(-6)}`,
    poDate: new Date().toLocaleDateString(),
    equivalent: '1000',
    procurementDescription: 'General Procurement for Department Needs',
    entityInfo: {
      name: 'Kandahar University Logistics Dept',
      address: 'Kandahar, Afghanistan',
      email: 'logistics@kdru.edu.af'
    },
    handlerInfo: {
      name: 'John Doe',
      position: 'Procurement Specialist',
      phone: '+93 700 000 000'
    },
    items: [
      { id: '1', description: 'Sample Item', quantity: 1, unit: 'Pcs', unitPrice: 0, totalPrice: 0 }
    ],
    terms: '1. Delivery within 15 days.\n2. Payment after inspection.\n3. Goods must match technical specifications.'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docMeta, setDocMeta] = useState({
    poTitle: 'د اخیستلو امر / Purchase Order',
    orderNoLabel: 'د امر شمېره',
    orderDateLabel: 'تاریخ',
    equivalentLabel: 'معادل',
    descLabel: 'د تدارکاتو تشریح (Description)',
    entityInfoTitle: 'تدارکاتي اداره (Purchasing Entity)',
    contractorInfoTitle: 'داوطلب / بریا موندونکی (Bidder/Winner)',
    totalLabel: 'مجموعي قیمت (Total Amount)',
    sealLabel: 'Official Certification Seal Area',
  });

  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestId) {
      fetchPOData();
    }
  }, [requestId]);

  const fetchPOData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/procurement/orders/${requestId}`);
      if (res.data) {
        setFormData({
          ...res.data,
          items: Array.isArray(res.data.items) ? res.data.items : []
        });
      }
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePO = async () => {
    try {
      setSaving(true);
      await api.post('/procurement/orders', formData);
      toast.success("Purchase Order saved successfully");
      
      // Update pipeline progress to 100%
      if (requestId) {
        await api.patch(`/requests/${requestId}`, { progress: 100, status: 'WINNER_SELECTED' });
      }
    } catch (e) {
      toast.error("Failed to save PO");
    } finally {
      setSaving(false);
    }
  };

  const [customColumns, setCustomColumns] = useState<any[]>([]);

  const addColumn = () => {
    let colName = prompt("Enter Column Name");
    // Fallback if prompt is blocked or cancelled in some environments
    if (colName === null) return; 
    if (!colName) colName = `Col ${customColumns.length + 1}`;
    
    setCustomColumns([...customColumns, { header: colName, key: colName.toLowerCase().replace(/\s/g, '_') }]);
    toast.success(`Column "${colName}" added to ledger`);
  };

  const handlePrint = async () => {
    if (!componentRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.outerHTML).join('\n');
    printWindow.document.write(`
      <html dir="rtl">
        <head><title>Purchase Order</title>${styles}<style>@page { size: A4; margin: 15mm; } body { padding: 20px; font-family: sans-serif; }</style></head>
        <body style="background: white !important;">${componentRef.current.innerHTML}<script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    try {
      toast.info("Tip: For best Pashto/Dari text support, use the 'Print' button to Save as PDF.");
      const doc = new jsPDF('p', 'mm', 'a4');
       
      doc.setFontSize(20);
      doc.setTextColor(15, 143, 127);
      doc.text("Kandahar University", 105, 20, { align: 'center' });
      doc.text("Purchase Order", 105, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`PO Number: ${formData.poNumber}`, 14, 45);
      doc.text(`Date: ${formData.poDate}`, 14, 50);
      doc.text(`Description: ${formData.procurementDescription?.substring(0, 50)}...`, 14, 55);

      const tableData = (formData.items || []).map((item, i) => [
        i + 1,
        item.description || '-',
        item.quantity || 0,
        item.unit || '-',
        `${(Number(item.unitPrice) || 0).toLocaleString()} AFN`,
        `${(Number(item.totalPrice) || 0).toLocaleString()} AFN`
      ]);

      const headers = [['#', 'Description', 'Qty', 'Unit', 'Price', 'Total']];

      autoTable(doc, {
        head: headers,
        body: tableData,
        startY: 65,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 143, 127], textColor: [255, 255, 255] }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Grand Total: ${grandTotal.toLocaleString()} AFN`, 140, finalY + 10);

      doc.save(`PO-${formData.poNumber || 'Draft'}.pdf`);
      toast.success("Purchase Order PDF exported");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF. Check console for details.");
    }
  };

  const addItem = () => {
    const newItem: Item = { id: Date.now().toString(), description: '', quantity: 1, unit: 'Pcs', unitPrice: 0, totalPrice: 0 };
    setFormData({ ...formData, items: [...(formData.items || []), newItem] });
  };

  const removeItem = (idx: number) => {
    const next = (formData.items || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, items: next });
  };

  const updateItem = (idx: number, field: keyof Item, val: any) => {
    const next = [...(formData.items || [])];
    (next[idx] as any)[field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      next[idx].totalPrice = (next[idx].quantity || 0) * (next[idx].unitPrice || 0);
    }
    setFormData({ ...formData, items: next });
  };

  const grandTotal = (formData.items || []).reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);

  const columns = React.useMemo(() => [
    { header: 'No', key: 'id', width: '40px', align: 'center' as const, render: (_: any, i: number) => i + 1 },
    { 
      header: 'Description', 
      key: 'description', 
      render: (row: Item, i: number) => (
        <input value={row.description} onChange={(e) => updateItem(i, 'description', e.target.value)} className="w-full bg-transparent border-0 font-black focus:ring-0" />
      )
    },
    { 
      header: 'Qty', 
      key: 'quantity', 
      width: '60px', 
      align: 'center' as const,
      render: (row: Item, i: number) => (
        <input type="number" value={row.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value) || 0)} className="w-full bg-transparent border-0 font-black text-center focus:ring-0" />
      )
    },
    { 
      header: 'Unit', 
      key: 'unit', 
      width: '60px', 
      align: 'center' as const,
      render: (row: Item, i: number) => (
        <input value={row.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} className="w-full bg-transparent border-0 font-black text-center focus:ring-0" />
      )
    },
    { 
      header: 'Unit Price', 
      key: 'unitPrice', 
      width: '100px', 
      align: 'center' as const,
      render: (row: Item, i: number) => (
        <input type="number" value={row.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value) || 0)} className="w-full bg-transparent border-0 font-black text-center focus:ring-0" />
      )
    },
    { 
      header: 'Total', 
      key: 'totalPrice', 
      width: '120px', 
      align: 'center' as const,
      render: (row: Item) => (Number(row.totalPrice) || 0).toLocaleString()
    },
    ...customColumns.map(cc => ({
      header: cc.header,
      key: cc.key,
      width: '100px',
      render: (row: any, idx: number) => (
        <input 
          value={row[cc.key] || ''} 
          onChange={(e) => {
             const next = [...(formData.items || [])];
             (next[idx] as any)[cc.key] = e.target.value;
             setFormData({...formData, items: next});
          }}
          className="w-full bg-transparent border-0 font-black text-center focus:ring-0"
        />
      )
    })),
    {
      header: '',
      key: 'actions',
      width: '40px',
      render: (_: any, idx: number) => (
        <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-1 no-print transition-colors"><Trash2 size={14} /></button>
      )
    }
  ], [formData.items, customColumns]);

  return (
    <div className="flex flex-col items-center gap-6 p-4 text-right" dir="rtl">
      <div 
        ref={componentRef}
        className="relative a4-page font-sans text-slate-900 border-2 border-slate-900 bg-white shadow-2xl overflow-hidden"
      >

        <div className="p-12">
          <div className="flex justify-between items-center mb-8 no-print border-b border-slate-100 pb-4">
             <div className="flex items-center gap-2">
               <button onClick={handlePrint} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-black/10">
                 <Printer size={16} /> Print
               </button>
               <button onClick={handleDownloadPDF} className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-rose-600/10">
                 <Download size={16} /> Export PDF
               </button>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={addColumn} className="p-2 bg-slate-100 text-slate-900 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4">
                  <Plus size={16} /> Add Column
                </button>
                <button onClick={addItem} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-emerald-500/10">
                  <Plus size={16} /> Add Row
                </button>
                <button onClick={handleSavePO} disabled={saving} className="p-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-sky-600/10 disabled:opacity-50">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save & Complete'}
                </button>
             </div>
          </div>
          
          <DocumentHeader 
            title={
              <EditableField value={docMeta.poTitle} onSave={(v) => setDocMeta({...docMeta, poTitle: v})} className="text-center font-black" />
            } 
            projectTitle={
              <EditableField value={formData.procurementDescription?.split('\n')[0] || 'Official Purchase Order'} onSave={() => {}} placeholder="Short PO Title..." className="text-center font-black italic" />
            } 
          />

          <div className="text-[11px] mb-8 border-b-4 border-slate-900 pb-2 font-black bg-white">
             <table className="w-full border-collapse">
               <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 text-slate-400 font-black uppercase text-[10px] text-start border-l border-slate-100"><EditableField value={docMeta.orderNoLabel} onSave={(v) => setDocMeta({...docMeta, orderNoLabel: v})} /></td>
                    <td className="p-3 w-[200px] border-l border-slate-100"><input value={formData.poNumber} onChange={(e) => setFormData({...formData, poNumber: e.target.value})} className="w-full bg-transparent border-b border-slate-900 outline-none font-black text-center" /></td>
                    <td className="p-3 text-slate-400 font-black uppercase text-[10px] flex items-center justify-start gap-2 pr-4 min-w-[120px] text-start border-l border-slate-100">
                      <EditableField value={docMeta.equivalentLabel} onSave={(v) => setDocMeta({...docMeta, equivalentLabel: v})} />:
                    </td>
                    <td className="p-3 w-[200px]"><input value={formData.equivalent} onChange={(e) => setFormData({...formData, equivalent: e.target.value})} className="w-full bg-transparent border-b border-slate-900 outline-none font-black text-center" /></td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 text-slate-400 font-black uppercase text-[10px] text-start border-l border-slate-100"><EditableField value={docMeta.orderDateLabel} onSave={(v) => setDocMeta({...docMeta, orderDateLabel: v})} /></td>
                    <td className="p-3 w-[200px] border-l border-slate-100"><input value={formData.poDate} onChange={(e) => setFormData({...formData, poDate: e.target.value})} className="w-full bg-transparent border-b border-slate-100 outline-none font-black text-center" /></td>
                    <td className="p-3 text-slate-400 font-black uppercase text-[10px] flex items-center justify-start gap-2 pr-4 min-w-[120px] text-start border-l border-slate-100">
                       <EditableField value={docMeta.descLabel} onSave={(v) => setDocMeta({...docMeta, descLabel: v})} />:
                    </td>
                    <td className="p-3 w-[200px]"><input value={formData.procurementDescription} onChange={(e) => setFormData({...formData, procurementDescription: e.target.value})} className="w-full bg-transparent border-b border-slate-100 outline-none font-black text-center" /></td>
                  </tr>
               </tbody>
             </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10 text-[12px]">
             <div className="border-2 border-slate-900 p-6 rounded-2xl space-y-4 bg-white shadow-md">
                <h4 className="border-b-2 border-slate-900 pb-3 mb-4 bg-white text-black font-black text-center">
                  <EditableField value={docMeta.entityInfoTitle} onSave={(v) => setDocMeta({...docMeta, entityInfoTitle: v})} className="font-black uppercase tracking-widest" />
                </h4>
                <div className="space-y-3 font-black text-start">
                  <div className="flex justify-between items-center"><span>اداري نوم:</span> <input value={formData.entityInfo?.name} onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, name: e.target.value}})} className="bg-transparent border-b border-slate-200 flex-1 ml-4 text-left px-2" /></div>
                  <div className="flex justify-between items-center"><span>ادرس:</span> <input value={formData.entityInfo?.address} onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, address: e.target.value}})} className="bg-transparent border-b border-slate-200 flex-1 ml-4 text-left px-2" /></div>
                  <div dir="ltr" className="flex justify-between items-center"><span>Email:</span> <input value={formData.entityInfo?.email} onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, email: e.target.value}})} className="bg-transparent border-b border-slate-200 flex-1 ml-4 text-right px-2" /></div>
                </div>
             </div>
             <div className="border-2 border-slate-900 p-6 rounded-2xl space-y-4 bg-white shadow-md">
                <h4 className="border-b-2 border-slate-900 pb-3 mb-4 font-black text-center bg-white text-black uppercase tracking-widest">
                  <EditableField value={docMeta.contractorInfoTitle} onSave={(v) => setDocMeta({...docMeta, contractorInfoTitle: v})} className="font-black" />
                </h4>
                <div className="space-y-3 font-black text-start">
                  <div className="flex justify-between items-center"><span>اجرا کوونکی:</span> <input value={formData.handlerInfo?.name} onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, name: e.target.value}})} className="bg-transparent border-b border-slate-200 flex-1 ml-4 text-left px-2" /></div>
                  <div className="flex justify-between items-center"><span>وظیفه:</span> <input value={formData.handlerInfo?.position} onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, position: e.target.value}})} className="bg-transparent border-b border-slate-200 flex-1 ml-4 text-left px-2" /></div>
                  <div className="flex justify-between items-center"><span>شمېره:</span> <input value={formData.handlerInfo?.phone} onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, phone: e.target.value}})} className="bg-transparent border-b border-slate-200 flex-1 ml-4 text-left px-2" /></div>
                </div>
             </div>
          </div>

          <ProcurementTable columns={columns} data={formData.items || []} />

          <div className="flex justify-between items-center border-4 border-slate-900 p-6 mt-6 mb-10 bg-white text-black font-black rounded-2xl shadow-xl">
             <EditableField value={docMeta.totalLabel} onSave={(v) => setDocMeta({...docMeta, totalLabel: v})} className="text-lg uppercase tracking-widest" isEditable={true} />
             <div className="flex items-center gap-8">
               <span className="text-2xl underline decoration-double underline-offset-8 font-black">{(Number(grandTotal) || 0).toLocaleString()} Afg</span>
             </div>
          </div>

          <div className="text-[12px] mb-12 italic border-r-8 border-[#0F8F7F] pr-8 py-6 bg-white border-2 border-slate-900 rounded-2xl font-black text-right leading-relaxed shadow-sm">
             <textarea value={formData.terms} onChange={(e) => setFormData({...formData, terms: e.target.value})} className="w-full bg-transparent border-0 focus:ring-0 h-24 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-x-20 gap-y-16 text-[14px] font-black mt-20">
              <div className="space-y-12 text-start">
                <div className="flex items-center gap-2">نرخ ورکوونکی: <input value={formData.handlerInfo?.name} readOnly className="border-b-2 border-slate-900 bg-transparent flex-1 px-2" /></div>
                <div className="h-0.5 border-b-2 border-dashed border-slate-300"></div>
                <div className="flex items-center gap-2">تاریخ: <input value={formData.poDate} readOnly className="border-b-2 border-slate-900 bg-transparent flex-1 px-2" /></div>
              </div>
              <div className="space-y-12 text-start">
                <div className="flex items-center gap-2">تدارکاتو عمومي مدیر: <input value="تدارکاتو مدیر" readOnly className="border-b-2 border-slate-900 bg-transparent flex-1 px-2" /></div>
                <div className="h-0.5 border-b-2 border-dashed border-slate-300"></div>
                <div className="flex items-center gap-2">تاریخ: <input value={formData.poDate} readOnly className="border-b-2 border-slate-900 bg-transparent flex-1 px-2" /></div>
              </div>
          </div>

          <div className="mt-24 space-y-8">
             <div className="text-center font-black border-4 border-slate-900 py-6 uppercase tracking-[0.3em] bg-slate-50 rounded-2xl text-sm text-slate-400">
                <EditableField value={docMeta.sealLabel} onSave={(v) => setDocMeta({...docMeta, sealLabel: v})} isEditable={true} />
             </div>
          </div>
        </div>

        <div className="mt-auto p-8 text-[10px] text-slate-500 text-center border-t-2 border-slate-900 flex justify-between uppercase font-black bg-slate-50">
          <span>Official Procurement Hub • Kandahar University Digital Hub</span>
          <span className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-600" /> System Logged & Verified ID: PO-{formData.id?.slice(-6) || 'NEW'}</span>
        </div>
      </div>
    </div>
  );
};
