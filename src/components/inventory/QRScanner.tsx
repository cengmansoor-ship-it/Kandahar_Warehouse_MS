import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  QrCode, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Calendar, 
  User, 
  Tag, 
  MapPin,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/src/services/api';
import { cn } from '@/src/lib/utils';
import { QRCodeCanvas } from 'qrcode.react';

export const QRScanner = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // Only init if not showing result
    if (!scanResult && !error) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: any) => console.error("Failed to clear scanner", error));
        scannerRef.current = null;
      }
    };
  }, [scanResult, error]);

  const onScanSuccess = async (decodedText: string) => {
    if (loading) return;
    
    // Stop scanner to prevent multiple scans
    if (scannerRef.current) {
      await scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/items/qr/resolve', { qrData: decodedText });
      setScanResult(response.data);
      toast.success("QR Code resolved successfully");
    } catch (err: any) {
      setError(err.response?.data?.error || "Item not found or invalid QR code.");
      setScanResult(null);
      toast.error("Failed to resolve QR code");
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error: any) => {
    // Quietly ignore scan failures
  };

  const handleReset = () => {
    setScanResult(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="text-start">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary-teal text-white flex items-center justify-center">
                <QrCode size={24} />
             </div>
             {t('qr_scanner') || 'QR Scanner'}
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
             {t('scan_item_to_view_details') || 'Scan an item QR code to see details'}
          </p>
        </div>
        {(scanResult || error) && (
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {t('scan_again') || 'Scan Again'}
          </button>
        )}
      </div>

      {!scanResult && !error && (
        <div className="bg-white p-6 md:p-12 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center space-y-8 min-h-[400px]">
          <div id="qr-reader" className="w-full max-w-md overflow-hidden rounded-[32px] border-4 border-slate-900 shadow-2xl shadow-slate-900/10"></div>
          <div className="flex items-center gap-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
            <Info size={16} className="text-primary-teal" />
            {t('center_qr_code') || 'Center the QR code in the frame'}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-12 rounded-[40px] border border-red-100 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
           <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center shadow-inner">
              <AlertCircle size={48} />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-red-900 uppercase tracking-tight">{t('resolver_error') || 'Resolution Failed'}</h3>
              <p className="text-red-600 font-bold uppercase text-[12px] tracking-widest bg-white/50 px-4 py-2 rounded-lg inline-block border border-red-100">{error}</p>
           </div>
           <button 
             onClick={handleReset}
             className="bg-white border border-red-200 text-red-600 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm"
           >
              {t('try_another') || 'Try Another Code'}
           </button>
        </div>
      )}

      {scanResult && (
        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in slide-in-from-bottom-10 duration-500">
           <div className="flex flex-col lg:flex-row gap-12">
              {/* Left Side: Status & Icon */}
              <div className="flex flex-col items-center lg:w-1/3 space-y-8">
                 <div className="w-48 h-48 bg-slate-50 p-6 rounded-[56px] border border-slate-100 flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-primary-teal/5 rounded-[56px] scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="w-full h-full bg-white rounded-[32px] border border-slate-200 p-3 flex items-center justify-center shadow-sm relative z-10">
                       <QRCodeCanvas value={scanResult.data.qrCodeValue || scanResult.data.item_code} size={140} />
                    </div>
                 </div>
                 
                 <div className="text-center space-y-3 w-full">
                    <div className={cn(
                      "px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest border shadow-sm inline-block w-full",
                      scanResult.syncStatus === 'synced' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                       {scanResult.syncStatus === 'synced' ? t('synced') || 'Synced' : t('not_synced_yet') || 'Not Synced Yet'}
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                       {scanResult.type === 'item' ? t('master_inventory_item') || 'Master Inventory Item' : t('receival_record') || 'Receival Record'}
                    </p>
                 </div>

                 <div className="w-full p-8 bg-slate-900 rounded-[32px] text-white shadow-xl shadow-slate-900/20">
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('stock_status') || 'Stock Status'}</span>
                       <div className="w-6 h-6 rounded-full bg-primary-teal/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-teal animate-pulse"></div>
                       </div>
                    </div>
                    <div className="text-2xl font-black uppercase tracking-tight">{scanResult.data.status || 'Active'}</div>
                 </div>
              </div>

              {/* Right Side: Details */}
              <div className="flex-1 space-y-10">
                 <div className="border-b border-slate-100 pb-8 text-start">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                          {scanResult.data.category || 'General'}
                       </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                       {scanResult.data.name || scanResult.data.item_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 mt-4">
                       <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                          <Tag size={14} className="text-primary-teal" />
                          {scanResult.data.item_code}
                       </div>
                       <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                          <Calendar size={14} className="text-primary-teal" />
                          {new Date(scanResult.data.createdAt || scanResult.data.date).toLocaleDateString()}
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailCard icon={<Package size={20} />} label={t('quantity') || 'Quantity'} value={`${scanResult.data.quantity} ${scanResult.data.unit || 'PCS'}`} />
                    <DetailCard icon={<MapPin size={20} />} label={t('location') || 'Location'} value={scanResult.data.location || scanResult.data.warehouse_location || 'N/A'} />
                    <DetailCard icon={<User size={20} />} label={t('personnel') || 'Dept / User'} value={scanResult.data.department || scanResult.data.received_by || 'N/A'} />
                    <DetailCard icon={<Info size={20} />} label={t('identifier') || 'ID Number'} value={scanResult.data.id || 'N/A'} />
                 </div>

                 {scanResult.data.notes && (
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-start">
                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          <Info size={14} />
                          {t('additional_notes') || 'Additional Notes'}
                       </div>
                       <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-slate-200 pl-6 py-1">
                          {scanResult.data.notes}
                       </p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const DetailCard = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-6 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 cursor-default">
     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary-teal group-hover:scale-110 transition-all duration-500 border border-slate-100 shadow-sm">
        {icon}
     </div>
     <div className="text-start">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{value}</div>
     </div>
  </div>
);
