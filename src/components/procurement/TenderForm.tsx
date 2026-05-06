import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Download, Plus, XCircle, Save, Trash2, Edit2 } from 'lucide-react';
import api, { procurementService } from '@/src/services/api';
import { toast } from 'sonner';
import { DocumentHeader } from './DocumentHeader';
import { ProcurementTable } from './ProcurementTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EditableField } from '../ui/EditableField';

interface Item {
  id: any;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  code?: string;
}

interface TenderFormProps {
  requestId?: string;
  data?: {
    id?: string;
    issueNumber?: string;
    issueDate?: string;
    issuerName?: string;
    issuerAddress?: string;
    projectTitle?: string;
    items?: Item[];
    boardMembers?: string[];
    status?: string;
  };
  isEditable?: boolean;
  onSave?: (data: any) => void;
}

export const TenderForm: React.FC<TenderFormProps> = ({ 
  requestId,
  data: initialData,
  isEditable = true,
  onSave
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  // Advanced customization state for labels (making the doc fully editable)
  const [docMeta, setDocMeta] = useState({
    tenderTitle: 'د استملاک فورم (Tender Acquisition)',
    subtitle: 'تدارکاتي تشریح: ددې پروژې په اړه د مختلفو شرکتونو نرخونه چې د پوهنتون هیئت لخوا راټول شوي دي په لاندې ډول سره دي.',
    issuerLabel: 'issuer_details',
    issuerAddress: 'issuer_address',
    itemsLabel: 'procurement_notice',
    dateLabel: 'Date',
    refLabel: 'ref_no',
    signatureLabel: 'د تهیه کوونکي امضاء او مهر (Signature)',
    boardHeading: 'امضاء، د نرخ اخیستنې " خریداری " هیئت',
    boardMemberLabel: 'د هیئت نوم:',
    decisionLabel: 'ملاحظات او پریکړه (Decision):',
    decisionText: 'د تدارکاتي هیئت لخوا د ټولو شرکتونو نرخونه په دقت سره وڅیړل شول، چې په پایله کې ... شرکت د ټیټ نرخ او د موادو د لوړ کیفیت په پام کې نیولو سره د دې پروژې ګټونکی اعلان شو.',
    // Table headers
    hNum: 'شمیره',
    hCode: 'کود (Chapter)',
    hName: 'د جنس نوم',
    hDesc: 'د جنس تخنيکي تشريح',
    hUnit: 'واحد',
    hQty: 'مقدار',
    hPrice: 'د في واحد قيمت',
    hTotal: 'مجموعې قیمت'
  });

  const defaultData = {
    issueNumber: '۱۴۴۵/ / ',
    issueDate: new Date().toLocaleDateString('fa-AF', { year: 'numeric', month: 'numeric', day: 'numeric' }),
    issuerName: 'تدارکاتو عمومي مدیر',
    issuerAddress: 'کندهار پوهنتون',
    projectTitle: '',
    items: [],
    boardMembers: ['Board Member 1', 'Board Member 2', 'Board Member 3'],
    requestId: requestId
  };

  const [formData, setFormData] = React.useState(initialData || defaultData);
  const componentRef = React.useRef<HTMLDivElement>(null);
  const [saving, setSaving] = React.useState(false);
  const [codes, setCodes] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4') as any;
      doc.setFontSize(20);
      doc.text("Kandahar University - Procurement Tender", 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text(`Project: ${formData.projectTitle || 'N/A'}`, 20, 40);
      doc.text(`Issue No: ${formData.issueNumber}`, 20, 50);
      doc.text(`Date: ${formData.issueDate}`, 20, 60);

      const tableData = (formData.items || []).map((item, index) => [
        index + 1,
        item.code || '',
        item.name,
        item.description,
        item.unit,
        item.quantity,
        (Number(item.unitPrice) || 0).toLocaleString(),
        (Number(item.totalPrice) || 0).toLocaleString()
      ]);

      autoTable(doc, {
        head: [['#', 'Code', 'Item', 'Description', 'Unit', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        startY: 70,
        theme: 'grid',
        headStyles: { fillColor: [15, 143, 127] }
      });

      doc.save(`Tender_${formData.issueNumber || 'draft'}.pdf`);
      toast.success("PDF Generated Successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const handlePrint = async () => {
    if (!componentRef.current) return;
    const isIframe = window.self !== window.top;
    if (isIframe) {
      toast.info("For best printing quality, please open the app in a new tab.");
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.outerHTML).join('\n');
    const content = componentRef.current.innerHTML;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>${formData.projectTitle || 'Tender'}</title>
          ${styles}
          <style>@page { size: A4; margin: 20mm; } body { padding: 40px; font-family: sans-serif; }</style>
        </head>
        <body>${content}<script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  React.useEffect(() => {
    const fetchCodes = async () => {
      try {
        const res = await procurementService.getCodes();
        const flatCodes: any[] = [];
        res.data.forEach((bab: any) => {
          if (bab.fasls) {
            bab.fasls.forEach((fasl: any) => {
              if (fasl.items) {
                fasl.items.forEach((item: any) => {
                  flatCodes.push({ code: item.code, title: item.name });
                });
              }
            });
          }
        });
        setCodes(flatCodes);
      } catch (e) { console.error(e); }
    };
    fetchCodes();
  }, []);

  const handleSaveToSystem = async () => {
    setSaving(true);
    try {
      const payload = {
        tenderNumber: formData.issueNumber,
        projectTitle: formData.projectTitle,
        issueDate: formData.issueDate,
        issuerName: formData.issuerName,
        issuerAddress: formData.issuerAddress,
        items: formData.items,
        boardMembers: formData.boardMembers
      };

      if (formData.id) {
        await api.patch(`/procurement/tenders/${formData.id}`, payload);
        toast.success("Tender updated successfully");
      } else {
        const res = await api.post('/procurement/tenders', { ...payload, requestId: (formData as any).requestId || requestId });
        setFormData({ ...formData, id: res.data.id });
        toast.success("New tender created and saved");
      }
      
      // Update pipeline progress to 50%
      if (requestId || (formData as any).requestId) {
        await api.patch(`/requests/${requestId || (formData as any).requestId}`, { progress: 50, status: 'TENDER_CREATED' });
      }
      
      if (onSave) onSave(formData);
    } catch (e) {
      toast.error("Save failed. Connection error.");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'unitPrice' || field === 'quantity') {
      const q = field === 'quantity' ? value : newItems[index].quantity;
      const p = field === 'unitPrice' ? value : (newItems[index].unitPrice || 0);
      newItems[index].totalPrice = (Number(q) || 0) * (Number(p) || 0);
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
      totalPrice: 0,
      code: ''
    });
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const columns = [
    { 
      header: <EditableField value={docMeta.hNum} onSave={(val) => setDocMeta({...docMeta, hNum: val})} isEditable={isEditable} />, 
      key: 'id', width: '50px', align: 'center' as const, render: (_:any, i:number) => i + 1 
    },
    {
      header: <EditableField value={docMeta.hCode} onSave={(val) => setDocMeta({...docMeta, hCode: val})} isEditable={isEditable} />,
      key: 'code',
      width: '120px',
      render: (row: any, idx: number) => isEditable ? (
        <select 
          value={row.code || ''} 
          onChange={(e) => updateItem(idx, 'code', e.target.value)}
          className="w-full bg-white border-0 text-[10px] font-black focus:ring-1 focus:ring-emerald-500 rounded p-1 text-center"
        >
          <option value="">Select Code</option>
          {codes.map(c => <option key={c.code} value={c.code}>{c.code} - {c.title}</option>)}
        </select>
      ) : row.code
    },
    { 
      header: <EditableField value={docMeta.hName} onSave={(val) => setDocMeta({...docMeta, hName: val})} isEditable={isEditable} />, 
      key: 'name', 
      width: '180px',
      render: (row: Item, idx: number) => isEditable ? (
        <input 
          value={row.name} 
          onChange={(e) => updateItem(idx, 'name', e.target.value)}
          placeholder="Enter item name..."
          className="w-full bg-white border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-right"
        />
      ) : row.name
    },
    { 
      header: <EditableField value={docMeta.hDesc} onSave={(val) => setDocMeta({...docMeta, hDesc: val})} isEditable={isEditable} />, 
      key: 'description', 
      width: '250px',
      render: (row: Item, idx: number) => isEditable ? (
        <textarea 
          value={row.description} 
          onChange={(e) => updateItem(idx, 'description', e.target.value)}
          placeholder="Specifications..."
          className="w-full bg-white border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-right text-[10px] resize-none"
          rows={2}
        />
      ) : row.description
    },
    { 
      header: <EditableField value={docMeta.hUnit} onSave={(val) => setDocMeta({...docMeta, hUnit: val})} isEditable={isEditable} />, 
      key: 'unit', 
      width: '80px', 
      align: 'center' as const,
      render: (row: Item, idx: number) => isEditable ? (
        <input 
          value={row.unit} 
          onChange={(e) => updateItem(idx, 'unit', e.target.value)}
          className="w-full bg-white border-0 text-center focus:ring-1 focus:ring-emerald-500 rounded"
        />
      ) : row.unit
    },
    { 
      header: <EditableField value={docMeta.hQty} onSave={(val) => setDocMeta({...docMeta, hQty: val})} isEditable={isEditable} />, 
      key: 'quantity', 
      width: '80px', 
      align: 'center' as const,
      render: (row: Item, idx: number) => isEditable ? (
        <input 
          type="number"
          value={row.quantity} 
          onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
          className="w-full bg-white border-0 text-center focus:ring-1 focus:ring-emerald-500 rounded"
        />
      ) : row.quantity
    },
    { 
      header: <EditableField value={docMeta.hPrice} onSave={(val) => setDocMeta({...docMeta, hPrice: val})} isEditable={isEditable} />, 
      key: 'unitPrice', 
      width: '100px', 
      align: 'center' as const,
      render: (row: Item, idx: number) => isEditable ? (
        <input 
          type="number"
          value={row.unitPrice || 0} 
          onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
          className="w-full bg-white border-0 text-center focus:ring-1 focus:ring-emerald-500 rounded"
        />
      ) : (Number(row.unitPrice) || 0).toLocaleString()
    },
    { 
      header: <EditableField value={docMeta.hTotal} onSave={(val) => setDocMeta({...docMeta, hTotal: val})} isEditable={isEditable} />, 
      key: 'totalPrice', 
      width: '120px', 
      align: 'center' as const,
      render: (row: Item) => ((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)).toLocaleString()
    },
    {
      header: '',
      key: 'actions',
      width: '40px',
      render: (_: any, idx: number) => isEditable && (
        <button 
          onClick={() => removeItem(idx)}
          className="text-red-500 hover:text-red-700 p-1 no-print transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )
    }
  ];

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
               <button onClick={handleDownloadPDF} className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-rose-600/10">
                 <Download size={16} /> Export PDF
               </button>
             </div>
             <div className="flex items-center gap-2">
                {isEditable && (
                  <>
                    <button onClick={addItem} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-emerald-500/10">
                      <Plus size={16} /> Add Row
                    </button>
                    <button onClick={handleSaveToSystem} disabled={saving} className="p-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-sky-600/10 disabled:opacity-50">
                      <Save size={16} /> {saving ? 'Saving...' : 'Save & Complete'}
                    </button>
                  </>
                )}
             </div>
          </div>

          <DocumentHeader 
            title={<EditableField value={docMeta.tenderTitle} onSave={(val) => setDocMeta({...docMeta, tenderTitle: val})} className="text-2xl font-black tracking-tight text-black text-center" isEditable={isEditable} />} 
            projectTitle={isEditable ? <EditableField value={formData.projectTitle || ''} onSave={(val) => setFormData({...formData, projectTitle: val})} className="w-full text-center font-black text-lg text-black" placeholder="Enter Project Title..." isEditable={isEditable} /> : (formData.projectTitle || '')} 
          />

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-[12px] font-black">
             {[
               { metaKey: 'refLabel', key: 'issueNumber' },
               { metaKey: 'dateLabel', key: 'issueDate' },
               { metaKey: 'issuerLabel', key: 'issuerName' },
               { metaKey: 'issuerAddress', key: 'issuerAddress' }
             ].map((field) => (
               <div key={field.key} className="flex gap-2 items-center">
                 <EditableField value={(docMeta as any)[field.metaKey]} onSave={(val) => setDocMeta({...docMeta, [field.metaKey]: val})} className="shrink-0" isEditable={isEditable} />
                 {isEditable ? (
                   <input value={(formData as any)[field.key]} onChange={(e) => setFormData({...formData, [field.key]: e.target.value})} className="border-b-2 border-slate-900 flex-1 bg-transparent focus:outline-none focus:border-[#0F8F7F] transition-colors font-black h-8 px-2" />
                 ) : (
                   <span className="border-b-2 border-slate-900 flex-1 h-8 flex items-end">{(formData as any)[field.key]}</span>
                 )}
               </div>
             ))}
          </div>

          <div className="text-[12px] leading-relaxed mb-6 font-bold text-justify bg-white p-6 rounded-xl border-2 border-slate-900">
             <EditableField value={docMeta.subtitle} onSave={(val) => setDocMeta({...docMeta, subtitle: val})} multiline isEditable={isEditable} />
          </div>

          <div className="mb-4 text-start">
             <EditableField value={docMeta.itemsLabel} onSave={(val) => setDocMeta({...docMeta, itemsLabel: val})} className="font-black text-slate-900 underline decoration-2 underline-offset-4" isEditable={isEditable} />
          </div>

          <ProcurementTable columns={columns} data={formData.items || []} />

          <div className="mt-12 p-8 bg-white rounded-2xl border-2 border-slate-900 space-y-4 text-start">
             <EditableField value={docMeta.decisionLabel} onSave={(val) => setDocMeta({...docMeta, decisionLabel: val})} className="font-black text-slate-900 text-lg underline" isEditable={isEditable} />
             <textarea 
               value={docMeta.decisionText} 
               onChange={(e) => setDocMeta({...docMeta, decisionText: e.target.value})}
               className="w-full bg-transparent border-0 focus:ring-0 text-xs leading-relaxed text-slate-600 italic font-bold h-24 resize-none"
             />
          </div>

          <div className="grid grid-cols-2 gap-12 mt-16 text-[14px]">
            <div className="space-y-6">
              <div className="border-2 border-slate-900 p-6 h-48 rounded-2xl flex flex-col justify-between items-center bg-white shadow-md">
                <EditableField value={docMeta.signatureLabel} onSave={(val) => setDocMeta({...docMeta, signatureLabel: val})} className="font-black text-[10px] uppercase text-slate-400 text-center" isEditable={isEditable} />
                <div className="text-center font-black">
                  <div className="text-lg">{formData.issuerName}</div>
                  <div className="text-[10px] text-slate-500">{formData.issueDate}</div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <EditableField value={docMeta.boardHeading} onSave={(val) => setDocMeta({...docMeta, boardHeading: val})} className="text-lg font-black text-black underline mb-6" isEditable={isEditable} />
              {formData.boardMembers?.map((member, idx) => (
                <div key={idx} className="flex gap-3 font-black items-center">
                   <EditableField value={docMeta.boardMemberLabel} onSave={(val) => setDocMeta({...docMeta, boardMemberLabel: val})} className="shrink-0" isEditable={isEditable} />
                   {isEditable ? (
                     <input value={member} placeholder={`Board Member ${idx + 1}`} onChange={(e) => {
                        const newMembers = [...(formData.boardMembers || [])];
                        newMembers[idx] = e.target.value;
                        setFormData({...formData, boardMembers: newMembers});
                     }} className="border-b-2 border-slate-900 flex-1 bg-transparent focus:outline-none focus:border-[#0F8F7F] transition-colors py-1 text-right h-8" />
                   ) : (
                     <span className="border-b-2 border-slate-900 flex-1 py-1 text-right h-8 flex items-end">{member}</span>
                   )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 pb-8 text-[10px] text-slate-500 text-center border-t-2 border-slate-900 font-black italic bg-slate-50">
          Procurement System Engine • Kandahar University Digital Hub
        </div>
      </div>
    </div>
  );
};
