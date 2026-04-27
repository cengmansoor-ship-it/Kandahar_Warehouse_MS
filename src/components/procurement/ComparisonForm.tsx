import React from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Download, Award, XCircle, Info, UserPlus, PlusCircle } from 'lucide-react';
import { DocumentHeader } from './DocumentHeader';

import api, { procurementService } from '@/src/services/api';
import { toast } from 'sonner';

interface SupplierBid {
  supplierId: string;
  supplierName: string;
  unitPrices: number[]; // Index matches item index
  totalPrices: number[]; // Index matches item index
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
    projectTitle?: string;
    procurementDescription?: string;
    items?: Item[];
    bids?: SupplierBid[];
    boardMembers?: { name: string; position: string }[];
  };
}

export const ComparisonForm: React.FC<ComparisonFormProps> = ({ 
  data: initialData = {
    projectTitle: 'د پوهنتون د خپلو ساحو لپاره کرښون او ادبیاتو پوهنځي مخ ساحې لکري',
    procurementDescription: 'ددې پروژې په اړه د مختلفو شرکتونو نرخونه چې د پوهنتون هیئت لخوا راټول شوي دي په لاندې ډول سره دي.',
    items: [
      { id: 1, name: 'لګرایۍ', description: 'د ګلدان سنګ مرم لګرایۍ کول د سپینو سمینتو او نورو اجباري چارو په شمول', quantity: 710 },
      { id: 2, name: 'کرښون', description: '50*40*15 سانتي متره خشتې د کانګریټ مارک یې باید M20 وي', quantity: 309 }
    ],
    bids: [
      { 
        supplierId: 's1', 
        supplierName: 'جمال ابنا ساختماني شرکت', 
        unitPrices: [70, 150], 
        totalPrices: [49700, 46350], 
        grandTotal: 96050,
        isWinner: true 
      },
      { 
        supplierId: 's2', 
        supplierName: 'ماشاالله افغان ساختماني شرکت', 
        unitPrices: [78, 145], 
        totalPrices: [55380, 44805], 
        grandTotal: 100185 
      },
      { 
        supplierId: 's3', 
        supplierName: 'روښان شعیب ساختماني شرکت', 
        unitPrices: [80, 150], 
        totalPrices: [56800, 46350], 
        grandTotal: 103150 
      }
    ],
    boardMembers: [
      { name: 'نذير احمد قادري', position: 'د عامه پوهاوي آمر' },
      { name: 'مولوي محمد عبدالله', position: 'د کشافانو آمر' },
      { name: 'مولوي ګل احمد هاشمي', position: 'د تدارکاتو او چارو آمر' }
    ]
  }
}) => {
  const [formData, setFormData] = React.useState(initialData);
  const componentRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

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
    const newId = `s${newBids.length + 1}`;
    newBids.push({
      supplierId: newId,
      supplierName: `New Supplier ${newBids.length + 1}`,
      unitPrices: new Array(formData.items?.length || 0).fill(0),
      totalPrices: new Array(formData.items?.length || 0).fill(0),
      grandTotal: 0
    });
    setFormData({ ...formData, bids: newBids });
  };

  const addItem = () => {
    const newItems = [...(formData.items || [])];
    const newId = newItems.length > 0 ? Math.max(...newItems.map(i => i.id)) + 1 : 1;
    newItems.push({
      id: newId,
      name: 'New Item',
      description: '',
      quantity: 1
    });
    
    // Update all bids to have one more price entry
    const newBids = (formData.bids || []).map(bid => ({
      ...bid,
      unitPrices: [...bid.unitPrices, 0],
      totalPrices: [...bid.totalPrices, 0]
    }));

    setFormData({ ...formData, items: newItems, bids: newBids });
  };

  const [awarding, setAwarding] = React.useState(false);

  const handleAwardBid = async () => {
    const winner = formData.bids?.find(b => b.isWinner);
    if (!winner) {
      toast.error("Please select a winner first");
      return;
    }

    setAwarding(true);
    try {
      await procurementService.selectWinner({
        tenderId: 'TENDER-MOCK-ID', // In real app, this comes from props
        quotationId: winner.supplierId,
        supplierName: winner.supplierName,
        items: formData.items?.map((item, idx) => ({
          ...item,
          unitPrice: winner.unitPrices[idx],
          totalPrice: winner.totalPrices[idx]
        }))
      });
      toast.success(`Contract officially awarded to ${winner.supplierName}`);
    } catch (e) {
      toast.error("Failed to award bid. Check network connection.");
    } finally {
      setAwarding(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="flex gap-4 no-print">
        <button 
          onClick={() => handlePrint()}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
        >
          <Printer size={18} />
          Print Comparison Matrix
        </button>
        <button 
          onClick={addSupplier}
          className="flex items-center gap-2 bg-white text-slate-900 border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-md"
        >
          <UserPlus size={18} />
          Add Supplier
        </button>
        <button 
          onClick={addItem}
          className="flex items-center gap-2 bg-white text-slate-900 border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-md"
        >
          <PlusCircle size={18} />
          Add Item
        </button>
        <button 
          onClick={() => handlePrint()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg"
        >
          <Download size={18} />
          Download PDF
        </button>
        <button 
          onClick={handleAwardBid}
          disabled={awarding}
          className="flex items-center gap-2 bg-[#0F8F7F] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#26A69A] transition-all shadow-lg disabled:opacity-50"
        >
          <Award size={18} />
          {awarding ? 'Awarding...' : 'Award Bid'}
        </button>
      </div>

      {/* Form Area */}
      <div 
        ref={componentRef}
        dir="rtl"
        className="a4-page font-sans text-slate-900 border border-slate-200 overflow-x-hidden"
      >
        <DocumentHeader 
          title="د نرخ اخستنې میعارې مقایسوي پاڼه" 
          projectTitle={formData.projectTitle || ''} 
        />

        <div className="text-[11px] mb-4 p-3 bg-slate-50 border border-slate-900 font-bold leading-relaxed">
          <p><span className="text-red-700">تدارکاتي تشریح:</span> 
            <input 
              value={formData.procurementDescription}
              onChange={(e) => setFormData({...formData, procurementDescription: e.target.value})}
              className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded w-full"
            />
          </p>
        </div>

        {/* Comparison Table */}
        <div className="w-full border-2 border-slate-900 mb-6 overflow-hidden">
          <table className="w-full border-collapse text-[9px] text-center">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900">
                <th rowSpan={2} className="border-l-2 border-slate-900 p-1 w-8">شمیره</th>
                <th rowSpan={2} className="border-l-2 border-slate-900 p-1 w-24">د جنس نوم</th>
                <th rowSpan={2} className="border-l-2 border-slate-900 p-1 w-40">د جنس تشریح</th>
                <th rowSpan={2} className="border-l-2 border-slate-900 p-1 w-10">مقدار</th>
                {formData.bids?.map((bid, i) => (
                  <th key={i} colSpan={2} className="border-l-2 border-slate-900 p-1 bg-slate-200 relative group">
                    <input 
                      value={bid.supplierName}
                      onChange={(e) => {
                        const newBids = [...(formData.bids || [])];
                        newBids[i].supplierName = e.target.value;
                        setFormData({...formData, bids: newBids});
                      }}
                      className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded w-full text-center font-black"
                    />
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50 border-b-2 border-slate-900">
                {formData.bids?.map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="border-l border-slate-900 p-1">فی واحد قیمت</th>
                    <th className="border-l-2 border-slate-900 p-1">مجموعي قیمت</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {formData.items?.map((item, itemIdx) => (
                <tr key={itemIdx} className="border-b border-slate-900">
                  <td className="border-l-2 border-slate-900 p-1">{item.id}</td>
                  <td className="border-l-2 border-slate-900 p-1 font-bold">
                    <input 
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...(formData.items || [])];
                        newItems[itemIdx].name = e.target.value;
                        setFormData({...formData, items: newItems});
                      }}
                      className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded w-full text-center font-bold"
                    />
                  </td>
                  <td className="border-l-2 border-slate-900 p-1 text-right pr-2">
                    <textarea 
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...(formData.items || [])];
                        newItems[itemIdx].description = e.target.value;
                        setFormData({...formData, items: newItems});
                      }}
                      className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded w-full text-right text-[8px] resize-none"
                      rows={2}
                    />
                  </td>
                  <td className="border-l-2 border-slate-900 p-1 font-black">
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const newItems = [...(formData.items || [])];
                        newItems[itemIdx].quantity = val;
                        
                        // Recalculate all bids for this item
                        const newBids = (formData.bids || []).map(bid => {
                          const unitPrice = bid.unitPrices[itemIdx] || 0;
                          const newTotalPrices = [...bid.totalPrices];
                          newTotalPrices[itemIdx] = unitPrice * val;
                          return {
                            ...bid,
                            totalPrices: newTotalPrices,
                            grandTotal: newTotalPrices.reduce((a, b) => a + b, 0)
                          };
                        });
                        
                        setFormData({...formData, items: newItems, bids: newBids});
                      }}
                      className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded w-full text-center font-black"
                    />
                  </td>
                  {formData.bids?.map((bid, bidIdx) => (
                    <React.Fragment key={bidIdx}>
                      <td className="border-l border-slate-400 p-1">
                        <input 
                          type="number"
                          value={bid.unitPrices[itemIdx] || 0}
                          onChange={(e) => updateUnitPrice(bidIdx, itemIdx, parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent border-none text-center focus:ring-1 focus:ring-emerald-500 rounded font-bold"
                        />
                      </td>
                      <td className="border-l-2 border-slate-900 p-1 font-black">
                        {bid.totalPrices[itemIdx]?.toLocaleString()}
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
              <tr className="bg-slate-100 font-black h-10 border-t-2 border-slate-900">
                <td colSpan={4} className="border-l-2 border-slate-900 p-1 text-right pr-4 text-[11px]">مجموعي قیمت په افغاني</td>
                {formData.bids?.map((bid, i) => (
                  <td key={i} colSpan={2} className={`border-l-2 border-slate-900 p-1 text-[12px] underline ${bid.isWinner ? 'text-[#0F8F7F] bg-emerald-50' : ''}`}>
                    {bid.grandTotal.toLocaleString()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Award Status */}
        <div className="grid grid-cols-3 gap-0 mb-8 border-2 border-slate-900 divide-x-2 divide-slate-900">
           {formData.bids?.map((bid, i) => (
             <button 
               key={i} 
               onClick={() => setWinner(i)}
               className={`p-4 flex flex-col items-center gap-2 transition-all ${bid.isWinner ? 'bg-emerald-50' : 'bg-slate-50 opacity-60 hover:opacity-100'}`}
             >
                <span className="text-[10px] font-black">{bid.supplierName}</span>
                {bid.isWinner ? (
                  <div className="flex items-center gap-1 text-emerald-600 font-black text-xs uppercase">
                    <Award size={14} /> Winner / ګټونکی
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-slate-400 font-black text-xs">
                    <XCircle size={14} /> Set as Winner
                  </div>
                )}
             </button>
           ))}
        </div>

        {/* Verification Note */}
        <div className="p-4 border-2 border-slate-900 rounded-lg mb-8 bg-amber-50/30 text-[10px] text-justify space-y-2">
           <div className="flex items-start gap-2 font-black">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>ملاحظات او پریکړه:</span>
           </div>
           <p className="leading-relaxed">د تدارکاتي هیئت لخوا د ټولو شرکتونو نرخونه په دقت سره وڅیړل شول، چې په پایله کې <span className="font-black underline mx-1">{formData.bids?.find(b => b.isWinner)?.supplierName}</span> شرکت د ټیټ نرخ او د موادو د لوړ کیفیت په پام کې نیولو سره د دې پروژې ګټونکی اعلان شو.</p>
        </div>

        {/* Signatures */}
        <div className="w-full border-2 border-slate-900">
           <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-900 font-black text-[11px] text-center divide-x-2 divide-slate-900">
              <div className="p-2">د هیئت نوم</div>
              <div className="p-2">وظیفه</div>
              <div className="p-2">ملاحظات او امضاء</div>
           </div>
           {formData.boardMembers?.map((member, i) => (
             <div key={i} className="grid grid-cols-3 border-b border-slate-900 last:border-b-0 divide-x-2 divide-slate-900 text-center text-[11px] font-bold">
                <div className="p-3">
                  <input 
                    value={member.name}
                    onChange={(e) => {
                      const newMembers = [...(formData.boardMembers || [])];
                      newMembers[i].name = e.target.value;
                      setFormData({...formData, boardMembers: newMembers});
                    }}
                    className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded w-full text-center"
                  />
                </div>
                <div className="p-3">
                   <input 
                    value={member.position}
                    onChange={(e) => {
                      const newMembers = [...(formData.boardMembers || [])];
                      newMembers[i].position = e.target.value;
                      setFormData({...formData, boardMembers: newMembers});
                    }}
                    className="bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded w-full text-center"
                  />
                </div>
                <div className="p-3 h-12"></div>
             </div>
           ))}
        </div>

        <div className="mt-auto pt-4 text-[8px] text-slate-400 flex justify-between items-center opacity-50">
           <span>Created with Kandahar University Procurement System Portal</span>
           <span>Generated at: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
