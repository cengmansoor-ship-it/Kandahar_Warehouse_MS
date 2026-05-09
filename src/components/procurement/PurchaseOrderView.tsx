import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Printer, 
  Download, 
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  Calendar,
  Hash,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { DocumentHeader } from './DocumentHeader';
import { ProcurementTable } from './ProcurementTable';
import { openPrintWindow } from '@/src/lib/print-utils';
import api from '@/src/services/api';

const PurchaseOrderView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/procurement/orders?id=${id}`);
      if (res.data?.[0]) {
        setData(res.data[0]);
      } else {
        // Try direct ID if search fails
        const directRes = await api.get(`/procurement/orders/${id}`);
        setData(directRes.data);
      }
    } catch (error) {
      toast.error("Failed to load Purchase Order");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!data) return;

    const isRtl = i18n.language === 'ps';
    const title = `${t('purchase_order')} - ${data.poNumber}`;
    
    // Manual Construction of the A4 layout for Printing
    const content = `
      <div class="print-container" style="direction: ${isRtl ? 'rtl' : 'ltr'};">
        <div class="header-section" style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 5px;">${t('emirate_name')}</h1>
          <h2 style="font-size: 20px; font-weight: 900; margin-bottom: 5px;">${t('ministry_name')}</h2>
          <h3 style="font-size: 18px; font-weight: 900; margin-bottom: 20px;">${t('univ_name')}</h3>
          <div style="border-y: 2px solid #000; padding: 10px 0; margin: 20px 0;">
            <h4 style="font-size: 22px; font-weight: 900; text-transform: uppercase;">${t('purchase_order')}</h4>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
          <div><strong>${t('order_number')}:</strong> ${data.poNumber}</div>
          <div><strong>${t('date')}:</strong> ${data.poDate}</div>
          <div><strong>${t('equivalent')}:</strong> ${data.equivalent}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div style="text-align: start;">
            <h5 style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; font-weight: 900; font-size: 12px;">${t('purchasing_entity')}</h5>
            <p style="font-size: 14px; font-weight: bold; margin: 0;">${data.entityInfo?.name}</p>
            <p style="font-size: 11px; margin: 2px 0;">${data.entityInfo?.address}</p>
            <p style="font-size: 11px; margin: 2px 0;">${data.entityInfo?.email}</p>
          </div>
          <div style="text-align: start;">
            <h5 style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; font-weight: 900; font-size: 12px;">${t('bidder_winner')}</h5>
            <p style="font-size: 14px; font-weight: bold; margin: 0;">${data.handlerInfo?.name}</p>
            <p style="font-size: 11px; margin: 2px 0;">${data.handlerInfo?.position}</p>
            <p style="font-size: 11px; margin: 2px 0;">${data.handlerInfo?.phone}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="border: 1px solid #000; padding: 10px; font-size: 10px;">${t('number')}</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 10px;">${t('description')}</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 10px;">${t('quantity')}</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 10px;">${t('unit')}</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 10px;">${t('unit_price')}</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 10px;">${t('total_price')}</th>
            </tr>
          </thead>
          <tbody>
            ${(data.items || []).map((item: any, i: number) => `
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: center;">${i + 1}</td>
                <td style="border: 1px solid #000; padding: 10px;">${item.description}</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: center;">${item.unit}</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: right;">${Number(item.unitPrice).toLocaleString()} AFN</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: right;">${Number(item.totalPrice).toLocaleString()} AFN</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #eee;">
              <td colspan="5" style="border: 1px solid #000; padding: 15px; font-weight: 900; text-align: ${isRtl ? 'left' : 'right'}; uppercase">${t('total_amount')}</td>
              <td style="border: 1px solid #000; padding: 15px; font-weight: 900; text-align: right; color: #059669;">${data.items?.reduce((sum: number, item: any) => sum + (Number(item.totalPrice) || 0), 0).toLocaleString()} AFN</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-bottom: 50px; text-align: start;">
          <h6 style="font-weight: 900; text-transform: uppercase; font-size: 10px; margin-bottom: 10px;">${t('terms_conditions') || 'Terms & Conditions'}</h6>
          <div style="font-size: 11px; white-space: pre-wrap;">${data.terms}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 80px;">
          <div style="text-align: center;">
             <div style="border-top: 1px solid #000; padding-top: 5px; font-size: 10px; font-weight: 900;">${t('director_signature') || 'Authority Signature'}</div>
          </div>
          <div style="text-align: center;">
             <div style="border-top: 1px solid #000; padding-top: 5px; font-size: 10px; font-weight: 900;">${t('vendor_confirmation') || 'Vendor Confirmation'}</div>
          </div>
        </div>
      </div>
    `;

    openPrintWindow(title, content);
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.text("PURCHASE ORDER", 105, 20, { align: 'center' });
    doc.text(`PO Number: ${data.poNumber}`, 14, 40);
    doc.text(`Date: ${data.poDate}`, 14, 50);
    doc.text(`Description: ${data.procurementDescription}`, 14, 60);
    doc.save(`PO-${data.poNumber}.pdf`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="w-12 h-12 border-4 border-[#0F8F7F]/20 border-t-[#0F8F7F] rounded-full animate-spin" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Validating Purchase Order...</p>
    </div>
  );

  if (!data) return (
    <div className="text-center p-20">
      <h2 className="text-2xl font-black text-slate-900 mb-4">Purchase Order Not Found</h2>
      <button onClick={() => navigate(-1)} className="text-primary-teal font-black uppercase text-xs tracking-widest flex items-center gap-2 mx-auto">
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );

  const columns = [
    { header: t('number'), key: 'id', width: '40px', align: 'center' as const, render: (_: any, i: number) => i + 1 },
    { header: t('description'), key: 'description' },
    { header: t('quantity'), key: 'quantity', width: '60px', align: 'center' as const },
    { header: t('unit'), key: 'unit', width: '60px', align: 'center' as const },
    { header: t('unit_price'), key: 'unitPrice', width: '100px', align: 'right' as const, render: (row: any) => `${(Number(row.unitPrice) || 0).toLocaleString()} AFN` },
    { header: t('total_price'), key: 'totalPrice', width: '120px', align: 'right' as const, render: (row: any) => `${(Number(row.totalPrice) || 0).toLocaleString()} AFN` },
  ];

  const grandTotal = data.items?.reduce((sum: number, item: any) => sum + (Number(item.totalPrice) || 0), 0) || 0;

  return (
    <div className="flex flex-col items-center gap-8 p-6 pb-24">
      <div className="w-full max-w-5xl flex justify-between items-center no-print bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} /> {t('back')}
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
          >
            <Printer size={16} /> {t('print')}
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/10"
          >
            <Download size={16} /> {t('export_pdf') || 'Export PDF'}
          </button>
        </div>
      </div>

      <div 
        ref={componentRef}
        dir={t('lang_direction') === 'rtl' ? 'rtl' : 'ltr'}
        className="relative a4-page font-sans text-slate-900 border-2 border-slate-900 bg-white shadow-2xl overflow-hidden p-12"
      >
        <DocumentHeader 
          title={<div className="text-3xl font-black text-emerald-900">{t('purchase_order')}</div>}
          projectTitle={data.procurementDescription}
        />

        <div className="grid grid-cols-3 gap-6 mb-10 mt-8 border-y-2 border-slate-900 py-8 font-black">
           <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">{t('order_number')}</span>
              <div className="flex items-center gap-2 text-lg text-emerald-600">
                <Hash size={18} /> {data.poNumber}
              </div>
           </div>
           <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">{t('date')}</span>
              <div className="flex items-center gap-2 text-lg">
                <Calendar size={18} /> {data.poDate}
              </div>
           </div>
           <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">{t('equivalent')}</span>
              <div className="flex items-center gap-2 text-lg">
                <ShieldCheck size={18} /> {data.equivalent}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-12">
           <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col gap-4 text-start">
              <h4 className="font-black text-primary-teal text-xs uppercase tracking-widest flex items-center gap-2 border-b border-primary-teal/20 pb-4">
                 <MapPin size={16} /> {t('purchasing_entity')}
              </h4>
              <div className="space-y-3 font-black text-slate-900">
                 <p className="text-lg">{data.entityInfo?.name}</p>
                 <p className="text-xs text-slate-500">{data.entityInfo?.address}</p>
                 <div className="flex items-center gap-2 text-xs pt-2" dir="ltr">
                    <Mail size={14} /> {data.entityInfo?.email}
                 </div>
              </div>
           </div>
           
           <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 flex flex-col gap-4 text-start">
              <h4 className="font-black text-emerald-600 text-xs uppercase tracking-widest flex items-center gap-2 border-b border-emerald-600/20 pb-4">
                 <CheckCircle size={16} /> {t('bidder_winner')}
              </h4>
              <div className="space-y-3 font-black text-emerald-900">
                 <p className="text-lg">{data.handlerInfo?.name}</p>
                 <p className="text-xs text-emerald-600/70">{data.handlerInfo?.position}</p>
                 <div className="flex items-center gap-2 text-xs pt-2" dir="ltr">
                    <Phone size={14} /> {data.handlerInfo?.phone}
                 </div>
              </div>
           </div>
        </div>

        <ProcurementTable columns={columns} data={data.items || []} />

        <div className="flex justify-between items-center p-8 bg-slate-900 text-white rounded-[32px] mb-12 shadow-2xl">
           <div className="flex flex-col gap-1">
             <span className="text-[10px] uppercase tracking-[0.4em] font-black opacity-50">{t('total_amount')}</span>
             <span className="text-xs font-black italic">{t('total_amount')}: {grandTotal.toLocaleString()} AFN</span>
           </div>
           <div className="text-4xl font-black tracking-tighter text-emerald-400">
              {grandTotal.toLocaleString()} <span className="text-sm">AFN</span>
           </div>
        </div>

        <div className="p-8 border-2 border-dashed border-slate-200 rounded-[32px] mb-16 text-start">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('terms_conditions') || 'Terms & Conditions'}</h4>
           <div className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
              {data.terms}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-20 font-black mt-20 pt-10 border-t-2 border-slate-900">
            <div className="space-y-10 text-start">
              <div className="pb-4 border-b-2 border-slate-900">{t('director_signature') || 'Authority Signature'}:</div>
              <div className="text-sm">{t('procurement')}: <span className="text-slate-400 italic">{t('seal_area')}</span></div>
            </div>
            <div className="space-y-10 text-start">
              <div className="pb-4 border-b-2 border-slate-900">{t('vendor_confirmation') || 'Vendor Confirmation'}:</div>
              <div className="text-sm">{t('representative_signature') || 'Representative Signature'}: ___________________</div>
            </div>
        </div>

        <div className="mt-24 py-8 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
           <span>{t('university_logistics_center')}</span>
           <span>{t('seal_area')}</span>
           <span>{t('id')}: PO-{data.id?.slice(-8).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderView;
