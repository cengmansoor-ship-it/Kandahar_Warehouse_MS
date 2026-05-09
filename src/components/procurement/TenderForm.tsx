import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Download, Plus, XCircle, Save, Trash2, Edit2 } from 'lucide-react';
import api, { procurementService } from '@/src/services/api';
import { toast } from 'sonner';
import { DocumentHeader } from './DocumentHeader';
import { ProcurementTable } from './ProcurementTable';
import { openPrintWindow } from '@/src/lib/print-utils';
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
  // Advanced customization state for labels (making the doc fully editable)
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ps';
  const [loading, setLoading] = useState(false);

  const [docMeta, setDocMeta] = useState({
    tenderTitle: t('tender_acquisition_title'),
    subtitle: t('tender_subtitle'),
    issuerLabel: t('issuer_details'),
    issuerAddress: t('issuer_address'),
    itemsLabel: t('procurement_notice'),
    dateLabel: t('date'),
    refLabel: t('reference'),
    signatureLabel: t('signatures'),
    boardHeading: t('tender_board_heading'),
    boardMemberLabel: t('board_member'),
    decisionLabel: t('decision'),
    decisionText: t('decision_text'),
    // Table headers
    hNum: t('number'),
    hCode: t('standard_id'),
    hName: t('item_nomenclature'),
    hDesc: t('description'),
    hUnit: t('unit'),
    hQty: t('quantity'),
    hPrice: t('unit_price'),
    hTotal: t('total_price'),
    footerLeft: t('manager_title'),
    footerDate: new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fa-AF', { year: 'numeric', month: 'numeric', day: 'numeric' }),
    footerText: t('university_digital_hub')
  });

  useEffect(() => {
    // Only update if not already edited? Or maybe just update anyway to respect locale.
    // Let's at least update the direction and the footer date.
    setDocMeta(prev => ({
      ...prev,
      tenderTitle: t('tender_acquisition_title'),
      subtitle: t('tender_subtitle'),
      issuerLabel: t('issuer_details'),
      issuerAddress: t('issuer_address'),
      itemsLabel: t('procurement_notice'),
      dateLabel: t('date'),
      refLabel: t('reference'),
      signatureLabel: t('signatures'),
      boardHeading: t('tender_board_heading'),
      boardMemberLabel: t('board_member'),
      decisionLabel: t('decision'),
      decisionText: t('decision_text'),
      hNum: t('number'),
      hCode: t('standard_id'),
      hName: t('item_nomenclature'),
      hDesc: t('description'),
      hUnit: t('unit'),
      hQty: t('quantity'),
      hPrice: t('unit_price'),
      hTotal: t('total_price'),
      footerLeft: t('manager_title'),
      footerDate: new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fa-AF', { year: 'numeric', month: 'numeric', day: 'numeric' }),
      footerText: t('university_digital_hub')
    }));
  }, [i18n.language, t]);

  const defaultData = {
    issueNumber: '۱۴۴۵/ / ',
    issueDate: new Date().toLocaleDateString('fa-AF', { year: 'numeric', month: 'numeric', day: 'numeric' }),
    issuerName: t('manager_title'),
    issuerAddress: t('kandahar_univ'),
    projectTitle: '',
    items: [],
    boardMembers: [t('board_member') + ' 1', t('board_member') + ' 2', t('board_member') + ' 3'],
    requestId: requestId
  };

  const [formData, setFormData] = React.useState(initialData || defaultData);
  const [customColumns, setCustomColumns] = useState<any[]>([]);

  const handleAddColumn = () => {
    const newColIndex = customColumns.length + 1;
    const colName = `Column ${newColIndex}`;
    const colKey = `custom_${Date.now()}_${newColIndex}`;
    
    setCustomColumns(prev => [...prev, { 
      header: colName, 
      key: colKey 
    }]);
    toast.success(`Column "${colName}" Added Successfully`);
  };

  const updateCustomColumnHeader = (index: number, newHeader: string) => {
    const newCols = [...customColumns];
    newCols[index] = { ...newCols[index], header: newHeader };
    setCustomColumns(newCols);
  };

  const removeCustomColumn = (index: number) => {
    const newCols = customColumns.filter((_, i) => i !== index);
    setCustomColumns(newCols);
    toast.info("Column Removed");
  };

  const componentRef = React.useRef<HTMLDivElement>(null);
  const [saving, setSaving] = React.useState(false);
  const [codes, setCodes] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if ((initialData as any).custom_columns) {
        setCustomColumns((initialData as any).custom_columns);
      }
    }
  }, [initialData]);

  const handleDownloadPDF = async () => {
    try {
      if (!componentRef.current) return;
      toast.info("Tip: For best Pashto/Dari support, use the 'Print' button to Save as PDF.");
      
      const doc = new jsPDF('p', 'mm', 'a4');
      
      doc.setFontSize(20);
      doc.setTextColor(15, 143, 127);
      doc.text("Kandahar University", 105, 20, { align: 'center' });
      doc.text(docMeta.tenderTitle || "Tender Document", 105, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Project: ${formData.projectTitle || 'N/A'}`, 14, 45);
      doc.text(`Doc No: ${formData.issueNumber || '-'}`, 14, 50);
      doc.text(`Date: ${formData.issueDate || '-'}`, 14, 55);

      const tableData = (formData.items || []).map((item, index) => [
        index + 1,
        item.code || '',
        item.name || '',
        item.description || '',
        item.unit || '',
        item.quantity || 0,
        (Number(item.unitPrice) || 0).toLocaleString(),
        ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString(),
        ...customColumns.map(cc => (item as any)[cc.key] || '')
      ]);

      const headers = [[
        docMeta.hNum, docMeta.hCode, docMeta.hName, docMeta.hDesc, docMeta.hUnit, 
        docMeta.hQty, docMeta.hPrice, docMeta.hTotal, 
        ...customColumns.map(c => c.header)
      ]];

      autoTable(doc, {
        head: headers,
        body: tableData,
        startY: 65,
        theme: 'grid',
        styles: { fontSize: 6, cellPadding: 1 },
        headStyles: { fillColor: [15, 143, 127], textColor: [255, 255, 255] }
      });

      doc.save(`Tender-${formData.issueNumber || 'Draft'}.pdf`);
      toast.success("Tender PDF exported");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF");
    }
  };

  const handlePrint = () => {
    const title = `${t('tender_acquisition_title')} - ${formData.issueNumber || 'Draft'}`;
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
            <div style="font-size: 18px; margin-top: 10px; color: #0F8F7F;">${t('tender_acquisition_title').toUpperCase()}</div>
          </td>
          <td width="20%" style="text-align: right;"><img src="${govLogo}" class="logo" /></td>
        </tr>
      </table>
      <div id="print-content">
        ${document.querySelector('.tender-form-content')?.innerHTML || 'No content found'}
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
        boardMembers: formData.boardMembers,
        custom_columns: customColumns // Persist custom columns
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

  const baseColumns = React.useMemo(() => [
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
          <option value="">{t('select_code')}</option>
          {codes.map((c, i) => <option key={`${c.code}-${i}`} value={c.code}>{c.code} - {c.title}</option>)}
        </select>
      ) : row.code
    },
    { 
      header: <EditableField value={docMeta.hName} onSave={(val) => setDocMeta({...docMeta, hName: val})} isEditable={isEditable} />, 
      key: 'name', 
      width: '180px',
      render: (row: Item, idx: number) => isEditable ? (
        <input 
          value={row.name || ''} 
          onChange={(e) => updateItem(idx, 'name', e.target.value)}
          placeholder={t('enter_item_name')}
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
          value={row.description || ''} 
          onChange={(e) => updateItem(idx, 'description', e.target.value)}
          placeholder={t('specifications')}
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
          value={row.unit || ''} 
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
          value={row.quantity || 0} 
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
  ], [docMeta, isEditable, codes, t]);

  const allColumns = React.useMemo(() => [
    ...baseColumns.slice(0, baseColumns.length - 1),
    ...customColumns.map((cc, cIdx) => ({
       header: (
         <div className="flex flex-col items-center gap-1">
           <EditableField 
             value={cc.header} 
             onSave={(val) => updateCustomColumnHeader(cIdx, val)} 
             isEditable={isEditable} 
             className="text-center"
           />
           {isEditable && (
             <button 
               onClick={() => removeCustomColumn(cIdx)}
               className="text-[8px] text-red-500 hover:text-red-700 uppercase font-black no-print"
             >
               Delete
             </button>
           )}
         </div>
       ),
       key: cc.key,
       width: '100px',
       render: (row: any, idx: number) => isEditable ? (
         <input 
           value={row[cc.key] || ''} 
           onChange={(e) => updateItem(idx, cc.key, e.target.value)}
           className="w-full bg-white border-0 text-[10px] font-black focus:ring-1 focus:ring-emerald-500 rounded p-1 text-center"
         />
       ) : row[cc.key]
    })),
    baseColumns[baseColumns.length - 1]
  ], [baseColumns, customColumns, isEditable]);


  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div 
        ref={componentRef}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative a4-page font-sans text-slate-900 border-2 border-slate-900 bg-white shadow-2xl overflow-hidden"
      >

        <div className="p-12 tender-form-content">
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
                {isEditable && (
                  <>
                    <button onClick={addItem} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-emerald-500/10">
                      <Plus size={16} /> {t('add_row')}
                    </button>
                    <button 
                      onClick={handleAddColumn} 
                      className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg active:scale-95"
                    >
                      <Plus size={16} /> {t('add_column')}
                    </button>
                    <button onClick={handleSaveToSystem} disabled={saving} className="p-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-sky-600/10 disabled:opacity-50">
                      <Save size={16} /> {saving ? t('saving') : t('save_complete')}
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
                   <input value={(formData as any)[field.key] || ''} onChange={(e) => setFormData({...formData, [field.key]: e.target.value})} className="border-b-2 border-slate-900 flex-1 bg-transparent focus:outline-none focus:border-[#0F8F7F] transition-colors font-black h-8 px-2" placeholder={t('enter_details')} />
                 ) : (
                   <span className="border-b-2 border-slate-900 flex-1 h-8 flex items-end">{(formData as any)[field.key]}</span>
                 )}
               </div>
             ))}
          </div>

          <div className="text-[12px] leading-relaxed mb-6 font-bold text-justify bg-white p-6 rounded-xl border-2 border-slate-900">
             <EditableField value={docMeta.subtitle} onSave={(val) => setDocMeta({...docMeta, subtitle: val})} multiline isEditable={isEditable} />
          </div>

          <div className={`mb-4 ${isRtl ? 'text-start' : 'text-left'}`}>
             <EditableField value={docMeta.itemsLabel} onSave={(val) => setDocMeta({...docMeta, itemsLabel: val})} className="font-black text-slate-900 underline decoration-2 underline-offset-4" isEditable={isEditable} />
          </div>

          <ProcurementTable columns={allColumns} data={formData.items || []} />

          <div className={`mt-12 p-8 bg-white rounded-2xl border-2 border-slate-900 space-y-4 ${isRtl ? 'text-start' : 'text-left'}`}>
             <EditableField value={docMeta.decisionLabel} onSave={(val) => setDocMeta({...docMeta, decisionLabel: val})} className="font-black text-slate-900 text-lg underline" isEditable={isEditable} />
             <textarea 
               value={docMeta.decisionText || ''} 
               onChange={(e) => setDocMeta({...docMeta, decisionText: e.target.value})}
               className={`w-full bg-transparent border-0 focus:ring-0 text-xs leading-relaxed text-slate-600 italic font-bold h-24 resize-none ${isRtl ? 'text-right' : 'text-left'}`}
             />
          </div>

          <div className="grid grid-cols-2 gap-12 mt-16 text-[14px]">
            <div className="space-y-6">
              <div className="border-2 border-slate-900 p-6 h-48 rounded-2xl flex flex-col justify-between items-center bg-white shadow-md">
                <EditableField value={docMeta.signatureLabel} onSave={(val) => setDocMeta({...docMeta, signatureLabel: val})} className="font-black text-[10px] uppercase text-slate-400 text-center" isEditable={isEditable} />
                <div className="text-center font-black">
                  <div className="text-lg">
                    <EditableField value={docMeta.footerLeft} onSave={(v) => setDocMeta({...docMeta, footerLeft: v})} isEditable={isEditable} />
                  </div>
                  <div className="text-[10px] text-slate-500">
                    <EditableField value={docMeta.footerDate} onSave={(v) => setDocMeta({...docMeta, footerDate: v})} isEditable={isEditable} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <EditableField value={docMeta.boardHeading} onSave={(val) => setDocMeta({...docMeta, boardHeading: val})} className="text-lg font-black text-black underline mb-6" isEditable={isEditable} />
              {formData.boardMembers?.map((member, idx) => (
                <div key={idx} className="flex gap-3 font-black items-center">
                   <EditableField value={docMeta.boardMemberLabel || ''} onSave={(val) => setDocMeta({...docMeta, boardMemberLabel: val})} className="shrink-0" isEditable={isEditable} />
                   {isEditable ? (
                     <input value={member || ''} placeholder={t('board_member')} onChange={(e) => {
                        const newMembers = [...(formData.boardMembers || [])];
                        newMembers[idx] = e.target.value;
                        setFormData({...formData, boardMembers: newMembers});
                     }} className={`border-b-2 border-slate-900 flex-1 bg-transparent focus:outline-none focus:border-[#0F8F7F] transition-colors py-1 h-8 ${isRtl ? 'text-right' : 'text-left'}`} />
                   ) : (
                     <span className={`border-b-2 border-slate-900 flex-1 py-1 h-8 flex items-end ${isRtl ? 'text-right' : 'text-left'}`}>{member || ''}</span>
                   )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 pb-8 text-[10px] text-slate-500 text-center border-t-2 border-slate-900 font-black italic bg-slate-50">
          <EditableField value={docMeta.footerText} onSave={(v) => setDocMeta({...docMeta, footerText: v})} isEditable={isEditable} />
        </div>
      </div>
    </div>
  );
};
