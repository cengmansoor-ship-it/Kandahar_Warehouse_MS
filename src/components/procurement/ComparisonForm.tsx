import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Download, Award, XCircle, Info, UserPlus, PlusCircle, Save, Trash2, Edit2 } from 'lucide-react';
import { DocumentHeader } from './DocumentHeader';
import api, { procurementService } from '@/src/services/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { EditableField } from '../ui/EditableField';

interface SupplierBid {
  supplierId: string;
  supplierName: string;
  unitPrices: number[];
  totalPrices: number[];
  grandTotal: number;
  isWinner?: boolean;
}

interface Item {
  id: number;
  name: string;
  description: string;
  quantity: number;
}

interface ComparisonFormProps {
  data?: {
    id?: string;
    tenderId?: string;
    projectTitle?: string;
    procurementDescription?: string;
    items?: Item[];
    bids?: SupplierBid[];
    boardMembers?: { name: string; position: string }[];
  };
  onSave?: (data: any) => void;
}

export const ComparisonForm: React.FC<ComparisonFormProps> = ({ 
  data: initialData,
  onSave
}) => {
  const { t } = useTranslation();
  
  // Advanced customization state
  const [docMeta, setDocMeta] = useState({
    title: 'د نرخ اخستنې میعارې مقایسوي پاڼه',
    descLabel: 'تدارکاتي تشریح:',
    itemHeader: 'د جنس نوم',
    qtyHeader: 'مقدار',
    winnerLabel: 'Winner / ګټونکی',
    selectWinnerLabel: 'Select Winner',
    decisionTitle: 'ملاحظات او پریکړه (Decision):',
    signaturesTitle: 'د هیئت نوم',
    positionTitle: 'وظیفه',
    sealTitle: 'امضاء'
  });

  const defaultData = {
    projectTitle: '',
    procurementDescription: 'ددې پروژې په اړه د مختلفو شرکتونو نرخونه چې د پوهنتون هیئت لخوا راټول شوي دي په لاندې ډول سره دي.',
    items: [],
    bids: [],
    boardMembers: [
      { name: '', position: 'مالي او اداري معاون' },
      { name: '', position: 'د تدارکاتو مدیر' },
      { name: '', position: 'د محاسبې مدیر' }
    ]
  };

  const [formData, setFormData] = React.useState(initialData || defaultData);
  const componentRef = React.useRef<HTMLDivElement>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4') as any; // Landscape for wide matrix
      doc.setFontSize(18);
      doc.text("Comparison Matrix - Kandahar University", 148, 15, { align: 'center' });
      
      const head = [['#', 'Item', 'Qty']];
      formData.bids?.forEach(bid => {
        head[0].push(`${bid.supplierName} (Unit)`);
        head[0].push(`${bid.supplierName} (Total)`);
      });

      const body = (formData.items || []).map((item, idx) => {
        const row = [idx+1, item.name, item.quantity];
        formData.bids?.forEach(bid => {
          row.push(bid.unitPrices[idx]?.toLocaleString() || '0');
          row.push(bid.totalPrices[idx]?.toLocaleString() || '0');
        });
        return row;
      });

      doc.autoTable({
        head: head,
        body: body,
        startY: 25,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 143, 127] }
      });

      doc.save(`Comparison_${formData.projectTitle || 'Matrix'}.pdf`);
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
        <head>
          <title>Comparison Matrix</title>${styles}
          <style>@page { size: A4 landscape; margin: 15mm; } body { padding: 20px; font-family: sans-serif; }</style>
        </head>
        <body>${componentRef.current.innerHTML}<script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  const updateUnitPrice = (supplierIdx: number, itemIdx: number, price: number) => {
    const newBids = [...(formData.bids || [])];
    const bid = { ...newBids[supplierIdx] };
    const unitPrices = [...bid.unitPrices];
    const totalPrices = [...bid.totalPrices];
    unitPrices[itemIdx] = price;
    const qty = formData.items?.[itemIdx]?.quantity || 0;
    totalPrices[itemIdx] = price * qty;
    bid.unitPrices = unitPrices;
    bid.totalPrices = totalPrices;
    bid.grandTotal = totalPrices.reduce((a, b) => a + b, 0);
    newBids[supplierIdx] = bid;
    setFormData({ ...formData, bids: newBids });
  };

  const setWinner = (supplierIdx: number) => {
    const newBids = (formData.bids || []).map((bid, idx) => ({
      ...bid,
      isWinner: idx === supplierIdx
    }));
    setFormData({ ...formData, bids: newBids });
  };

  const addSupplier = () => {
    const newBids = [...(formData.bids || [])];
    newBids.push({
      supplierId: `s${Date.now()}`,
      supplierName: `Supplier ${newBids.length + 1}`,
      unitPrices: new Array(formData.items?.length || 0).fill(0),
      totalPrices: new Array(formData.items?.length || 0).fill(0),
      grandTotal: 0
    });
    setFormData({ ...formData, bids: newBids });
  };

  const removeSupplier = (idx: number) => {
    setFormData({ ...formData, bids: (formData.bids || []).filter((_, i) => i !== idx) });
  };

  const addItem = () => {
    const newItems = [...(formData.items || [])];
    newItems.push({ id: Date.now(), name: 'New Item', description: '', quantity: 1 });
    const newBids = (formData.bids || []).map(bid => ({
      ...bid,
      unitPrices: [...bid.unitPrices, 0],
      totalPrices: [...bid.totalPrices, 0]
    }));
    setFormData({ ...formData, items: newItems, bids: newBids });
  };

  const removeItem = (idx: number) => {
     const newItems = (formData.items || []).filter((_, i) => i !== idx);
     const newBids = (formData.bids || []).map(bid => ({
        ...bid,
        unitPrices: bid.unitPrices.filter((_, i) => i !== idx),
        totalPrices: bid.totalPrices.filter((_, i) => i !== idx),
        grandTotal: bid.totalPrices.filter((_, i) => i !== idx).reduce((a, b) => a + b, 0)
     }));
     setFormData({...formData, items: newItems, bids: newBids});
  };

  const handleAwardBid = async () => {
    const winner = formData.bids?.find(b => b.isWinner);
    if (!winner) return toast.error("Select a winner first");
    setAwarding(true);
    try {
      await procurementService.selectWinner({
        tenderId: formData.tenderId || formData.id,
        quotationId: winner.supplierId,
        supplierName: winner.supplierName,
        items: formData.items?.map((item, idx) => ({
          ...item,
          unitPrice: winner.unitPrices[idx],
          totalPrice: winner.totalPrices[idx]
        }))
      });
      toast.success(`Success! Awarded to ${winner.supplierName}`);
    } catch (e) { toast.error("Award failed"); }
    finally { setAwarding(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (formData.id) {
         await api.patch(`/procurement/quotations/${formData.id}`, formData);
         toast.success("Updated Successfully");
      } else {
         const res = await api.post('/procurement/quotations', formData);
         setFormData({...formData, id: res.data.id});
         toast.success("Saved to Analysis");
      }
      if (onSave) onSave(formData);
    } catch (e) { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const [awarding, setAwarding] = React.useState(false);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div 
        ref={componentRef}
        dir="rtl"
        className="relative a4-page font-sans text-slate-900 border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        <div className="absolute -left-20 top-0 hidden xl:flex flex-col gap-4 no-print">
          <button onClick={handlePrint} className="p-4 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all shadow-xl hover:scale-110 active:scale-95"><Printer size={24} /></button>
          <button onClick={handleDownloadPDF} className="p-4 bg-white border border-slate-200 text-emerald-600 rounded-2xl hover:bg-emerald-50 transition-all shadow-xl hover:scale-110 active:scale-95"><Download size={24} /></button>
        </div>

        <div className="absolute -right-20 top-0 hidden xl:flex flex-col gap-4 no-print">
          <button onClick={handleSave} disabled={saving} className="p-4 bg-white border border-slate-200 text-sky-600 rounded-2xl hover:bg-sky-50 shadow-xl hover:scale-110 disabled:opacity-50"><Save size={24} /></button>
          <button onClick={handleAwardBid} disabled={awarding} className="p-4 bg-white border border-slate-200 text-emerald-600 rounded-2xl hover:bg-emerald-50 shadow-xl hover:scale-110 disabled:opacity-50"><Award size={24} /></button>
          <button onClick={addSupplier} className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 shadow-xl hover:scale-110"><UserPlus size={24} /></button>
          <button onClick={addItem} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 shadow-xl hover:scale-110"><PlusCircle size={24} /></button>
        </div>

        <div className="flex xl:hidden gap-2 mb-6 no-print p-4">
           <button onClick={handlePrint} className="flex-1 bg-slate-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-colors"><Printer size={16}/> Print</button>
           <button onClick={handleDownloadPDF} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-colors"><Download size={16}/> PDF</button>
           <button onClick={handleSave} className="flex-1 bg-sky-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-colors"><Save size={16}/> Save</button>
        </div>

        <div className="p-8">
          <DocumentHeader 
            title={
              <EditableField value={docMeta.title} onSave={(v) => setDocMeta({...docMeta, title: v})} className="text-center font-black" />
            } 
            projectTitle={
              <input value={formData.projectTitle} placeholder="Enter Project Name..." onChange={(e) => setFormData({...formData, projectTitle: e.target.value})} className="bg-slate-50 border-0 text-center font-black text-lg focus:ring-2 focus:ring-emerald-500 rounded p-2 text-black w-full" />
            } 
          />

          <div className="text-[11px] mb-4 p-4 bg-slate-50 border-2 border-slate-900 font-bold leading-relaxed rounded-xl shadow-inner">
            <p className="flex items-center gap-2">
              <EditableField value={docMeta.descLabel} onSave={(v) => setDocMeta({...docMeta, descLabel: v})} className="text-emerald-700 shrink-0 font-black" />
              <input value={formData.procurementDescription} onChange={(e) => setFormData({...formData, procurementDescription: e.target.value})} className="bg-transparent border-0 focus:ring-0 w-full font-bold" />
            </p>
          </div>

          <div className="w-full border-2 border-slate-900 mb-6 overflow-hidden rounded-xl shadow-lg">
            <table className="w-full border-collapse text-[9px] text-center">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th rowSpan={2} className="border-l border-slate-700 p-2 w-8">#</th>
                  <th rowSpan={2} className="border-l border-slate-700 p-2 w-32 tracking-wider">
                    <EditableField value={docMeta.itemHeader} onSave={(v) => setDocMeta({...docMeta, itemHeader: v})} />
                  </th>
                  <th rowSpan={2} className="border-l border-slate-700 p-2 w-10">
                    <EditableField value={docMeta.qtyHeader} onSave={(v) => setDocMeta({...docMeta, qtyHeader: v})} />
                  </th>
                  {formData.bids?.map((bid, i) => (
                    <th key={i} colSpan={2} className="border-l border-slate-700 p-2 bg-slate-800 relative group">
                      <div className="flex items-center justify-between gap-1">
                        <input value={bid.supplierName} onChange={(e) => {
                          const newBids = [...(formData.bids || [])];
                          newBids[i].supplierName = e.target.value;
                          setFormData({...formData, bids: newBids});
                        }} className="bg-transparent border-0 text-white font-black text-center w-full focus:ring-1 focus:ring-emerald-500" />
                        <button onClick={() => removeSupplier(i)} className="text-red-400 group-hover:opacity-100 opacity-0 no-print transition-opacity"><Trash2 size={12}/></button>
                      </div>
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-700 text-white">
                  {formData.bids?.map((_, i) => (
                    <React.Fragment key={i}>
                      <th className="border-l border-slate-600 p-1">واحد</th>
                      <th className="border-l border-slate-600 p-1">مجموعه</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formData.items?.map((item, itemIdx) => (
                  <tr key={itemIdx} className="border-b border-slate-900 group">
                    <td className="border-l border-slate-200 p-2 bg-slate-50 font-black relative">
                       {itemIdx+1}
                       <button onClick={() => removeItem(itemIdx)} className="absolute -right-2 top-2 text-red-500 opacity-0 group-hover:opacity-100 no-print transition-opacity"><Trash2 size={10}/></button>
                    </td>
                    <td className="border-l border-slate-200 p-1"><input value={item.name} onChange={(e) => { const n = [...(formData.items || [])]; n[itemIdx].name = e.target.value; setFormData({...formData, items: n})}} className="w-full bg-white border-0 text-center font-bold" /></td>
                    <td className="border-l border-slate-200 p-1"><input type="number" value={item.quantity} onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      const nI = [...(formData.items || [])]; nI[itemIdx].quantity = v;
                      const nB = (formData.bids || []).map(b => {
                        const up = b.unitPrices[itemIdx] || 0;
                        const tp = [...b.totalPrices]; tp[itemIdx] = up*v;
                        return { ...b, totalPrices: tp, grandTotal: tp.reduce((a, b) => a+b, 0) };
                      });
                      setFormData({...formData, items: nI, bids: nB});
                    }} className="w-full bg-white border-0 text-center font-black" /></td>
                    {formData.bids?.map((bid, bidIdx) => (
                      <React.Fragment key={bidIdx}>
                        <td className="border-l border-slate-100 p-1"><input type="number" value={bid.unitPrices[itemIdx] || 0} onChange={(e) => updateUnitPrice(bidIdx, itemIdx, parseFloat(e.target.value) || 0)} className="w-full bg-transparent border-0 text-center font-bold focus:ring-1 focus:ring-emerald-500" /></td>
                        <td className="border-l border-slate-900 p-1 font-black bg-slate-50/50">{bid.totalPrices[itemIdx]?.toLocaleString()}</td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
                <tr className="bg-slate-900 text-white font-black h-12">
                  <td colSpan={3} className="border-l border-slate-700 p-2 text-right pr-4 text-[10px] uppercase tracking-widest">Total Afghanis / ملموعي قیمت</td>
                  {formData.bids?.map((bid, i) => (
                    <td key={i} colSpan={2} className={`border-l border-slate-700 p-2 text-[12px] underline decoration-double ${bid.isWinner ? 'text-emerald-400 bg-emerald-950/30' : ''}`}>
                      {bid.grandTotal.toLocaleString()}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-0 mb-8 border-2 border-slate-900 divide-x-2 divide-slate-900 rounded-xl overflow-hidden shadow-md">
             {formData.bids?.map((bid, i) => (
               <button key={i} onClick={() => setWinner(i)} className={`p-4 flex flex-col items-center gap-2 transition-all group ${bid.isWinner ? 'bg-emerald-600 text-white' : 'bg-slate-50 opacity-60 hover:opacity-100'}`}>
                  <span className={`text-[10px] font-black uppercase ${bid.isWinner ? 'text-white' : 'text-slate-900'}`}>{bid.supplierName}</span>
                  {bid.isWinner ? <div className="flex items-center gap-1 font-black text-[10px] uppercase"><Award size={14}/> Winner / ګټونکی</div> : <div className="flex items-center gap-1 font-black text-[10px] text-slate-400"><XCircle size={14}/> Select Winner</div>}
               </button>
             ))}
          </div>

          <div className="p-4 border-2 border-slate-900 rounded-xl mb-8 bg-amber-50/30 text-[10px] text-justify space-y-2 border-dashed">
             <div className="flex items-start gap-2 font-black"><Info size={16} className="text-amber-600 shrink-0 mt-0.5" /><span>ملاحظات او پریکړه (Decision):</span></div>
             <p className="leading-relaxed">د تدارکاتي هیئت لخوا د ټولو شرکتونو نرخونه په دقت سره وڅیړل شول، چې په پایله کې <span className="font-black underline mx-1">{formData.bids?.find(b => b.isWinner)?.supplierName || '...'}</span> شرکت د ټیټ نرخ او د موادو د لوړ کیفیت په پام کې نیولو سره د دې پروژې ګټونکی اعلان شو.</p>
          </div>

          <div className="w-full border-2 border-slate-900 rounded-xl overflow-hidden shadow-sm">
             <div className="grid grid-cols-3 bg-slate-900 text-white font-black text-[11px] text-center divide-x-2 divide-slate-700">
                <div className="p-3">د هیئت نوم</div>
                <div className="p-3">وظیفه</div>
                <div className="p-3">امضاء</div>
             </div>
             {formData.boardMembers?.map((member, i) => (
               <div key={i} className="grid grid-cols-3 border-b border-slate-200 last:border-b-0 divide-x-2 divide-slate-200 text-center text-[10px] font-bold bg-white">
                  <div className="p-1"><input value={member.name} onChange={(e) => { const n = [...(formData.boardMembers || [])]; n[i].name = e.target.value; setFormData({...formData, boardMembers: n})}} className="w-full bg-slate-50/50 border-0 text-center p-2 rounded" /></div>
                  <div className="p-1"><input value={member.position} onChange={(e) => { const n = [...(formData.boardMembers || [])]; n[i].position = e.target.value; setFormData({...formData, boardMembers: n})}} className="w-full bg-slate-50/50 border-0 text-center p-2 rounded italic" /></div>
                  <div className="p-2 h-14 flex items-center justify-center opacity-10 font-mono text-[8px] uppercase">Official Seal Area</div>
               </div>
             ))}
          </div>
        </div>

        <div className="mt-auto p-4 text-[7px] text-slate-400 flex justify-between border-t border-slate-100 italic bg-slate-50/30">
           <span>Procurement System Engine • Kandahar University Digital Hub</span>
           <span>Date: {new Date().toLocaleDateString('fa-AF')}</span>
        </div>
      </div>
    </div>
  );
};
