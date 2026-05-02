import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Download, Plus, XCircle, Save, Trash2, Edit2 } from 'lucide-react';
import api, { procurementService } from '@/src/services/api';
import { toast } from 'sonner';
import { DocumentHeader } from './DocumentHeader';
import { ProcurementTable } from './ProcurementTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  data: initialData,
  isEditable = true,
  onSave
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  // Advanced customization state for labels (making the doc fully editable)
  const [docMeta, setDocMeta] = useState({
    tenderTitle: t('tender_document')?.toUpperCase() || 'TENDER DOCUMENT',
    subtitle: t('procurement_notice') || 'Official Procurement & Specifications Notice',
    issuerLabel: t('issuer_details') || 'Issuer Information',
    itemsLabel: t('items_specifications') || 'Detailed List of Requirements',
    dateLabel: t('date') || 'Issue Date',
    refLabel: t('ref_no') || 'Reference Code',
    preparedByLabel: t('prepared_by') || 'Prepared By (Logistics Dept)',
    approvedByLabel: t('approved_by') || 'Approved By (Chancellor Office)',
    facultyLabel: t('faculty') || 'Assigned Faculty',
    departmentLabel: t('department') || 'End-User Department'
  });

  const defaultData = {
    issueNumber: '۱۴۴۵/ / ',
    issueDate: new Date().toLocaleDateString('fa-AF'),
    issuerName: 'تدارکاتو عمومي مدیر',
    issuerAddress: 'کندهار پوهنتون',
    projectTitle: '',
    items: [],
    boardMembers: ['', '', '']
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
      
      // Since it's Pashto/Dari, jspdf needs special fonts for direct text.
      // For now, we use autotable and basic layout. 
      // A better way for RTL complex docs in jspdf is using a font that supports it.
      
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
        item.unitPrice?.toLocaleString() || '0',
        item.totalPrice?.toLocaleString() || '0'
      ]);

      doc.autoTable({
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
        const res = await api.post('/procurement/tenders', { ...payload, requestId: (formData as any).requestId });
        setFormData({ ...formData, id: res.data.id });
        toast.success("New tender created and saved");
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
      id: Date.now(), // Dynamic ID
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
      header: <EditableField value="شمیره" onSave={() => {}} isEditable={isEditable} />, 
      key: 'id', width: '50px', align: 'center' as const, render: (_:any, i:number) => i + 1 
    },
    {
      header: <EditableField value="کود (Chapter)" onSave={() => {}} isEditable={isEditable} />,
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
      header: <EditableField value="د جنس نوم" onSave={() => {}} isEditable={isEditable} />, 
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
      header: 'د جنس تخنيکي تشريح', 
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
      header: 'واحد', 
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
      header: 'مقدار', 
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
      header: 'د في واحد قيمت', 
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
      ) : row.unitPrice?.toLocaleString()
    },
    { 
      header: <EditableField value="مجموعې قیمت" onSave={() => {}} isEditable={isEditable} />, 
      key: 'totalPrice', 
      width: '120px', 
      align: 'center' as const,
      render: (row: Item) => (row.quantity * (row.unitPrice || 0)).toLocaleString()
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
        className="relative a4-page font-sans text-slate-900 border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        {/* Floating Controls */}
        <div className="absolute -left-20 top-0 hidden xl:flex flex-col gap-4 no-print">
          <button 
            onClick={handlePrint}
            title="Print Document"
            className="p-4 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all shadow-xl hover:scale-110 active:scale-95"
          >
            <Printer size={24} />
          </button>
          <button 
            onClick={handleDownloadPDF}
            title="Download PDF"
            className="p-4 bg-white border border-slate-200 text-emerald-600 rounded-2xl hover:bg-emerald-50 transition-all shadow-xl hover:scale-110 active:scale-95"
          >
            <Download size={24} />
          </button>
        </div>

        <div className="absolute -right-20 top-0 hidden xl:flex flex-col gap-4 no-print">
          {isEditable && (
            <>
              <button 
                onClick={handleSaveToSystem}
                disabled={saving}
                title="Save & Persist"
                className="p-4 bg-white border border-slate-200 text-[#0F8F7F] rounded-2xl hover:bg-emerald-50 transition-all shadow-xl hover:scale-110 active:scale-95 disabled:opacity-50"
              >
                <Save size={24} />
              </button>
              <button 
                onClick={addItem}
                title="Dynamically Add Item"
                className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-xl hover:scale-110 active:scale-95"
              >
                <Plus size={24} />
              </button>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex xl:hidden gap-2 mb-6 no-print w-full justify-center p-4">
           <button onClick={handlePrint} className="flex-1 bg-slate-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase transition-colors hover:bg-black"><Printer size={16}/> Print</button>
           <button onClick={handleDownloadPDF} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase transition-colors hover:bg-emerald-700"><Download size={16}/> PDF</button>
           {isEditable && <button onClick={handleSaveToSystem} className="flex-1 bg-[#0F8F7F] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase transition-colors hover:bg-[#0c7a6b]"><Save size={16}/> Save</button>}
        </div>

        <div className="p-[20mm]">
          <DocumentHeader 
            title={
              <EditableField 
                value={docMeta.tenderTitle} 
                onSave={(val) => setDocMeta({...docMeta, tenderTitle: val})}
                className="text-2xl font-black tracking-tight text-black text-center"
                isEditable={isEditable}
              />
            } 
            projectTitle={isEditable ? (
              <EditableField 
                value={formData.projectTitle || ''} 
                onSave={(val) => setFormData({...formData, projectTitle: val})}
                className="w-full text-center font-black text-lg text-black"
                placeholder="Enter Project Title..."
                isEditable={isEditable}
              />
            ) : (formData.projectTitle || '')} 
          />

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-[12px] font-bold">
             {[
               { metaKey: 'refLabel', key: 'issueNumber' },
               { metaKey: 'dateLabel', key: 'issueDate' },
               { metaKey: 'issuerLabel', key: 'issuerName' },
               { metaKey: 'issuerAddress', key: 'issuerAddress' } // repurposed issuerAddress label if needed, or just use issuerName
             ].map((field) => (
               <div key={field.key} className="flex gap-2 items-center">
                 <EditableField 
                    value={(docMeta as any)[field.metaKey] || field.metaKey}
                    onSave={(val) => setDocMeta({...docMeta, [field.metaKey]: val})}
                    className="shrink-0"
                    isEditable={isEditable}
                 />
                 {isEditable ? (
                   <input 
                     value={(formData as any)[field.key]} 
                     onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                     className="border-b-2 border-slate-200 flex-1 bg-transparent focus:outline-none focus:border-emerald-500 transition-colors"
                   />
                 ) : (
                   <span className="border-b border-dotted border-slate-400 flex-1">{(formData as any)[field.key]}</span>
                 )}
               </div>
             ))}
          </div>

          <div className="text-[11px] leading-relaxed mb-8 font-medium text-justify bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p>
              <EditableField 
                value={docMeta.subtitle} 
                onSave={(val) => setDocMeta({...docMeta, subtitle: val})}
                multiline
                isEditable={isEditable}
              />
            </p>
          </div>

          <ProcurementTable columns={columns} data={formData.items || []} />

          <div className="grid grid-cols-2 gap-12 mt-16 text-[12px]">
             <div className="space-y-10">
                <div className="border-2 border-dashed border-slate-200 p-4 h-36 rounded-2xl flex flex-col justify-between items-center bg-slate-50/30">
                  <span className="font-black text-[10px] uppercase text-slate-400">د تهیه کوونکي امضاء او مهر (Signature)</span>
                </div>
                <div className="flex flex-col gap-4 font-black">
                   <div className="flex justify-between border-b border-slate-100 pb-2"><span>تاریخ:</span> <span>{formData.issueDate}</span></div>
                   <span className="text-sm text-emerald-800">امضاء، د نرخ اخیستنې " خریداری " هیئت</span>
                </div>
             </div>

             <div className="space-y-6 flex flex-col justify-end">
                {formData.boardMembers?.map((member, idx) => (
                  <div key={idx} className="flex gap-3 font-black items-center">
                     <span className="w-24 shrink-0">د هیئت نوم:</span>
                     {isEditable ? (
                       <input 
                          value={member}
                          placeholder={`Board Member ${idx + 1}`}
                          onChange={(e) => {
                            const newMembers = [...(formData.boardMembers || [])];
                            newMembers[idx] = e.target.value;
                            setFormData({...formData, boardMembers: newMembers});
                          }}
                          className="border-b-2 border-slate-200 flex-1 bg-transparent focus:outline-none focus:border-emerald-500 transition-colors py-1"
                       />
                     ) : (
                       <span className="border-b border-dotted border-slate-400 flex-1 py-1">{member}</span>
                     )}
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="mt-8 pt-6 pb-6 text-[9px] text-slate-400 text-center border-t border-slate-100 italic">
          KDRU-WMS Standard Procurement Engine • کندهار پوهنتون
        </div>
      </div>
    </div>
  );
};
