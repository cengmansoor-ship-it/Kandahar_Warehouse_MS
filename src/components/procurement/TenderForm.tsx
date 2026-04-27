import React from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Download, Plus, XCircle, Save } from 'lucide-react';
import api, { procurementService } from '@/src/services/api';
import { toast } from 'sonner';
import { DocumentHeader } from './DocumentHeader';
import { ProcurementTable } from './ProcurementTable';

interface Item {
  id: number;
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
    issueNumber?: string;
    issueDate?: string;
    issuerName?: string;
    issuerAddress?: string;
    projectTitle?: string;
    items?: Item[];
    boardMembers?: string[];
  };
  isEditable?: boolean;
}

export const TenderForm: React.FC<TenderFormProps> = ({ 
  data: initialData = {
    issueNumber: '۱۴۴۵/ / ',
    issueDate: '۱۴۰۳/ / ',
    issuerName: 'افتخار احمد حسني',
    issuerAddress: 'کندهار پوهنتون',
    projectTitle: 'د پوهنتون د خپلو ساحو لپاره کرښون او ادبیاتو پوهنځي مخ ساحې لکري',
    items: [
      { id: 1, name: 'لګرایۍ', description: 'د ګلدان سنګ مرم لګرایۍ کول د سپینو سمینتو او نورو اجباري چارو په شمول', unit: 'متر مربع', quantity: 710 },
      { id: 2, name: 'کرښون', description: '50*40*15 سانتي متره خشتې د کانګریټ مارک یې باید M20 وي', unit: 'دانه', quantity: 309 }
    ],
    boardMembers: ['نذيراحمد قادري', 'مولوي محمد عبدالله', 'مولوي ګل احمد هاشمي']
  },
  isEditable = true
}) => {
  const [formData, setFormData] = React.useState(initialData);
  const componentRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const [codes, setCodes] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);

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
      } catch (e) {
        console.error("Error fetching object codes", e);
      }
    };
    fetchCodes();
  }, []);

  const handleSaveToSystem = async () => {
    setSaving(true);
    try {
      await procurementService.createTender({
        projectName: formData.projectTitle,
        items: formData.items?.map(i => ({
          name: i.name,
          spec: i.description,
          unit: i.unit,
          qty: i.quantity,
          code: i.code
        }))
      });
      toast.success("Procurement tender saved to central database");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save to system. Check network connection.");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    // @ts-ignore
    if (field === 'unitPrice' || field === 'quantity') {
      const q = field === 'quantity' ? value : newItems[index].quantity;
      // @ts-ignore
      const p = field === 'unitPrice' ? value : (newItems[index].unitPrice || 0);
      // @ts-ignore
      newItems[index].totalPrice = q * p;
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    const newItems = [...(formData.items || [])];
    const newId = newItems.length > 0 ? Math.max(...newItems.map(i => i.id)) + 1 : 1;
    newItems.push({
      id: newId,
      name: '',
      description: '',
      unit: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    });
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const columns = [
    { header: 'شميره', key: 'id', width: '50px', align: 'center' as const },
    {
      header: 'کود (Chapter)',
      key: 'code',
      width: '100px',
      render: (row: any, idx: number) => isEditable ? (
        <select 
          value={row.code || ''} 
          onChange={(e) => updateItem(idx, 'code', e.target.value)}
          className="w-full bg-transparent border-none text-[10px] font-black focus:ring-1 focus:ring-emerald-500 rounded p-1 text-center"
        >
          <option key="default" value="">Select Code</option>
          {codes.map(c => <option key={c.code} value={c.code}>{c.code} - {c.title}</option>)}
        </select>
      ) : row.code
    },
    { 
      header: 'د جنس نوم', 
      key: 'name', 
      width: '150px',
      render: (row: Item, idx: number) => isEditable ? (
        <input 
          value={row.name} 
          onChange={(e) => updateItem(idx, 'name', e.target.value)}
          className="w-full bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded p-1 text-right"
        />
      ) : row.name
    },
    { 
      header: 'د جنس تخنيکي تشريح', 
      key: 'description', 
      width: '300px',
      render: (row: Item, idx: number) => isEditable ? (
        <textarea 
          value={row.description} 
          onChange={(e) => updateItem(idx, 'description', e.target.value)}
          className="w-full bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded p-1 text-right text-[10px] resize-none"
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
          className="w-full bg-transparent border-none text-center focus:ring-1 focus:ring-emerald-500 rounded"
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
          className="w-full bg-transparent border-none text-center focus:ring-1 focus:ring-emerald-500 rounded"
        />
      ) : row.quantity
    },
    { 
      header: 'د في واحد قيمت په', 
      key: 'unitPrice', 
      width: '100px', 
      align: 'center' as const,
      render: (row: Item, idx: number) => isEditable ? (
        <input 
          type="number"
          value={row.unitPrice || 0} 
          onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent border-none text-center focus:ring-1 focus:ring-emerald-500 rounded"
        />
      ) : row.unitPrice?.toLocaleString()
    },
    { 
      header: 'مجموعي قيمت به افغاني', 
      key: 'totalPrice', 
      width: '120px', 
      align: 'center' as const,
      render: (row: Item) => row.totalPrice?.toLocaleString() || '0'
    },
    {
      header: '',
      key: 'actions',
      width: '40px',
      render: (_: any, idx: number) => isEditable && (
        <button 
          onClick={() => removeItem(idx)}
          className="text-red-500 hover:text-red-700 p-1 no-print"
        >
          <XCircle size={14} />
        </button>
      )
    }
  ];

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Controls */}
      <div className="flex gap-4 no-print">
        <button 
          onClick={() => handlePrint()}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
        >
          <Printer size={18} />
          Print Document
        </button>
        <button 
          onClick={() => handlePrint()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg"
        >
          <Download size={18} />
          Download PDF
        </button>
        {isEditable && (
          <>
            <button 
              onClick={handleSaveToSystem}
              disabled={saving}
              className="flex items-center gap-2 bg-[#0F8F7F] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#26A69A] transition-all shadow-lg shadow-[#0F8F7F]/20"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save to System'}
            </button>
            <button 
              onClick={addItem}
              className="flex items-center gap-2 bg-white text-slate-900 border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-md"
            >
              <Plus size={18} />
              Add Item
            </button>
          </>
        )}
      </div>

      {/* Form Area */}
      <div 
        ref={componentRef}
        dir="rtl"
        className="a4-page font-sans text-slate-900 border border-slate-200"
      >
        <DocumentHeader 
          title="د اجناسو د نرخ اخیستنې معیارې پاڼه" 
          projectTitle={isEditable ? (
            <input 
              value={formData.projectTitle} 
              onChange={(e) => setFormData({...formData, projectTitle: e.target.value})}
              className="w-full bg-slate-50 border-none text-center font-black text-lg focus:ring-2 focus:ring-emerald-500 rounded p-1"
            />
          ) : (formData.projectTitle || '')} 
        />

        {/* Top Info */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6 text-[12px] font-bold">
           <div className="flex gap-2">
             <span>د صادره ګڼه:</span>
             {isEditable ? (
               <input 
                 value={formData.issueNumber} 
                 onChange={(e) => setFormData({...formData, issueNumber: e.target.value})}
                 className="border-b border-slate-400 flex-1 bg-transparent focus:outline-none"
               />
             ) : (
               <span className="border-b border-slate-400 flex-1">{formData.issueNumber}</span>
             )}
           </div>
           <div className="flex gap-2">
             <span>د صادره نیټه:</span>
             {isEditable ? (
               <input 
                 value={formData.issueDate} 
                 onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                 className="border-b border-slate-400 flex-1 bg-transparent focus:outline-none"
               />
             ) : (
               <span className="border-b border-slate-400 flex-1">{formData.issueDate}</span>
             )}
           </div>
           <div className="flex gap-2">
             <span>د تهیه کوونکي نوم:</span>
             {isEditable ? (
               <input 
                 value={formData.issuerName} 
                 onChange={(e) => setFormData({...formData, issuerName: e.target.value})}
                 className="border-b border-slate-400 flex-1 bg-transparent focus:outline-none"
               />
             ) : (
               <span className="border-b border-slate-400 flex-1">{formData.issuerName}</span>
             )}
           </div>
           <div className="flex gap-2">
             <span>د تهیه کوونکي ادرس:</span>
             {isEditable ? (
               <input 
                 value={formData.issuerAddress} 
                 onChange={(e) => setFormData({...formData, issuerAddress: e.target.value})}
                 className="border-b border-slate-400 flex-1 bg-transparent focus:outline-none"
               />
             ) : (
               <span className="border-b border-slate-400 flex-1">{formData.issuerAddress}</span>
             )}
           </div>
        </div>

        <div className="text-[11px] leading-relaxed mb-6 font-medium text-justify">
          <p>د نرخ اخیستنې فورم باید د باصلاحیته نماینده په توسط سره تکمیل او د تهیه کوونکي لخوا هره صفحه امضاء او مهر کړل شي. د نرخ اخیستنې فورم صادروونکی: {formData.issuerName} د تهیه او تدارکاتو عمومي مدیر.</p>
        </div>

        <ProcurementTable columns={columns} data={formData.items || []} />

        {/* Totals & Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12 text-[12px]">
           <div className="space-y-8">
              <div className="border border-slate-900 p-4 h-32 rounded flex flex-col justify-between">
                <span className="font-black text-[11px] mb-2 uppercase">د تهیه کوونکي امضاء / یا مهر</span>
              </div>
              <div className="flex flex-col gap-4 font-black">
                 <span>تاریخ: {formData.issueDate}</span>
                 <span className="text-sm">امضاء، د نرخ اخیستنې " خریداری " هیئت</span>
              </div>
           </div>

           <div className="space-y-6 flex flex-col justify-end pb-2">
              {formData.boardMembers?.map((member, idx) => (
                <div key={idx} className="flex gap-2 font-black">
                   <span>د هیئت نوم:</span>
                   {isEditable ? (
                     <input 
                        value={member}
                        onChange={(e) => {
                          const newMembers = [...(formData.boardMembers || [])];
                          newMembers[idx] = e.target.value;
                          setFormData({...formData, boardMembers: newMembers});
                        }}
                        className="border-b border-slate-400 flex-1 bg-transparent focus:outline-none"
                     />
                   ) : (
                     <span className="border-b border-slate-400 flex-1">{member}</span>
                   )}
                </div>
              ))}
           </div>
        </div>

        {/* Footer Note */}
        <div className="mt-auto pt-10 text-[9px] text-slate-400 text-center border-t border-slate-100 italic">
          Standard Procurement System - Kandahar University Electronic Portal
        </div>
      </div>
    </div>
  );
};
