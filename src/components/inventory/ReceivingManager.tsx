import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ConfirmModal } from '../ui/ConfirmModal';
import { 
  Plus, 
  Search, 
  Truck, 
  Calendar, 
  User, 
  ArrowRight,
  ClipboardList,
  Upload,
  Download,
  FileSpreadsheet,
  X,
  Package,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  Tag,
  Hash,
  MapPin,
  CheckCircle2,
  Printer
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { openPrintWindow } from '@/src/lib/print-utils';
import api, { receivingService, inventoryService } from '@/src/services/api';
import { emailService } from '@/src/services/emailService';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

  const ConditionBadge = ({ condition }: { condition: string }) => {
    const { t } = useTranslation();
    const colors = {
      'New': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Used': 'bg-blue-50 text-blue-600 border-blue-100',
      'Damaged': 'bg-red-50 text-red-600 border-red-100',
      'Returned': 'bg-amber-50 text-amber-600 border-amber-100',
      'Needs Inspection': 'bg-slate-50 text-slate-600 border-slate-100'
    };
    return (
      <span className={cn(
        "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest leading-none",
        colors[condition as keyof typeof colors] || colors['Needs Inspection']
      )}>
        {condition === 'New' ? t('New') || 'New' : 
         condition === 'Used' ? t('Used') || 'Used' :
         condition === 'Damaged' ? t('Damaged') || 'Damaged' :
         condition === 'Returned' ? t('Returned') || 'Returned' :
         t('Needs Inspection') || condition}
      </span>
    );
  };

export const ReceivingManager = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [receivings, setReceivings] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('receivingViewMode') as 'grid' | 'list') || (window.innerWidth < 1024 ? 'grid' : 'list');
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQRData] = useState<any>(null);
  const [multipleQRs, setMultipleQRs] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const scannerRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    item_code: '',
    quantity: '',
    unit: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    warehouse_location: '',
    condition: 'New',
    notes: '',
    qr_code: ''
  });

  useEffect(() => {
    localStorage.setItem('receivingViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchData();
    if (location.state?.highlightId) {
      setHighlightedId(location.state.highlightId);
      setTimeout(() => {
        const el = document.getElementById(`receiving-${location.state.highlightId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);

      const timer = setTimeout(() => setHighlightedId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleGenerateQR = () => {
    // Generate unique ID representing item's unique identity
    const uniqueId = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    
    // Preparation for printing
    const qrDataForPrint = {
      item_code: formData.item_code || 'UNSYNCED',
      item_name: formData.item_name || 'New Item Detail',
      date: formData.date || new Date().toISOString().split('T')[0],
      qr_code: uniqueId
    };

    // Update form state with the new QR code
    setFormData(prev => ({ 
      ...prev, 
      qr_code: uniqueId,
      qrCodeId: uniqueId,
      qrCodeValue: uniqueId,
      syncStatus: 'pending',
      localTempId: `TEMP-${Date.now()}`
    }));

    setQRData(qrDataForPrint);
    toast.success("QR Code Generated: Preparing to Print...");
    
    const content = `
      <div class="label">
        <div class="title">${qrDataForPrint.item_name}</div>
        <div class="meta">${qrDataForPrint.item_code} | ${qrDataForPrint.date}</div>
        <div id="qrcode"></div>
        <div class="id-box">${qrDataForPrint.qr_code}</div>
        <div class="status">${t('university_logistics_center')}</div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
      <script>
        var qr = qrcode(0, 'M');
        qr.addData('${qrDataForPrint.qr_code}');
        qr.make();
        document.getElementById('qrcode').innerHTML = qr.createImgTag(8);
      </script>
    `;

    const styles = `
      body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
      .label { border: 2px solid #000; padding: 25px; border-radius: 12px; display: inline-block; min-width: 260px; background: white; }
      .title { font-weight: 900; font-size: 20px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: -0.5px; }
      .meta { font-size: 11px; color: #666; margin-bottom: 15px; font-weight: bold; border-top: 1px solid #eee; padding-top: 5px; }
      #qrcode { margin: 10px 0; }
      #qrcode img { display: block; margin: 0 auto; }
      .id-box { margin-top: 10px; font-family: 'Courier New', monospace; font-weight: 900; font-size: 14px; letter-spacing: 2px; background: #000; color: #fff; padding: 4px 10px; border-radius: 4px; display: inline-block; }
      .status { font-size: 8px; color: #999; margin-top: 8px; text-transform: uppercase; font-weight: bold; }
    `;

    openPrintWindow(`QR Label - ${qrDataForPrint.item_name}`, content, styles);
  };

  const filteredReceivings = (Array.isArray(receivings) ? receivings : []).filter(rec => {
    const searchStr = (searchTerm || '').toLowerCase();
    return (
      (rec.item_name || '').toLowerCase().includes(searchStr) ||
      (rec.item_code || '').toLowerCase().includes(searchStr) ||
      (rec.supplier || '').toLowerCase().includes(searchStr) ||
      (rec.invoice_number || '').toLowerCase().includes(searchStr) ||
      (rec.warehouse_location || '').toLowerCase().includes(searchStr)
    );
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, itemsRes] = await Promise.all([
        receivingService.getReceivings(),
        inventoryService.getItems()
      ]);
      setReceivings(recRes.data || []);
      setItems(itemsRes.data || []);
    } catch (error) {
      toast.error(t('failed_load_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode && editingId) {
        const res = await receivingService.updateReceiving(editingId, formData);
        const updatedRec = res.data.receiving || res.data;
        setReceivings(prev => prev.map(rec => (rec.id === editingId || rec._id === editingId) ? updatedRec : rec));
        toast.success(t('reception_updated_success'));
      } else {
        const res = await receivingService.addReceiving(formData);
        const newRec = res.data;
        // Optimization: Immediately show it
        setReceivings(prev => [newRec, ...prev]);
        toast.success(t('reception_logged_success'));

        // Set QR data for the new item
        setQRData({
          item_code: formData.item_code,
          item_name: formData.item_name,
          date: formData.date
        });
        setShowQRModal(true);

        // TRIGGER EMAIL NOTIFICATION (ONLY EMAIL!)
        // Simulate finding the person who requested this item
        const demoRequester = { name: "Dr. Ahmad Shah", email: "ahmad@kandahar.edu.af" };
        emailService.notifyItemArrival(demoRequester.name, demoRequester.email, formData.item_name || 'Requested Item');
      }
      setShowModal(false);
      resetForm();
      // Still fetch to ensure everything is in sync
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const resetForm = () => {
    setFormData({
      item_code: '',
      item_name: '',
      quantity: '',
      unit: '',
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      warehouse_location: '',
      condition: 'New',
      notes: '',
      qr_code: ''
    });
    setEditMode(false);
    setEditingId(null);
    setMultipleQRs([]);
    setQRData(null);
  };

  const handleEdit = (rec: any) => {
    setFormData({
      item_code: rec.item_code,
      quantity: rec.quantity.toString(),
      unit: rec.unit || '',
      supplier: rec.supplier,
      date: rec.date,
      invoice_number: rec.invoice_number || '',
      warehouse_location: rec.warehouse_location || '',
      condition: rec.condition || 'New',
      notes: rec.notes || ''
    });
    setEditMode(true);
    setEditingId(rec.id);
    setShowModal(true);
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    
    try {
      setLoadingId(recordToDelete);
      await api.delete(`/v1/receiving/${recordToDelete}`);
      setReceivings(prev => prev.filter(r => r.id !== recordToDelete && r._id !== recordToDelete));
      toast.success(t('record_deleted') || "Record deleted successfully");
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || t('delete_failed') || "Failed to delete record";
      toast.error(errorMsg);
    } finally {
      setLoadingId(null);
      setRecordToDelete(null);
      setShowConfirmModal(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        
        // VALIDATION
        const requiredFields = ['item_code', 'quantity', 'supplier', 'date'];
        const missingFieldsData = data.filter(row => {
          return !requiredFields.every(f => row[f] !== undefined && row[f] !== null && row[f] !== '');
        });

        if (missingFieldsData.length > 0) {
          toast.error(`${t('import_error') || 'Import Error'}: Some rows are missing mandatory fields (* item_code, quantity, supplier, date)`);
          setIsUploading(false);
          return;
        }

        console.log("Importing Excel data:", data);
        
        // FRONTEND DUPLICATE CHECK
        const uniqueData = data.filter(newItem => {
           const isDuplicate = receivings.some(existing => 
             existing.item_code === newItem.item_code && 
             existing.supplier === newItem.supplier && 
             existing.date === newItem.date &&
             existing.invoice_number === newItem.invoice_number
           );
           return !isDuplicate;
        });

        if (uniqueData.length === 0) {
          toast.error("No new unique records found in file");
          setIsUploading(false);
          return;
        }

        if (uniqueData.length < data.length) {
          toast.info(`Skipped ${data.length - uniqueData.length} duplicate records`);
        }
        
        try {
          // Send to server
          const res = await api.post('/v1/receiving/bulk', { items: uniqueData });
          toast.success(`${t('import_complete')} - ${res.data.count} new records added`);
          fetchData();
        } catch (error) {
          toast.error("Failed to sync imported data to server");
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      toast.error(t('failed_upload'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    try {
      if (!receivings || receivings.length === 0) {
        toast.error("No data to export");
        return;
      }
      
      // Map data to include '*' for mandatory fields in headers using translations
      const exportData = receivings.map(rec => {
        const row: any = {};
        row[`*${t('id') || 'ID'}`] = rec.item_code;
        row[t('name') || 'Item Name'] = rec.item_name;
        row[`*${t('quantity') || 'Quantity'}`] = rec.quantity;
        row[t('unit') || 'Unit'] = rec.unit;
        row[`*${t('supplier') || 'Supplier'}`] = rec.supplier;
        row[`*${t('date') || 'Date'}`] = rec.date;
        row[t('invoice') || 'Invoice Number'] = rec.invoice_number;
        row[t('location') || 'Warehouse Location'] = rec.warehouse_location;
        row[t('condition') || 'Condition'] = rec.condition;
        row[t('notes') || 'Notes'] = rec.notes;
        return row;
      });
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, t('receiving') || "Receivings");
      XLSX.writeFile(workbook, `${t('receiving') || 'Receivings'}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success(t('export_success') || "Data exported to Excel");
    } catch (error) {
      toast.error(t('export_failed'));
    }
  };

  const startScanner = () => {
    setShowScanner(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render((decodedText) => {
        try {
          const data = JSON.parse(decodedText);
              if (data.item_code || data.qr_code) {
                // Search for the item record
                const rec = receivings.find(r => r.qr_code === data.qr_code || r.item_code === data.item_code);
                if (rec) {
                  setScanResult(rec);
                } else {
                  setScanResult({
                    not_found: true,
                    decodedText,
                    data
                  });
                }
                toast.success("Scan successful");
                // Stop scanner
                scanner.clear();
              }
        } catch (e) {
          // Fallback if not JSON
          if (decodedText.length > 3) {
            const selectedItem = items.find(i => i.item_code === decodedText);
            setFormData(prev => ({
              ...prev,
              item_code: decodedText,
              item_name: selectedItem?.name || ''
            }));
            toast.success("Item Code scanned");
            scanner.clear();
            setShowScanner(false);
            setShowModal(true);
          }
        }
      }, (error) => {
        // Handle error
      });
      scannerRef.current = scanner;
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setShowScanner(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic leading-none">
            {t('receiving')}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
             <button 
               onClick={() => setViewMode('list')}
               className={cn(
                 "p-2 rounded-lg transition-all",
                 viewMode === 'list' ? "bg-white text-primary-teal shadow-sm" : "text-slate-400 hover:text-slate-600"
               )}
             >
               <ListIcon size={18} />
             </button>
             <button 
               onClick={() => setViewMode('grid')}
               className={cn(
                 "p-2 rounded-lg transition-all",
                 viewMode === 'grid' ? "bg-white text-primary-teal shadow-sm" : "text-slate-400 hover:text-slate-600"
               )}
             >
               <LayoutGrid size={18} />
             </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".xlsx,.csv"
          />
          <button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <Upload size={18} />
            {t('bulk_import')}
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={18} />
            {t('export_data')}
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
          >
            <Truck size={18} />
            {t('new_receipt')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="fintech-card p-8 bg-white border border-slate-100 group hover:border-primary-teal transition-all cursor-pointer" onClick={() => setShowModal(true)}>
          <div className="w-14 h-14 rounded-2xl bg-primary-teal/10 text-primary-teal flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Truck size={24} />
          </div>
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">{t('manual_data_entry') || 'Manual Data Entry'}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Record new arrivals manually into the ledger system with full detail tracking.
          </p>
        </div>

        <div className="fintech-card p-8 bg-white border border-slate-100 group hover:border-emerald-500 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Upload size={24} />
          </div>
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">{t('import_from_excel') || 'Import from Excel'}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Upload multiple records at once using standardized Excel templates.
          </p>
        </div>

        <div className="fintech-card p-8 bg-white border border-slate-100 group hover:border-amber-500 transition-all cursor-pointer" onClick={handleExport}>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Download size={24} />
          </div>
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">{t('export_to_excel') || 'Export to Excel'}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Generate comprehensive reports and export receiving history to Excel.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="fintech-card p-6 bg-white flex items-center gap-6">
          <div className="relative flex-1 w-full text-start">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-5" : "left-5")} size={18} />
            <input 
              type="text" 
              placeholder={t('search_receiving_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full bg-slate-50 border-none rounded-2xl py-4.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700 shadow-inner",
                t('lang_direction') === 'rtl' ? "pr-14 pl-6" : "pl-14 pr-6"
              )}
            />
          </div>
        </div>

        {loading ? (
          <div className="fintech-card p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">
             {t('sync_ledger')}
          </div>
        ) : filteredReceivings.length === 0 ? (
          <div className="fintech-card p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] bg-slate-50 border-dashed border-2 border-slate-200">
             {searchTerm ? `${t('clear')} "${searchTerm}"` : t('no_arrival_records')}
          </div>
        ) : viewMode === 'list' ? (
          <div className="fintech-card bg-white overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className={cn("w-full border-collapse min-w-[1200px]", t('lang_direction') === 'rtl' ? "text-right" : "text-left")}>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('arrival_info')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('logistics_invoice')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('location')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('quantity')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('condition')}</th>
                    <th className={cn("px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest", t('lang_direction') === 'rtl' ? "text-left" : "text-right")}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] font-bold uppercase tracking-wide">
                  {Array.isArray(filteredReceivings) && filteredReceivings.slice().reverse().map((rec) => (
                    <tr 
                      key={rec.id || rec._id} 
                      id={`receiving-${rec.id || rec._id}`}
                      className={cn(
                        "hover:bg-slate-50/80 transition-all group",
                        highlightedId === (rec.id || rec._id) && "bg-primary-teal/5 ring-1 ring-primary-teal/20"
                      )}
                    >
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900 text-xs leading-none mb-1 uppercase tracking-tight">{rec.item_name}</div>
                        <div className="text-slate-400 flex items-center gap-2 font-bold tracking-widest">
                           <Calendar size={12} /> {rec.date}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-slate-700 mb-1">{rec.supplier}</div>
                        <div className="text-primary-teal flex items-center gap-1 font-black tracking-widest">
                           <Hash size={12} /> {rec.invoice_number}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-600">
                           <MapPin size={12} className="text-slate-400" />
                           {rec.warehouse_location}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-lg border border-slate-200">
                          {rec.quantity} {rec.unit}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <ConditionBadge condition={rec.condition} />
                      </td>
                      <td className={cn("px-8 py-6", t('lang_direction') === 'rtl' ? "text-left" : "text-right")}>
                        <div className={cn("flex items-center gap-1", t('lang_direction') === 'rtl' ? "justify-start" : "justify-end")}>
                          <button 
                            onClick={() => {
                              setFormData({
                                item_code: rec.item_code,
                                item_name: rec.item_name,
                                quantity: rec.quantity,
                                unit: rec.unit,
                                date: rec.date,
                                invoice_number: rec.invoice_number,
                                warehouse_location: rec.warehouse_location,
                                condition: rec.condition,
                                supplier: rec.supplier,
                                notes: rec.notes || '',
                                qr_code: rec.qr_code
                              });
                              handleGenerateQR();
                            }}
                            title="Regenerate & Print QR"
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-500 transition-all"
                          >
                            <Printer size={16} />
                          </button>
                          <button onClick={() => handleEdit(rec)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary-teal transition-all">
                            <Edit size={16} />
                          </button>
                          <button 
                            type="button"
                            title="Delete"
                            disabled={loadingId === (rec.id || rec._id)}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const targetId = rec.id || rec._id;
                              handleDeleteClick(targetId);
                            }} 
                            className={cn(
                              "p-3 rounded-xl transition-all pointer-events-auto shadow-sm relative z-10",
                              loadingId === (rec.id || rec._id) ? "opacity-50 cursor-wait bg-slate-100" : "hover:bg-red-50 text-slate-400 hover:text-red-500 bg-white border border-slate-100"
                            )}
                          >
                            {loadingId === (rec.id || rec._id) ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent animate-spin rounded-full" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(filteredReceivings) && filteredReceivings.slice().reverse().map((rec) => (
              <div 
                key={rec.id || rec._id} 
                id={`receiving-${rec.id || rec._id}`}
                className={cn(
                  "fintech-card p-6 bg-white hover:border-primary-teal/30 transition-all group flex flex-col justify-between border border-slate-100 text-start",
                  highlightedId === (rec.id || rec._id) && "ring-2 ring-primary-teal shadow-xl scale-[1.02]"
                )}
              >
                <div>
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-primary-teal/10 text-primary-teal flex items-center justify-center">
                            <Package size={16} />
                         </div>
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{(rec.id || "").slice(0, 8)}</div>
                      </div>
                      <ConditionBadge condition={rec.condition} />
                   </div>
                   <h4 className="font-black text-slate-900 text-sm tracking-tight mb-2 italic leading-tight uppercase truncate">{rec.item_name}</h4>
                   
                   <div className="space-y-3 mt-6">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                         <span className="text-slate-400 uppercase tracking-widest">{t('volume')}</span>
                         <span className="text-slate-900 uppercase font-black">{rec.quantity} {rec.unit}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold">
                         <span className="text-slate-400 uppercase tracking-widest">{t('supplier')}</span>
                         <span className="text-slate-900 truncate max-w-[120px] font-black">{rec.supplier}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold">
                         <span className="text-slate-400 uppercase tracking-widest">{t('invoice')}</span>
                         <span className="text-primary-teal font-black tracking-widest">{rec.invoice_number}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold">
                         <span className="text-slate-400 uppercase tracking-widest">{t('location')}</span>
                         <span className="text-slate-600">{rec.warehouse_location}</span>
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      <Calendar size={14} />
                      {rec.date}
                   </div>
                    <div className="flex items-center gap-1">
                      <button 
                         onClick={() => {
                           setFormData({
                             item_code: rec.item_code,
                             item_name: rec.item_name,
                             quantity: rec.quantity,
                             unit: rec.unit,
                             date: rec.date,
                             invoice_number: rec.invoice_number,
                             warehouse_location: rec.warehouse_location,
                             condition: rec.condition,
                             supplier: rec.supplier,
                             notes: rec.notes || '',
                             qr_code: rec.qr_code
                           });
                           handleGenerateQR();
                         }}
                         title="Regenerate & Print QR"
                         className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-500 transition-all"
                       >
                         <Printer size={16} />
                       </button>
                      <button onClick={() => handleEdit(rec)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary-teal transition-all">
                        <Edit size={16} />
                      </button>
                      <button 
                        type="button"
                        disabled={loadingId === (rec.id || rec._id)}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const targetId = rec.id || rec._id;
                          console.log("CRITICAL DELETE CLICK (Grid):", targetId);
                          handleDeleteClick(targetId);
                        }} 
                        className={cn(
                          "p-3 rounded-xl transition-all pointer-events-auto border border-slate-100 shadow-sm relative z-0",
                          loadingId === (rec.id || rec._id) ? "opacity-50 cursor-wait bg-slate-50" : "hover:bg-red-50 text-slate-400 hover:text-red-500 bg-white"
                        )}
                      >
                        {loadingId === (rec.id || rec._id) ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent animate-spin rounded-full" /> : <Trash2 size={16} />}
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-10 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto lg:my-10">
            <div className="p-8 lg:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-10">
                <div className="text-start">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">
                     {editMode ? t('edit_receipt') : t('log_receipt')}
                   </h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{t('manual_ledger_admission')}</p>
                </div>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-6">
                 <div className="space-y-2 text-start">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('arrival_item')}</label>
                    <div className="relative">
                      <Package className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-4" : "left-4")} size={18} />
                      <select 
                        required
                        value={formData.item_code}
                        onChange={(e) => {
                          const code = e.target.value;
                          const selectedItem = items.find(i => i.item_code === code);
                          setFormData({
                            ...formData, 
                            item_code: code,
                            item_name: selectedItem?.name || ''
                          });
                        }}
                        className={cn(
                          "w-full bg-slate-50 border-none rounded-2xl py-4.5 pr-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all appearance-none text-slate-700",
                          t('lang_direction') === 'rtl' ? "pr-12 pl-6" : "pl-12 pr-6"
                        )}
                      >
                         <option key="default" value="">{t('select_sku')}</option>
                         {Array.isArray(items) && items.map(item => (
                           <option key={item.id} value={item.item_code}>{item.name} ({item.item_code})</option>
                         ))}
                      </select>
                    </div>
                 </div>

                  <div className="grid grid-cols-2 gap-6 text-start">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('quantity')}</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="000"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('unit_of_measure')}</label>
                       <select 
                         required
                         value={formData.unit}
                         onChange={(e) => setFormData({...formData, unit: e.target.value})}
                         className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all appearance-none text-slate-700"
                       >
                          <option value="">{t('select_unit') || 'Select Unit'}</option>
                          <option value="PCS">{t('pcs_long')}</option>
                          <option value="KG">{t('kg_long')}</option>
                          <option value="LTR">{t('ltr_long')}</option>
                          <option value="BOX">{t('box_long')}</option>
                          <option value="UNIT">{t('unit_long')}</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 text-start">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('arrival_date')}</label>
                      <input 
                        type="date" 
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('invoice_reference')}</label>
                       <input 
                         type="text" 
                         required
                         placeholder="INV-XXXXX"
                         value={formData.invoice_number}
                         onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                         className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700 font-mono tracking-widest"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 text-start">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('warehouse_location')}</label>
                       <div className="relative">
                         <MapPin className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-4" : "left-4")} size={18} />
                         <select 
                           required
                           value={formData.warehouse_location}
                           onChange={(e) => setFormData({...formData, warehouse_location: e.target.value})}
                           className={cn(
                             "w-full bg-slate-50 border-none rounded-2xl py-4.5 pr-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all appearance-none text-slate-700",
                             t('lang_direction') === 'rtl' ? "pr-12 pl-6" : "pl-12 pr-6"
                           )}
                         >
                            <option value="">{t('select_location')}</option>
                            <option value="Zone A-01">Zone A-01</option>
                            <option value="Zone B-12">Zone B-12</option>
                            <option value="Cold Storage">Cold Storage</option>
                            <option value="Main Rack 4">Main Rack 4</option>
                            <option value="Overflow">Overflow</option>
                         </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('entry_condition')}</label>
                       <div className="relative">
                         <Tag className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-4" : "left-4")} size={18} />
                         <select 
                           required
                           value={formData.condition}
                           onChange={(e) => setFormData({...formData, condition: e.target.value})}
                           className={cn(
                             "w-full bg-slate-50 border-none rounded-2xl py-4.5 pr-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all appearance-none text-slate-700",
                             t('lang_direction') === 'rtl' ? "pr-12 pl-6" : "pl-12 pr-6"
                           )}
                         >
                            <option value="New">{t('New') || 'New'}</option>
                            <option value="Used">{t('Used') || 'Used'}</option>
                            <option value="Damaged">{t('Damaged') || 'Damaged'}</option>
                            <option value="Returned">{t('Returned') || 'Returned'}</option>
                            <option value="Needs Inspection">{t('Needs Inspection') || 'Needs Inspection'}</option>
                         </select>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2 text-start">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('supplier_entity')}</label>
                    <div className="relative">
                      <User className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-4" : "left-4")} size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder={t('provider_placeholder')}
                        value={formData.supplier}
                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        className={cn(
                          "w-full bg-slate-50 border-none rounded-2xl py-4.5 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700",
                          t('lang_direction') === 'rtl' ? "pr-12 pl-6" : "pl-12 pr-6"
                        )}
                      />
                    </div>
                 </div>

                 {/* Notes */}
                 <div className="space-y-2 text-start">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('notes_optional')}</label>
                    <textarea 
                      placeholder={t('notes_placeholder')}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4.5 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all h-24 resize-none"
                    />
                 </div>

                 {/* QR Code Batch Generation Section */}
                 <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                             <Tag size={18} />
                          </div>
                          <div className="text-start">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">{t('qr_code_generation')}</h4>
                             <p className="text-[8px] font-bold text-slate-400 uppercase">{t('automatic_batch_label')}</p>
                          </div>
                       </div>
                        <button 
                          type="button"
                          onClick={handleGenerateQR}
                          className="bg-primary-teal text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-primary-teal/20"
                        >
                           <Printer size={14} />
                           {formData.qr_code ? 'Regenerate + Print' : 'Generate + Print'}
                        </button>
                    </div>
                    
                    {(formData.qr_code || multipleQRs.length > 0) && (
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                        {formData.qr_code && (
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 bg-slate-50 p-1 rounded-lg">
                               <QRCodeCanvas value={formData.qr_code} size={40} />
                            </div>
                            <div className="text-start">
                               <p className="text-[10px] font-black text-slate-900 font-mono tracking-tighter">{formData.qr_code}</p>
                               <span className="text-[8px] font-bold text-emerald-500 uppercase">{t('single_code_ready')}</span>
                            </div>
                          </div>
                        )}
                        {multipleQRs.length > 0 && (
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-black text-[12px]">
                               {multipleQRs.length}
                            </div>
                            <div className="text-start">
                               <p className="text-[10px] font-black text-slate-900 uppercase">{t('batch_generated')}</p>
                               <span className="text-[8px] font-bold text-emerald-500 uppercase">{multipleQRs.length} {t('codes_queued')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                 </div>

                 <div className="pt-6">
                    <button 
                      type="submit"
                      className="w-full bg-slate-900 text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4"
                    >
                      {editMode ? t('update_record') : t('acknowledge_sync')}
                      <ArrowRight size={18} className={cn(t('lang_direction') === 'rtl' && "rotate-180")} />
                    </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showQRModal && qrData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center space-y-6 animate-in zoom-in duration-300 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 italic uppercase">{t('generate_qr')}</h3>
            <div className="bg-slate-50 p-6 rounded-3xl inline-block border-4 border-slate-900 shadow-inner">
              <QRCodeCanvas 
                value={JSON.stringify(qrData)}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-start space-y-1">
              <p className="text-[10px] font-black text-slate-900 uppercase">{qrData.item_name}</p>
              <p className="text-[9px] font-bold text-slate-400 font-mono tracking-widest">{qrData.item_code}</p>
              <p className="text-[9px] font-bold text-slate-400">{qrData.date}</p>
            </div>
            <button 
              onClick={() => { setShowQRModal(false); setQRData(null); }}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all shadow-xl"
            >
              {t('close') || 'Close'}
            </button>
          </div>
        </div>
      )}

      {multipleQRs.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-4xl w-full max-h-[80vh] overflow-y-auto space-y-8 animate-in zoom-in duration-300 shadow-2xl custom-scrollbar">
            <div className="flex items-center justify-between no-print">
              <h3 className="text-2xl font-black text-slate-900 uppercase italic">Generated Batch QRs</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const title = `Batch QRs - ${multipleQRs.length}`;
                    const isRtl = i18n.language === 'ps';
                    const content = `
                      <div style="direction: ${isRtl ? 'rtl' : 'ltr'}; padding: 20px;">
                        <h1 style="text-align: center; margin-bottom: 40px; font-size: 24px; font-weight: 900;">${t('batch_generated')}</h1>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;">
                          ${multipleQRs.map((qr, i) => {
                            // We construct a simple image/text block for each QR
                            // Note: For real printing we might need a library but for simple layout HTML works
                            return `
                              <div style="text-align: center; border: 1px solid #eee; padding: 15px; border-radius: 10px;">
                                <div style="margin-bottom: 10px;">(QR: ${qr.id})</div>
                                <div style="font-size: 12px; font-weight: 900; font-family: monospace;">${qr.id}</div>
                                <div style="font-size: 10px; color: #666; margin-top: 5px;">${t('number')}: ${qr.index}</div>
                              </div>
                            `;
                          }).join('')}
                        </div>
                        <p style="margin-top: 40px; font-size: 10px; color: #999; text-align: center;">${t('university_logistics_center')}</p>
                      </div>
                    `;
                    openPrintWindow(title, content);
                  }}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all flex items-center gap-2"
                >
                  <Printer size={16} /> {t('print') || 'Print'}
                </button>
                <button 
                  onClick={() => setMultipleQRs([])}
                  className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all underline text-[10px] uppercase font-black"
                >
                  {t('close') || 'Close'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-4 bg-white">
              {multipleQRs.map((qr, i) => (
                <div key={i} className="flex flex-col items-center p-4 border border-slate-100 rounded-2xl bg-white shadow-sm">
                  <QRCodeCanvas 
                    value={JSON.stringify({ qr_code: qr.id })}
                    size={120}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="mt-2 text-center">
                    <p className="text-[10px] font-black text-slate-900 font-mono">{qr.id}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Entry #{qr.index}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-lg w-full space-y-6 animate-in slide-in-from-bottom duration-500 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 italic uppercase">{t('qr_scanner')}</h3>
              <button 
                onClick={stopScanner}
                className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div id="qr-reader" className="w-full overflow-hidden rounded-3xl border-4 border-slate-900 shadow-2xl bg-black aspect-square"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center italic">
              Position the QR code within the frame to scan automatically
            </p>
            <button 
              onClick={stopScanner}
              className="w-full bg-red-50 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100"
            >
              {t('close_scanner')}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title={t('confirm_delete') || 'Confirm Delete'}
        message={t('confirm_delete_record_msg') || 'Are you sure you want to permanently remove this record? This action cannot be undone.'}
        variant="danger"
      />
    </div>
  );
};
