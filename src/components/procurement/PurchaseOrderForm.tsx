import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import { openPrintWindow } from '@/src/lib/print-utils';
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
  
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ps';

  const [formData, setFormData] = useState<POData>({
    requestId: requestId || '',
    poNumber: `PO-${Date.now().toString().slice(-6)}`,
    poDate: new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fa-AF'),
    equivalent: '1000',
    procurementDescription: t('procurement_description_initial'),
    entityInfo: {
      name: t('kandahar_univ') + ' ' + t('logistics_dept'),
      address: t('kandahar_address'),
      email: 'logistics@kdru.edu.af'
    },
    handlerInfo: {
      name: '',
      position: t('job_title'),
      phone: '+93 '
    },
    items: [
      { id: '1', description: t('sample_item'), quantity: 1, unit: t('pcs'), unitPrice: 0, totalPrice: 0 }
    ],
    terms: t('delivery_terms_default')
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docMeta, setDocMeta] = useState({
    poTitle: t('purchase_order'),
    orderNoLabel: t('order_number'),
    orderDateLabel: t('date'),
    equivalentLabel: t('equivalent'),
    descLabel: t('description'),
    entityInfoTitle: t('purchasing_entity'),
    contractorInfoTitle: t('bidder_winner'),
    totalLabel: t('total_amount'),
    sealLabel: t('seal_area'),
  });

  useEffect(() => {
    setDocMeta({
      poTitle: t('purchase_order'),
      orderNoLabel: t('order_number'),
      orderDateLabel: t('date'),
      equivalentLabel: t('equivalent'),
      descLabel: t('description'),
      entityInfoTitle: t('purchasing_entity'),
      contractorInfoTitle: t('bidder_winner'),
      totalLabel: t('total_amount'),
      sealLabel: t('seal_area'),
    });
    setFormData(prev => ({
      ...prev,
      poDate: new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fa-AF'),
      procurementDescription: prev.procurementDescription?.startsWith('Official') ? t('procurement_description_initial') : prev.procurementDescription,
      terms: prev.terms?.startsWith('All items') ? t('delivery_terms_default') : prev.terms
    }));
  }, [i18n.language, t]);

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
    const title = `${t('purchase_order')} - ${formData.poNumber || 'Draft'}`;
    const uniLogo = localStorage.getItem('doc_logo_university') || "https://upload.wikimedia.org/wikipedia/en/2/23/Kandahar_University_Logo.png";
    const govLogo = localStorage.getItem('doc_logo_ministry') || "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_the_Taliban.svg/1024px-Flag_of_the_Taliban.svg.png";

    const content = `
      <table class="header-table">
        <tr>
          <td width="20%"><img src="${uniLogo}" class="logo" /></td>
          <td width="60%" class="header-text">
            <div style="font-size: 16px;">د افغانستان اسلامي امارت</div>
            <div style="font-size: 14px;">د لوړو زده کړو وزارت</div>
            <div style="font-size: 14px;">کندهار پوهنتون</div>
            <div style="font-size: 18px; margin-top: 10px; color: #0F8F7F;">${t('purchase_order').toUpperCase()}</div>
          </td>
          <td width="20%" style="text-align: right;"><img src="${govLogo}" class="logo" /></td>
        </tr>
      </table>
      <div id="print-content">
        ${document.querySelector('.purchase-order-content')?.innerHTML || 'No content found'}
      </div>
    `;

    const styles = `
      .header-table { width: 100%; border-bottom: 2px solid #000; margin-bottom: 30px; padding-bottom: 20px; }
      .header-text { text-align: center; font-weight: 900; }
      .logo { width: 80px; height: 80px; object-fit: contain; }
      body { font-family: 'Inter', sans-serif; background: #fff; }
      @media print {
        .no-print { display: none !important; }
        body { background: white; padding: 0 !important; margin: 15mm; }
        .fintech-card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; page-break-inside: avoid; }
      }
    `;

    openPrintWindow(title, content, styles);
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
        `${(Number(item.totalPrice) || 0).toLocaleString()} AFN`,
        ...customColumns.map(cc => (item as any)[cc.key] || '')
      ]);

      const headers = [['#', 'Description', 'Qty', 'Unit', 'Price', 'Total', ...customColumns.map(c => c.header)]];

      autoTable(doc, {
        head: headers,
        body: tableData,
        startY: 65,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1 },
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
    { header: t('number') || 'No', key: 'id', width: '40px', align: 'center' as const, render: (_: any, i: number) => i + 1 },
    { 
      header: t('description'), 
      key: 'description', 
      render: (row: Item, i: number) => (
        <input value={row.description || ''} onChange={(e) => updateItem(i, 'description', e.target.value)} className="w-full bg-transparent border-0 font-black focus:ring-0" />
      )
    },
    { 
      header: t('quantity'), 
      key: 'quantity', 
      width: '60px', 
      align: 'center' as const,
      render: (row: Item, i: number) => (
        <input type="number" value={row.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value) || 0)} className="w-full bg-transparent border-0 font-black text-center focus:ring-0" />
      )
    },
    { 
      header: t('unit'), 
      key: 'unit', 
      width: '60px', 
      align: 'center' as const,
      render: (row: Item, i: number) => (
        <input value={row.unit || ''} onChange={(e) => updateItem(i, 'unit', e.target.value)} className="w-full bg-transparent border-0 font-black text-center focus:ring-0" />
      )
    },
    { 
      header: t('unit_price'), 
      key: 'unitPrice', 
      width: '100px', 
      align: 'center' as const,
      render: (row: Item, i: number) => (
        <input type="number" value={row.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value) || 0)} className="w-full bg-transparent border-0 font-black text-center focus:ring-0" />
      )
    },
    { 
      header: t('total_price'), 
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
    <div className={`flex flex-col items-center gap-6 p-4 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div 
        ref={componentRef}
        className="relative a4-page font-sans text-slate-900 border-2 border-slate-900 bg-white shadow-2xl overflow-hidden"
      >

        <div className="p-12 purchase-order-content">
          <div className="flex justify-between items-center mb-8 no-print border-b border-slate-100 pb-4">
             <div className="flex items-center gap-2">
               <button 
                 onClick={handlePrint} 
                 className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-black/10"
               >
                 <Printer size={16} /> {t('print')}
               </button>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={addColumn} className="p-2 bg-slate-100 text-slate-900 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4">
                  <Plus size={16} /> {t('add_column')}
                </button>
                <button onClick={addItem} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-emerald-500/10">
                  <Plus size={16} /> {t('add_row')}
                </button>
                <button onClick={handleSavePO} disabled={saving} className="p-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-sky-600/10 disabled:opacity-50">
                  <Save size={16} /> {saving ? t('saving') : t('save_complete')}
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

          <div className={`text-[11px] mb-8 border-b-4 border-slate-900 pb-2 font-black bg-white ${isRtl ? 'text-right' : 'text-left'}`}>
             <table className="w-full border-collapse">
               <tbody>
                  <tr className="border-b border-slate-100">
                    <td className={`p-3 text-slate-400 font-black uppercase text-[10px] border-l border-slate-100 ${isRtl ? 'text-start' : 'text-left'}`}><EditableField value={docMeta.orderNoLabel} onSave={(v) => setDocMeta({...docMeta, orderNoLabel: v})} /></td>
                    <td className="p-3 w-[200px] border-l border-slate-100"><input value={formData.poNumber || ''} onChange={(e) => setFormData({...formData, poNumber: e.target.value})} className="w-full bg-transparent border-b border-slate-900 outline-none font-black text-center" /></td>
                    <td className={`p-3 text-slate-400 font-black uppercase text-[10px] flex items-center pr-4 min-w-[120px] border-l border-slate-100 ${isRtl ? 'justify-start text-start' : 'justify-end text-right'}`}>
                      <EditableField value={docMeta.equivalentLabel || ''} onSave={(v) => setDocMeta({...docMeta, equivalentLabel: v})} />:
                    </td>
                    <td className="p-3 w-[200px]"><input value={formData.equivalent || ''} onChange={(e) => setFormData({...formData, equivalent: e.target.value})} className="w-full bg-transparent border-b border-slate-900 outline-none font-black text-center" /></td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className={`p-3 text-slate-400 font-black uppercase text-[10px] border-l border-slate-100 ${isRtl ? 'text-start' : 'text-left'}`}><EditableField value={docMeta.orderDateLabel} onSave={(v) => setDocMeta({...docMeta, orderDateLabel: v})} /></td>
                    <td className="p-3 w-[200px] border-l border-slate-100"><input value={formData.poDate || ''} onChange={(e) => setFormData({...formData, poDate: e.target.value})} className="w-full bg-transparent border-b border-slate-900 outline-none font-black text-center" /></td>
                    <td className={`p-3 text-slate-400 font-black uppercase text-[10px] flex items-center pr-4 min-w-[120px] border-l border-slate-100 ${isRtl ? 'justify-start text-start' : 'justify-end text-right'}`}>
                       <EditableField value={docMeta.descLabel || ''} onSave={(v) => setDocMeta({...docMeta, descLabel: v})} />:
                    </td>
                    <td className="p-3 w-[200px]"><input value={formData.procurementDescription || ''} onChange={(e) => setFormData({...formData, procurementDescription: e.target.value})} className="w-full bg-transparent border-b border-slate-100 outline-none font-black text-center" /></td>
                  </tr>
               </tbody>
             </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10 text-[12px]">
             <div className="border-2 border-slate-900 p-6 rounded-2xl space-y-4 bg-white shadow-md">
                <h4 className="border-b-2 border-slate-900 pb-3 mb-4 bg-white text-black font-black text-center">
                  <EditableField value={docMeta.entityInfoTitle} onSave={(v) => setDocMeta({...docMeta, entityInfoTitle: v})} className="font-black uppercase tracking-widest" />
                </h4>
                 <div className={`space-y-3 font-black ${isRtl ? 'text-start' : 'text-left'}`}>
                   <div className="flex justify-between items-center"><span>{t('admin_name')}:</span> <input value={formData.entityInfo?.name || ''} onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, name: e.target.value}})} className={`bg-transparent border-b border-slate-200 flex-1 px-2 ${isRtl ? 'ml-4 text-left' : 'mr-4 text-right'}`} /></div>
                   <div className="flex justify-between items-center"><span>{t('address')}:</span> <input value={formData.entityInfo?.address || ''} onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, address: e.target.value}})} className={`bg-transparent border-b border-slate-200 flex-1 px-2 ${isRtl ? 'ml-4 text-left' : 'mr-4 text-right'}`} /></div>
                   <div dir="ltr" className="flex justify-between items-center"><span>Email:</span> <input value={formData.entityInfo?.email || ''} onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, email: e.target.value}})} className="bg-transparent border-b border-slate-200 flex-1 ml-4 text-right px-2" /></div>
                 </div>
             </div>
             <div className="border-2 border-slate-900 p-6 rounded-2xl space-y-4 bg-white shadow-md">
                <h4 className="border-b-2 border-slate-900 pb-3 mb-4 font-black text-center bg-white text-black uppercase tracking-widest">
                  <EditableField value={docMeta.contractorInfoTitle || ''} onSave={(v) => setDocMeta({...docMeta, contractorInfoTitle: v})} className="font-black" />
                </h4>
                 <div className={`space-y-3 font-black ${isRtl ? 'text-start' : 'text-left'}`}>
                   <div className="flex justify-between items-center"><span>{t('bidder_winner')}:</span> <input value={formData.handlerInfo?.name || ''} onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, name: e.target.value}})} className={`bg-transparent border-b border-slate-200 flex-1 px-2 ${isRtl ? 'ml-4 text-left' : 'mr-4 text-right'}`} /></div>
                   <div className="flex justify-between items-center"><span>{t('job_title')}:</span> <input value={formData.handlerInfo?.position || ''} onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, position: e.target.value}})} className={`bg-transparent border-b border-slate-200 flex-1 px-2 ${isRtl ? 'ml-4 text-left' : 'mr-4 text-right'}`} /></div>
                   <div className="flex justify-between items-center"><span>{t('phone')}:</span> <input value={formData.handlerInfo?.phone || ''} onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, phone: e.target.value}})} className={`bg-transparent border-b border-slate-200 flex-1 px-2 ${isRtl ? 'ml-4 text-left' : 'mr-4 text-right'}`} /></div>
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
             <textarea value={formData.terms || ''} onChange={(e) => setFormData({...formData, terms: e.target.value})} className="w-full bg-transparent border-0 focus:ring-0 h-24 resize-none" />
          </div>

          <div className={`grid grid-cols-2 gap-x-20 gap-y-16 text-[14px] font-black mt-20 ${isRtl ? 'text-start' : 'text-left'}`}>
              <div className="space-y-12">
                <div className="flex items-center gap-2">{t('bidder_winner')}: <input value={formData.handlerInfo?.name || ''} readOnly className="border-b-2 border-slate-900 bg-transparent flex-1 px-2" /></div>
                <div className="h-0.5 border-b-2 border-dashed border-slate-300"></div>
                <div className="flex items-center gap-2">{t('date')}: <input value={formData.poDate || ''} readOnly className="border-b-2 border-slate-900 bg-transparent flex-1 px-2" /></div>
              </div>
              <div className="space-y-12">
                <div className="flex items-center gap-2">{t('manager_title')}: <input value={t('manager_title')} readOnly className="border-b-2 border-slate-900 bg-transparent flex-1 px-2" /></div>
                <div className="h-0.5 border-b-2 border-dashed border-slate-300"></div>
                <div className="flex items-center gap-2">{t('date')}: <input value={formData.poDate || ''} readOnly className="border-b-2 border-slate-900 bg-transparent flex-1 px-2" /></div>
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
