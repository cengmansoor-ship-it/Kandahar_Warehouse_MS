import React from 'react';
import { Printer, Download, CheckCircle, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentHeader } from './DocumentHeader';
import { ProcurementTable } from './ProcurementTable';

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
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ 
  data: initialData = {
    poNumber: '۱۴۴۵/ / ',
    poDate: '۱۴۰۳/ / ',
    equivalent: '۱۴۴۵/ / ',
    procurementDescription: 'ددې حکم په اساس د کندهار پوهنتون د خپلو ساحو لپاره کرښون او ادبیاتو پوهنځي مخ ساحې لکري خریداری کول.',
    governorRef: 'د ولایت مقام ګڼه',
    entityInfo: {
      name: 'کندهار پوهنتون',
      address: 'کندهار پوهنتون نهمه ناحیه',
      email: 'procurement.kdru.af@gmail.com'
    },
    handlerInfo: {
      name: 'افتخار احمد حسني',
      position: 'تدارکاتو عمومي مدیریت',
      phone: '0093+700744595'
    },
    items: [
      { id: 1, name: 'لګرایۍ', description: 'د ګلدان سنګ مرم لګرایۍ کول د سپینو سمینتو او نورو اجباري چارو په شمول', unit: 'متر مربع', quantity: 710, unitPrice: 70, totalPrice: 49700 },
      { id: 2, name: 'کرښون', description: '50*40*15 سانتي متره خشتې د کانګریټ مارک یې باید M20 وي', unit: 'دانه', quantity: 309, unitPrice: 150, totalPrice: 46350 }
    ],
    terms: 'طرفین (نرخ اخیستونکی او نرخ ورکوونکی) قول، معاینه او شرایط چې په نرخ اخیستنې پاڼه کې ذکر شوي دي قبول او رعایت یې کوي.',
    signatures: {
      handler: 'افتخار احمد حسني',
      head: 'نذير احمد قادري',
      board: ['مولوي محمد عبدالله', 'مولوي ګل احمد هاشمي']
    }
  }
}) => {
  const [formData, setFormData] = React.useState(initialData);
  const componentRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (!componentRef.current) return;
    toast.info("Opening print dialog...");
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.outerHTML).join('\n');
    doc.open();
    doc.write(`
      <html dir="rtl">
        <head>
          <title>${formData.poNumber || 'Purchase Order'}</title>
          ${styles}
          <style>
             @page { size: A4; margin: 0; }
             @media print { 
               .no-print { display: none !important; } 
               body { padding: 0; margin: 0; } 
               .a4-page { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 40px !important; } 
             }
             body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${componentRef.current.innerHTML}
          <script>
            window.onload=()=>{
              setTimeout(()=>{
                window.print();
                setTimeout(() => {
                  window.parent.document.body.removeChild(window.frameElement);
                }, 100);
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
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
    const newId = newItems.length > 0 ? Math.max(...newItems.map(i => i.id)) + 1 : 1;
    newItems.push({
      id: newId,
      name: 'New Item',
      description: '',
      unit: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    });
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (idx: number) => {
    const newItems = (formData.items || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, items: newItems });
  };

  const columns = [
    { header: 'شميره', key: 'id', width: '50px', align: 'center' as const },
    { 
      header: 'د جنس نوم', 
      key: 'name', 
      width: '150px',
      render: (row: Item, idx: number) => (
        <input 
          value={row.name}
          onChange={(e) => updateItem(idx, 'name', e.target.value)}
          className="w-full bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded text-right"
        />
      )
    },
    { 
      header: 'د جنس تخنيکي تشريح', 
      key: 'description', 
      width: '300px',
      render: (row: Item, idx: number) => (
        <textarea 
          value={row.description}
          onChange={(e) => updateItem(idx, 'description', e.target.value)}
          className="w-full bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded text-[10px] resize-none text-right"
          rows={2}
        />
      )
    },
    { 
      header: 'واحد', 
      key: 'unit', 
      width: '80px', 
      align: 'center' as const,
      render: (row: Item, idx: number) => (
        <input 
          value={row.unit}
          onChange={(e) => updateItem(idx, 'unit', e.target.value)}
          className="w-full bg-transparent border-none text-center focus:ring-1 focus:ring-emerald-500 rounded"
        />
      )
    },
    { 
      header: 'مقدار', 
      key: 'quantity', 
      width: '80px', 
      align: 'center' as const,
      render: (row: Item, idx: number) => (
        <input 
          type="number"
          value={row.quantity}
          onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent border-none text-center focus:ring-1 focus:ring-emerald-500 rounded font-black"
        />
      )
    },
    { 
      header: 'د في واحد قيمت', 
      key: 'unitPrice', 
      width: '100px', 
      align: 'center' as const,
      render: (row: Item, idx: number) => (
        <input 
          type="number"
          value={row.unitPrice || 0}
          onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent border-none text-center focus:ring-1 focus:ring-emerald-500 rounded"
        />
      )
    },
    { 
      header: 'مجموعي قيمت په افغاني', 
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
        <button 
          onClick={() => removeItem(idx)}
          className="text-red-500 hover:text-red-700 p-1 no-print"
        >
          <XCircle size={14} />
        </button>
      )
    }
  ];

  const grandTotal = formData.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;

  const [saving, setSaving] = React.useState(false);

  const handleSavePO = async () => {
    setSaving(true);
    try {
      // In a real app we would call procurementService.createOrder()
      toast.success("Purchase Order officially logged in system");
    } catch (e) {
      toast.error("Failed to save PO");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div 
        ref={componentRef}
        dir="rtl"
        className="relative a4-page font-sans text-slate-900 border border-slate-200"
      >
        {/* Float Controls - Left & Right sides of the page area */}
        <div className="absolute -left-20 top-0 hidden xl:flex flex-col gap-4 no-print">
          <button 
            onClick={handlePrint}
            title="Print PO"
            className="p-4 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all shadow-xl hover:scale-110 active:scale-95"
          >
            <Printer size={24} />
          </button>
          <button 
            onClick={handlePrint}
            title="Download PDF"
            className="p-4 bg-white border border-slate-200 text-emerald-600 rounded-2xl hover:bg-emerald-50 transition-all shadow-xl hover:scale-110 active:scale-95"
          >
            <Download size={24} />
          </button>
        </div>

        <div className="absolute -right-20 top-0 hidden xl:flex flex-col gap-4 no-print">
          <button 
            onClick={handleSavePO}
            disabled={saving}
            title="Save PO"
            className="p-4 bg-white border border-slate-200 text-[#0F8F7F] rounded-2xl hover:bg-emerald-50 transition-all shadow-xl hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            <CheckCircle size={24} />
          </button>
          <button 
            onClick={addItem}
            title="Add Item"
            className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-xl hover:scale-110 active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Mobile/Small Screen Controls */}
        <div className="flex xl:hidden gap-4 mb-6 no-print w-full justify-center">
          <button onClick={handlePrint} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase"><Printer size={16}/> Print PO</button>
          <button onClick={handlePrint} className="flex-1 bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase"><Download size={16}/> PDF</button>
        </div>

        <DocumentHeader 
          title="امر خریداری پاڼه" 
          projectTitle={formData.procurementDescription?.split('برای')[0] || ''} 
        />

        <div className="text-[11px] mb-6 space-y-2 border border-slate-900 p-4 font-black">
           <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <span>امر خریداری شماره: 
                  <input 
                    value={formData.poNumber}
                    onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
                    className="border-b border-dotted border-slate-400 px-4 bg-transparent outline-none w-24 text-center font-black"
                  />
                </span>
                <span>امر خریداری نیټه: 
                  <input 
                    value={formData.poDate}
                    onChange={(e) => setFormData({...formData, poDate: e.target.value})}
                    className="border-b border-dotted border-slate-400 px-4 bg-transparent outline-none w-24 text-center font-black"
                  />
                </span>
              </div>
              <span>معادل: 
                <input 
                  value={formData.equivalent}
                  onChange={(e) => setFormData({...formData, equivalent: e.target.value})}
                  className="border-b border-dotted border-slate-400 px-4 bg-transparent outline-none w-24 text-center font-black"
                />
              </span>
           </div>
           <div>
             <span>تدارکاتي تشریح: 
               <textarea 
                  value={formData.procurementDescription}
                  onChange={(e) => setFormData({...formData, procurementDescription: e.target.value})}
                  className="font-medium bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded w-full h-12 resize-none"
               />
             </span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
           <div className="border border-slate-900 p-2">
              <h4 className="border-b border-slate-900 pb-1 mb-2 font-black text-center bg-slate-100 uppercase text-[9px]">Procuring Entity Info</h4>
              <div className="space-y-1">
                <p><span className="font-black">اداري نوم:</span> 
                  <input 
                    value={formData.entityInfo?.name}
                    onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, name: e.target.value}})}
                    className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded flex-1"
                  />
                </p>
                <p><span className="font-black">ادرس:</span> 
                  <input 
                    value={formData.entityInfo?.address}
                    onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, address: e.target.value}})}
                    className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded flex-1"
                  />
                </p>
                <p dir="ltr" className="text-left"><span className="font-black">Email:</span> 
                  <input 
                    value={formData.entityInfo?.email}
                    onChange={(e) => setFormData({...formData, entityInfo: {...formData.entityInfo!, email: e.target.value}})}
                    className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded flex-1"
                  />
                </p>
              </div>
           </div>
           <div className="border border-slate-900 p-2">
              <h4 className="border-b border-slate-900 pb-1 mb-2 font-black text-center bg-slate-100 uppercase text-[9px]">Contractor/Handler Info</h4>
              <div className="space-y-1">
                <p><span className="font-black">اجرا کوونکی:</span> 
                  <input 
                    value={formData.handlerInfo?.name}
                    onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, name: e.target.value}})}
                    className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded flex-1"
                  />
                </p>
                <p><span className="font-black">وظیفه:</span> 
                   <input 
                    value={formData.handlerInfo?.position}
                    onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, position: e.target.value}})}
                    className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded flex-1"
                  />
                </p>
                <p><span className="font-black">د اړيکو شمېره:</span> 
                   <input 
                    value={formData.handlerInfo?.phone}
                    onChange={(e) => setFormData({...formData, handlerInfo: {...formData.handlerInfo!, phone: e.target.value}})}
                    className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded flex-1"
                  />
                </p>
              </div>
           </div>
        </div>

        <ProcurementTable columns={columns} data={formData.items || []} />

        <div className="flex justify-between items-center border-2 border-slate-900 p-2 mb-6 bg-slate-50 font-black">
           <span className="text-sm">مجموعي قیمت په افغاني</span>
           <div className="flex items-center gap-4">
             <span className="text-xs">Afg</span>
             <span className="text-lg underline decoration-double decoration-slate-900 px-4">{grandTotal?.toLocaleString()}</span>
           </div>
        </div>

        <div className="text-[11px] mb-12 italic border-r-4 border-[#0F8F7F] pr-4 py-2 bg-emerald-50/50">
          <textarea 
            value={formData.terms}
            onChange={(e) => setFormData({...formData, terms: e.target.value})}
            className="w-full bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded h-16 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-10 text-[11px] font-black">
           <div className="space-y-4">
              <p>اجرا کوونکی: {formData.handlerInfo?.name}</p>
              <p>مهر او لاسلیک:</p>
              <p>تاریخ: {formData.poDate}</p>
           </div>
           <div className="space-y-4">
              <p>د تدارکاتو عمومي مدیر</p>
              <div className="h-10 border-b-2 border-dotted border-slate-400"></div>
              <p>تاریخ: {formData.poDate}</p>
           </div>
        </div>

        <div className="mt-12 space-y-6">
           <div className="text-center font-black border-y border-slate-900 py-2">
              د پوهنتون ریاست د خریداری هیئت
           </div>
           <div className="grid grid-cols-3 gap-4 text-center text-[11px]">
              {formData.signatures?.board.map((member, i) => (
                <div key={i} className="space-y-4">
                   <p className="font-black text-xs">
                     <input 
                        value={member}
                        onChange={(e) => {
                          const newBoard = [...(formData.signatures?.board || [])];
                          newBoard[i] = e.target.value;
                          setFormData({...formData, signatures: {...formData.signatures!, board: newBoard}});
                        }}
                        className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded w-full text-center"
                     />
                   </p>
                   <div className="h-4 border-b border-slate-300"></div>
                </div>
              ))}
              <div className="space-y-4">
                 <p className="font-black text-xs">
                    <input 
                      value={formData.signatures?.head}
                      onChange={(e) => setFormData({...formData, signatures: {...formData.signatures!, head: e.target.value}})}
                      className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded w-full text-center"
                    />
                 </p>
                 <div className="h-4 border-b border-slate-300"></div>
              </div>
           </div>
        </div>

        <div className="mt-auto pt-8 text-[9px] text-slate-400 text-center border-t border-slate-100 flex justify-between uppercase font-mono tracking-tighter">
          <span>Kandahar University Logistics Hub</span>
          <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-600" /> Officially Verified Document</span>
        </div>
      </div>
    </div>
  );
};
