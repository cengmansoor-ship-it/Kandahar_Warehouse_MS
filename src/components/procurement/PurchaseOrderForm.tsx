import React, { useState } from 'react';
import { Printer, Download, CheckCircle, Plus, XCircle, Save, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentHeader } from './DocumentHeader';
import { ProcurementTable } from './ProcurementTable';
import api from '@/src/services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { EditableField } from '../ui/EditableField';

interface Item {
  id: number;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrderFormProps {
  data?: {
    id?: string;
    poNumber?: string;
    poDate?: string;
    equivalent?: string;
    procurementDescription?: string;
    governorRef?: string;
    entityInfo?: {
      name: string;
      address: string;
      email: string;
    };
    handlerInfo?: {
      name: string;
      position: string;
      phone: string;
    };
    items?: Item[];
    terms?: string;
    signatures?: {
      handler: string;
      head: string;
      board: string[];
    };
  };
  onSave?: (data: any) => void;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ 
  data: initialData,
  onSave
}) => {
  // Advanced customization state
  const [docMeta, setDocMeta] = useState({
    poTitle: 'د خریدارۍ امر (Purchase Order)',
    orderNoLabel: 'د امر ګڼه',
    orderDateLabel: 'د امر نیټه',
    equivalentLabel: 'معادل',
    descLabel: 'تدارکاتي تشریح (Description)',
    entityInfoTitle: 'Procuring Entity Info',
    contractorInfoTitle: 'Contractor Info',
    termsLabel: 'Terms & Conditions',
    totalLabel: 'Total Afghanis / مجمع'
  });

  const defaultData = {
    poNumber: '۱۴۴۵/ / ',
    poDate: new Date().toLocaleDateString('fa-AF'),
    equivalent: '۱۴۴۵/ / ',
    procurementDescription: 'ددې حکم په اساس خریداری کول.',
    governorRef: 'د ولایت مقام ګڼه',
    entityInfo: {
      name: 'کندهار پوهنتون',
      address: 'کندهار پوهنتون نهمه ناحیه',
      email: 'procurement.kdru.af@gmail.com'
    },
    handlerInfo: {
      name: 'تدارکاتو عمومي مدیر',
      position: 'تدارکاتو عمومي مدیریت',
      phone: '0093+700744595'
    },
    items: [],
    terms: 'طرفین (نرخ اخیستونکی او نرخ ورکوونکی) قول، معاینه او شرایط چې په نرخ اخیستنې پاڼه کې ذکر شوي دي قبول او رعایت یې کوي.',
    signatures: {
      handler: '',
      head: 'مالي او اداري معاون',
      board: ['', '']
    }
  };

  const [formData, setFormData] = React.useState(initialData || defaultData);
  const componentRef = React.useRef<HTMLDivElement>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4') as any;
      doc.setFontSize(20);
      doc.text("Purchase Order - Kandahar University", 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text(`PO No: ${formData.poNumber}`, 20, 40);
      doc.text(`Date: ${formData.poDate}`, 20, 50);

      const tableData = (formData.items || []).map((item, idx) => [
        idx + 1,
        item.name,
        item.description,
        item.unit,
        item.quantity,
        item.unitPrice.toLocaleString(),
        item.totalPrice.toLocaleString()
      ]);

      doc.autoTable({
        head: [['#', 'Item', 'Description', 'Unit', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [15, 143, 127] }
      });

      doc.save(`PO_${formData.poNumber || 'draft'}.pdf`);
      toast.success("PDF Downloaded");
    } catch (err) {
      toast.error("PDF generation failed");
    }
  };

  const handlePrint = async () => {
    if (!componentRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.outerHTML).join('\n');
    printWindow.document.write(`
      <html dir="rtl">
        <head><title>Purchase Order</title>${styles}
        <style>@page { size: A4; margin: 20mm; } body { padding: 40px; font-family: sans-serif; }</style></head>
        <body>${componentRef.current.innerHTML}<script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'unitPrice' || field === 'quantity') {
      const q = field === 'quantity' ? value : newItems[index].quantity;
      const p = field === 'unitPrice' ? value : (newItems[index].unitPrice || 0);
      newItems[index].totalPrice = q * p;
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    const newItems = [...(formData.items || [])];
    newItems.push({
      id: Date.now(),
      name: '',
      description: '',
      unit: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    });
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (idx: number) => {
    setFormData({ ...formData, items: (formData.items || []).filter((_, i) => i !== idx) });
  };

  const grandTotal = formData.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;

  const handleSavePO = async () => {
    setSaving(true);
    try {
      if (formData.id) {
         await api.patch(`/procurement/orders/${formData.id}`, formData);
         toast.success("PO updated successfully");
      } else {
         const res = await api.post('/procurement/orders', formData);
         setFormData({...formData, id: res.data.id});
         toast.success("PO created & system logged");
      }
      if (onSave) onSave(formData);
    } catch (e) {
      toast.error("Save failed. Connection error.");
    } finally {
      setSaving(false);
    }
  };

   const columns = [
    { 
      header: <EditableField value="شمیره" onSave={() => {}} />, 
      key: 'id', width: '50px', align: 'center' as const, render: (_:any, i:number) => i+1 
    },
    { 
      header: <EditableField value="د جنس نوم" onSave={() => {}} />, 
      key: 'name', 
      width: '150px',
      render: (row: Item, idx: number) => (
        <input value={row.name} placeholder="Item name..." onChange={(e) => updateItem(idx, 'name', e.target.value)} className="w-full bg-white border-0 focus:ring-1 focus:ring-emerald-500 rounded text-right p-1" />
      )
    },
    { 
      header: <EditableField value="د جنس تخنيکي تشريح" onSave={() => {}} />, 
      key: 'description', 
      width: '300px',
      render: (row: Item, idx: number) => (
        <textarea value={row.description} placeholder="Specs..." onChange={(e) => updateItem(idx, 'description', e.target.value)} className="w-full bg-white border-0 focus:ring-1 focus:ring-emerald-500 rounded text-[10px] resize-none text-right p-1" rows={2} />
      )
    },
    { 
      header: <EditableField value="واحد" onSave={() => {}} />, 
      key: 'unit', 
      width: '80px', 
      align: 'center' as const,
      render: (row: Item, idx: number) => (
        <input value={row.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="w-full bg-white border-0 text-center focus:ring-1 focus:ring-emerald-500 rounded p-1" />
      )
    },
    { 
      header: <EditableField value="مقدار" onSave={() => {}} />, 
      key: 'quantity', 
      width: '80px', 
      align: 'center' as const,
      render: (row: Item, idx: number) => (
        <input type="number" value={row.quantity} onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-white border-0 text-center focus:ring-1 focus:ring-emerald-500 rounded font-black p-1" />
      )
    },
    { 
      header: <EditableField value="د في واحد قيمت" onSave={() => {}} />, 
      key: 'unitPrice', 
      width: '100px', 
      align: 'center' as const,
      render: (row: Item, idx: number) => (
        <input type="number" value={row.unitPrice || 0} onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-white border-0 text-center focus:ring-1 focus:ring-emerald-500 rounded p-1" />
      )
    },
    { 
      header: <EditableField value="مجموعي قيمت" onSave={() => {}} />, 
      key: 'totalPrice', 
      width: '120px', 
      align: 'center' as const,
      render: (row: Item) => (row.totalPrice || 0).toLocaleString()
    },
    {
      header: '',
      key: 'actions',
      width: '40px',
      render: (_: any, idx: number) => (
        <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-1 no-print transition-colors"><Trash2 size={14} /></button>
      )
    }
  ];

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div 
        ref={componentRef}
        dir="rtl"
        className="relative a4-page font-sans text-slate-900 border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        <div className="absolute -left-20 top-0 hidden xl:flex flex-col gap-4 no-print">
          <button onClick={handlePrint} className="p-4 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 shadow-xl hover:scale-110"><Printer size={24} /></button>
          <button onClick={handleDownloadPDF} className="p-4 bg-white border border-slate-200 text-emerald-600 rounded-2xl hover:bg-emerald-50 shadow-xl hover:scale-110"><Download size={24} /></button>
        </div>

        <div className="absolute -right-20 top-0 hidden xl:flex flex-col gap-4 no-print">
          <button onClick={handleSavePO} disabled={saving} className="p-4 bg-white border border-slate-200 text-[#0F8F7F] rounded-2xl hover:bg-emerald-50 shadow-xl hover:scale-110 disabled:opacity-50"><Save size={24} /></button>
          <button onClick={addItem} className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 shadow-xl hover:scale-110"><Plus size={24} /></button>
        </div>

        <div className="flex xl:hidden gap-2 mb-6 no-print p-4">
           <button onClick={handlePrint} className="flex-1 bg-slate-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase"><Printer size={16}/> Print</button>
           <button onClick={handleDownloadPDF} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase"><Download size={16}/> PDF</button>
           <button onClick={handleSavePO} className="flex-1 bg-[#0F8F7F] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase"><Save size={16}/> Save</button>
        </div>

        <div className="p-10">
          <DocumentHeader 
            title={
              <EditableField value={docMeta.poTitle} onSave={(v) => setDocMeta({...docMeta, poTitle: v})} className="text-center font-black" />
            } 
            projectTitle={
              <EditableField value={formData.procurementDescription?.split('\n')[0] || 'Official PO'} onSave={() => {}} placeholder="Short PO Title..." className="text-center font-black italic" />
            } 
          />

          <div className="text-[11px] mb-8 space-y-4 border-2 border-slate-900 p-6 font-black rounded-xl shadow-lg bg-slate-50">
             <div className="flex justify-between items-center">
                <div className="flex gap-6">
                  <span className="flex items-center gap-2">
                    <EditableField value={docMeta.orderNoLabel} onSave={(v) => setDocMeta({...docMeta, orderNoLabel: v})} className="shrink-0" />: 
                    <input value={formData.poNumber} onChange={(e) => setFormData({...formData, poNumber: e.target.value})} className="border-b-2 border-slate-300 px-2 bg-transparent outline-none w-28 text-center font-black focus:border-[#0F8F7F]" />
                  </span>
                  <span className="flex items-center gap-2">
                    <EditableField value={docMeta.orderDateLabel} onSave={(v) => setDocMeta({...docMeta, orderDateLabel: v})} className="shrink-0" />: 
                    <input value={formData.poDate} onChange={(e) => setFormData({...formData, poDate: e.target.value})} className="border-b-2 border-slate-300 px-2 bg-transparent outline-none w-28 text-center font-black focus:border-[#0F8F7F]" />
                  </span>
                </div>
                <span className="flex items-center gap-2">
                  <EditableField value={docMeta.equivalentLabel} onSave={(v) => setDocMeta({...docMeta, equivalentLabel: v})} className="shrink-0" />: 
                  <input value={formData.equivalent} onChange={(e) => setFormData({...formData, equivalent: e.target.value})} className="border-b-2 border-slate-300 px-2 bg-transparent outline-none w-28 text-center font-black focus:border-[#0F8F7F]" />
                </span>
             </div>
             <div className="pt-2">
               <span className="flex flex-col gap-1 text-right">
                 <EditableField value={docMeta.descLabel} onSave={(v) => setDocMeta({...docMeta, descLabel: v})} className="font-black text-emerald-700" />
                 <textarea value={formData.procurementDescription} onChange={(e) => setFormData({...formData, procurementDescription: e.target.value})} className="font-bold bg-white border-2 border-slate-200 focus:ring-1 focus:ring-emerald-500 rounded w-full h-16 resize-none p-2 mt-1" />
               </span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 text-[11px]">
             <div className="border-2 border-slate-900 p-4 rounded-xl space-y-3 bg-white">
                <h4 className="border-b-2 border-slate-900 pb-2 mb-3 bg-slate-900 text-white rounded-t">
                  <EditableField value={docMeta.entityInfoTitle} onSave={(v) => setDocMeta({...docMeta, entityInfoTitle: v})} className="text-center font-black uppercase text-[10px] tracking-widest" />
                </h4>
                <div className="space-y-2">
                  <p className="flex justify-between"><span>اداري نوم:</span> <input value={formData.entityInfo?.name} onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, name: e.target.value}})} className="bg-slate-50 border-0 flex-1 ml-2 text-left" /></p>
                  <p className="flex justify-between"><span>ادرس:</span> <input value={formData.entityInfo?.address} onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, address: e.target.value}})} className="bg-slate-50 border-0 flex-1 ml-2 text-left" /></p>
                  <p dir="ltr" className="flex justify-between"><span>Email:</span> <input value={formData.entityInfo?.email} onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, email: e.target.value}})} className="bg-slate-50 border-0 flex-1 ml-2 text-right" /></p>
                </div>
             </div>
             <div className="border-2 border-slate-900 p-4 rounded-xl space-y-3 bg-white">
                <h4 className="border-b-2 border-slate-900 pb-2 mb-3 font-black text-center bg-slate-900 text-white rounded-t uppercase text-[10px] tracking-widest">Contractor Info</h4>
                <div className="space-y-2">
                  <p className="flex justify-between"><span>اجرا کوونکی:</span> <input value={formData.handlerInfo?.name} onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, name: e.target.value}})} className="bg-slate-50 border-0 flex-1 ml-2 text-left" /></p>
                  <p className="flex justify-between"><span>وظیفه:</span> <input value={formData.handlerInfo?.position} onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, position: e.target.value}})} className="bg-slate-50 border-0 flex-1 ml-2 text-left" /></p>
                  <p className="flex justify-between"><span>شمېره:</span> <input value={formData.handlerInfo?.phone} onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, phone: e.target.value}})} className="bg-slate-50 border-0 flex-1 ml-2 text-left" /></p>
                </div>
             </div>
          </div>

          <ProcurementTable columns={columns} data={formData.items || []} />

          <div className="flex justify-between items-center border-2 border-slate-900 p-4 mt-4 mb-8 bg-slate-900 text-white font-black rounded-xl">
             <span className="text-sm uppercase tracking-widest">Total Afghanis / مجمع</span>
             <div className="flex items-center gap-6">
               <span className="text-xl underline decoration-double underline-offset-4">{grandTotal?.toLocaleString()} Afg</span>
             </div>
          </div>

          <div className="text-[11px] mb-12 italic border-r-8 border-[#0F8F7F] pr-6 py-4 bg-emerald-50 rounded-lg font-medium">
            <textarea value={formData.terms} onChange={(e) => setFormData({...formData, terms: e.target.value})} className="w-full bg-transparent border-0 focus:ring-0 h-20 resize-none leading-relaxed" />
          </div>

          <div className="grid grid-cols-2 gap-x-20 gap-y-16 text-[12px] font-black mt-20">
             <div className="space-y-12">
                <p>نرخ ورکوونکی: {formData.handlerInfo?.name}</p>
                <div className="h-10 border-b-2 border-dashed border-slate-300"></div>
                <p>تاریخ: {formData.poDate}</p>
             </div>
             <div className="space-y-12">
                <p>تدارکاتو عمومي مدیر</p>
                <div className="h-10 border-b-2 border-dashed border-slate-300"></div>
                <p>تاریخ: {formData.poDate}</p>
             </div>
          </div>

          <div className="mt-20 space-y-8">
             <div className="text-center font-black border-y-2 border-slate-900 py-3 uppercase tracking-[0.2em] bg-slate-50 rounded text-xs">
                Electronic Verification Seal Area
             </div>
             <div className="grid grid-cols-3 gap-8 text-center text-[10px]">
                {formData.signatures?.board.map((member, i) => (
                  <div key={i} className="space-y-6">
                     <input value={member} onChange={(e) => {
                       const nb = [...(formData.signatures?.board || [])];
                       nb[i] = e.target.value;
                       setFormData({...formData, signatures: {...formData.signatures!, board: nb}});
                     }} className="bg-slate-50 border-0 text-center w-full font-black text-xs p-1" />
                     <div className="h-2 border-b border-slate-300"></div>
                  </div>
                ))}
                <div className="space-y-6">
                   <input value={formData.signatures?.head} onChange={(e) => setFormData({...formData, signatures: {...formData.signatures!, head: e.target.value}})} className="bg-slate-50 border-0 text-center w-full font-black text-xs p-1" />
                   <div className="h-2 border-b border-slate-300"></div>
                </div>
             </div>
          </div>
        </div>

        <div className="mt-auto p-6 text-[8px] text-slate-400 text-center border-t border-slate-100 flex justify-between uppercase font-black">
          <span>Official Procurement Hub • KDRU</span>
          <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-600" /> System Logged & Verified ID: PO-{formData.id?.slice(-6) || 'NEW'}</span>
        </div>
      </div>
    </div>
  );
};
