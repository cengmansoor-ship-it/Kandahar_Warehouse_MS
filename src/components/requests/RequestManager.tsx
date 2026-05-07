import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { requestService } from '@/src/services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  FileText,
  PlusCircle,
  Tag,
  Package,
  List as ListIcon,
  Trash2,
  Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { ItemHierarchyModal } from '../inventory/ItemHierarchyModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import api from '@/src/services/api';

export const RequestManager = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedItemForRequest, setSelectedItemForRequest] = useState<any>(null);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchRequests();
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const [facRes, deptRes] = await Promise.all([
        api.get('/faculties'),
        api.get('/departments')
      ]);
      setFaculties(Array.isArray(facRes.data) ? facRes.data : []);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
    } catch (error) {
      console.error("Failed to load support data", error);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests'); // Direct call
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error("Failed to load requests");
      console.error(error);
    } finally {
      setTimeout(() => setLoading(false), 500); // Small delay to ensure state settles
    }
  };

  const [requesterInfo, setRequesterInfo] = useState({
    name: '',
    email: '',
    faculty: '',
    department: '',
    role: '',
    cellNumber: ''
  });

  const [approvers, setApprovers] = useState<{name: string, role: string, approved: boolean}[]>([
    { name: '', role: 'Supervisor', approved: false },
    { name: '', role: 'Finance', approved: false },
    { name: '', role: 'Director', approved: false }
  ]);

  const addApproverSlot = () => {
    setApprovers([...approvers, { name: '', role: 'Member', approved: false }]);
  };

  const removeApproverSlot = (idx: number) => {
    setApprovers(approvers.filter((_, i) => i !== idx));
  };

  const updateApprover = (idx: number, field: string, value: any) => {
    const newApprovers = [...approvers];
    // @ts-ignore
    newApprovers[idx][field] = value;
    setApprovers(newApprovers);
  };

  const handleRequestItem = async (itemData: any) => {
    if (!requesterInfo.name || !requesterInfo.email || !requesterInfo.faculty) {
      toast.error("Please fill in all requester information");
      return;
    }

    try {
      setLoading(true);
      const payload = { 
        title: `Requirement: ${itemData.name}`,
        requester: requesterInfo.name,
        requesterEmail: requesterInfo.email,
        requesterFaculty: requesterInfo.faculty,
        requesterDepartment: requesterInfo.department,
        requesterRole: requesterInfo.role,
        requesterPhone: requesterInfo.cellNumber,
        status: 'Pending',
        progress: 0,
        item_code: itemData.item_code,
        bab_code: itemData.bab_code,
        fasl_code: itemData.fasl_code,
        items: [{ ...itemData, quantity: 1 }],
        approvalChain: approvers.filter(a => a.name.trim() !== '')
      };
      
      const res = await api.post('/requests', payload);

      // Send Confirmation Email
      try {
        const emailRes = await api.post('/send-email', {
          to: requesterInfo.email,
          subject: 'Request Received: Kandahar University Logistics',
          text: `Hello ${requesterInfo.name},\nYour request for ${itemData.name} has been received and is currently under review.\nTracking ID: ${res.data.trackingId}\nThank you!`,
          requestId: res.data.id,
          type: 'confirmation'
        });
        
        if (emailRes.data.simulated) {
          toast.info("Notification Simulated", {
            description: "To send real Gmail notifications, configure MAIL_USER and MAIL_PASS in Settings."
          });
        }
      } catch (e) {
        console.warn("Notification email failed to send", e);
      }

      toast.success(`Request for ${itemData.name} submitted successfully`);
      setShowRequestModal(false);
      fetchRequests();
    } catch (error) {
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [printFilters, setPrintFilters] = useState({ from: '', to: '' });

  const handlePrintAll = () => {
    window.print();
  };

  const handlePrintRange = () => {
    if (!printFilters.from || !printFilters.to) {
      toast.error("Please select both dates");
      return;
    }
    
    const filtered = requests.filter(r => {
      const date = new Date(r.createdAt).toISOString().split('T')[0];
      return date >= printFilters.from && date <= printFilters.to;
    });

    if (filtered.length === 0) {
      toast.error("No requests found in this range");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.outerHTML).join('\n');
    
    const content = filtered.map(req => `
      <div style="page-break-after: always; padding: 40px; border: 4px solid black; border-radius: 40px; margin-bottom: 40px;">
        <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 20px;">Request ID: ${req.trackingId}</h1>
        <p><strong>Requester:</strong> ${req.requester}</p>
        <p><strong>Status:</strong> ${req.status}</p>
        <p><strong>Date:</strong> ${new Date(req.createdAt).toLocaleDateString()}</p>
        <h3>Items:</h3>
        <ul>
          ${(req.items || []).map((i: any) => `<li>${i.name} (${i.quantity || 1})</li>`).join('')}
        </ul>
      </div>
    `).join('');

    printWindow.document.write(`
      <html dir="${t('lang_direction')}">
        <head><title>Batch Print</title>${styles}</head>
        <body style="background: white !important;">
          <div style="max-w-4xl mx-auto">${content}</div>
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowPrintOptions(false);
  };

  return (
    <div className="space-y-6">
      {showRequestModal && (
        <ItemHierarchyModal 
          onClose={() => setShowRequestModal(false)}
          onSelect={(item) => {
            setSelectedItemForRequest(item);
            setShowRequestModal(false);
          }}
        />
      )}

      {selectedItemForRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-8 lg:p-10 max-w-2xl w-full shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between text-start">
              <div>
                <h3 className="text-3xl font-black text-slate-900 italic">Finalize Request</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Configure requester details & approval chain</p>
              </div>
              <button 
                onClick={() => setSelectedItemForRequest(null)} 
                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
               <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Requester Information</h4>
                  <div className="space-y-3">
                     <div className="space-y-1 text-start">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Name</label>
                        <input 
                          placeholder="e.g. Ahmad Shah"
                          value={requesterInfo.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRequesterInfo({...requesterInfo, name: val});
                            
                            // Dynamic alert logic
                            if (val.length > 3) {
                              const existing = requests.filter(r => 
                                r.requester.toLowerCase().includes(val.toLowerCase()) && 
                                (r.status === 'Approved' || r.status === 'Delivered')
                              );
                              if (existing.length > 0) {
                                toast.warning(`Alert: ${val} already has items assignment.`, {
                                  duration: 5000,
                                  description: `${existing.length} items found.`
                                });
                              }
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary-teal/20"
                        />
                        {/* History Panel */}
                        {requesterInfo.name.length > 3 && (
                          <div className="bg-primary-teal/5 border border-primary-teal/10 rounded-2xl p-4 mt-2">
                             <div className="flex items-center justify-between mb-2">
                               <span className="text-[9px] font-black uppercase text-primary-teal tracking-widest">Requester History</span>
                             </div>
                             <div className="space-y-1.5 max-h-[80px] overflow-y-auto custom-scrollbar">
                               {requests.filter(r => 
                                 r.requester.toLowerCase().includes(requesterInfo.name.toLowerCase()) && 
                                 (r.status === 'Approved' || r.status === 'Delivered')
                               ).map((r, idx) => (
                                 <div key={idx} className="flex items-center justify-between bg-white/50 p-2 rounded-lg">
                                   <span className="text-[8px] font-black text-slate-700">{r.title}</span>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Official Email</label>
                        <input 
                          placeholder="ahmad@kdru.edu.af"
                          value={requesterInfo.email}
                          onChange={(e) => setRequesterInfo({...requesterInfo, email: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary-teal/20"
                        />
                     </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 text-start">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Faculty *</label>
                           <select 
                             value={requesterInfo.faculty}
                             onChange={(e) => {
                               const facultyId = e.target.value;
                               setRequesterInfo({
                                 ...requesterInfo, 
                                 faculty: facultyId,
                                 department: '' // Reset department
                               });
                               setFilteredDepartments(departments.filter(d => d.facultyId === facultyId));
                             }}
                             className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-[#0F8F7F]/20 appearance-none"
                             required
                           >
                             <option value="">Select Faculty</option>
                             {faculties.map(f => (
                               <option key={f.id} value={f.id}>{f.name}</option>
                             ))}
                           </select>
                        </div>
                        <div className="space-y-1 text-start">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Department *</label>
                           <select 
                             value={requesterInfo.department}
                             onChange={(e) => setRequesterInfo({...requesterInfo, department: e.target.value})}
                             disabled={!requesterInfo.faculty}
                             className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-[#0F8F7F]/20 appearance-none disabled:opacity-50"
                             required
                           >
                             <option value="">Select Dept</option>
                             {filteredDepartments.map(d => (
                               <option key={d.id} value={d.id}>{d.name}</option>
                             ))}
                           </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 text-start">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Position / Role</label>
                           <input 
                             placeholder="Lecturer"
                             value={requesterInfo.role}
                             onChange={(e) => setRequesterInfo({...requesterInfo, role: e.target.value})}
                             className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary-teal/20"
                           />
                        </div>
                        <div className="space-y-1 text-start">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Cell Number</label>
                           <input 
                             placeholder="070XXXXXXX"
                             value={requesterInfo.cellNumber}
                             onChange={(e) => setRequesterInfo({...requesterInfo, cellNumber: e.target.value})}
                             className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary-teal/20"
                           />
                        </div>
                      </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Approval Chain</h4>
                    <button 
                      type="button"
                      onClick={addApproverSlot}
                      className="w-8 h-8 bg-primary-teal/5 text-primary-teal rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <PlusCircle size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {approvers.map((approver, idx) => (
                      <div key={idx} className="flex flex-col p-3 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                        <button 
                          onClick={() => removeApproverSlot(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-100 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                        >
                          <XCircle size={14} />
                        </button>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <input 
                              placeholder="Name"
                              value={approver.name}
                              onChange={(e) => updateApprover(idx, 'name', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary-teal/20 transition-all font-mono"
                            />
                          </div>
                          <div className="w-1/3">
                            <select 
                              value={approver.role}
                              onChange={(e) => updateApprover(idx, 'role', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary-teal/20 transition-all appearance-none"
                            >
                              <option>Supervisor</option>
                              <option>Finance</option>
                              <option>Director</option>
                              <option>Member</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <button 
              onClick={() => {
                handleRequestItem(selectedItemForRequest);
                setSelectedItemForRequest(null);
              }}
              disabled={loading}
              className="w-full bg-slate-900 text-white py-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary-teal transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? 'Processing...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('requests')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none text-start">
            {t('requests_description')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowPrintOptions(!showPrintOptions)}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
            >
              <Printer size={18} />
              Print Options
            </button>
            {showPrintOptions && (
              <div className="absolute top-full mt-2 left-0 z-50 bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-2xl min-w-[300px] animate-in zoom-in-95 duration-200">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Print Date Range</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      value={printFilters.from} 
                      onChange={e => setPrintFilters({...printFilters, from: e.target.value})}
                      className="w-full p-2 text-[10px] font-black border-2 border-slate-100 rounded-xl outline-none focus:border-slate-900 transition-colors" 
                    />
                    <input 
                      type="date" 
                      value={printFilters.to} 
                      onChange={e => setPrintFilters({...printFilters, to: e.target.value})}
                      className="w-full p-2 text-[10px] font-black border-2 border-slate-100 rounded-xl outline-none focus:border-slate-900 transition-colors" 
                    />
                  </div>
                  <button 
                    onClick={handlePrintRange}
                    className="w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Print Range
                  </button>
                  <button 
                    onClick={handlePrintAll}
                    className="w-full py-3 bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Print All (Screen)
                  </button>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowRequestModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
          >
            <Plus size={18} />
            {t('create_official_request')}
          </button>
        </div>
      </div>

      <div className="fintech-card p-4 lg:p-6 bg-white flex flex-col md:flex-row items-center gap-4 lg:gap-6">
        <div className="relative flex-1 w-full text-start">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-300", t('lang_direction') === 'rtl' ? "right-5" : "left-5")} size={18} />
          <input 
            type="text" 
            placeholder={t('lookup_request_placeholder')}
            className={cn(
              "w-full bg-slate-50 border-none rounded-2xl py-4.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700",
              t('lang_direction') === 'rtl' ? "pr-14 pl-6" : "pl-14 pr-6"
            )}
          />
        </div>
        <button 
          onClick={() => toast.info(t('pipeline_filtering_soon'))}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-50 text-slate-400 px-8 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-primary-teal transition-all border border-slate-100 shadow-sm"
        >
          <Filter size={18} />
          {t('refine_pipeline')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          ))
        ) : (
          Array.isArray(requests) && requests.map((req) => (
            <RequestListItem key={req.id} request={req} onUpdate={fetchRequests} />
          ))
        )}
      </div>
    </div>
  );
};

import { smsService } from '@/src/services/smsService';

const RequestListItem: React.FC<{ request: any, onUpdate: () => void }> = ({ request, onUpdate }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const stages = [
    { name: 'Request', threshold: 0, icon: FileText },
    { name: 'Approval', threshold: 25, icon: CheckCircle2 },
    { name: 'Tender', threshold: 50, icon: Tag },
    { name: 'Comparison', threshold: 75, icon: ListIcon },
    { name: 'PO', threshold: 100, icon: Package }
  ];

  const statusConfig: Record<string, { color: string, icon: any }> = {
    'Pending': { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock },
    'Approved': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
    'Delivered': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
    'Procurement': { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: FileText },
    'Rejected': { color: 'text-red-600 bg-red-50 border-red-100', icon: XCircle },
    'TENDER_CREATED': { color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: Tag },
    'WINNER_SELECTED': { color: 'text-purple-600 bg-purple-50 border-purple-100', icon: Package },
  };

  const translatedStatus: Record<string, string> = {
    'Pending': t('status_pending'),
    'Approved': t('status_approved'),
    'Delivered': t('status_delivered'),
    'Procurement': t('status_procurement'),
    'Rejected': t('status_rejected'),
    'TENDER_CREATED': 'Tender Open',
    'WINNER_SELECTED': 'Winner Selected',
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
    if (progress > 0) return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]';
    return 'bg-slate-300';
  };

  const handleUpdate = async (status: string, progress: number) => {
    try {
      await requestService.updateStatus(request.id, { status, progress });
      
      // Automatic stock reduction when items are distributed (Approved/Issued)
      if (status === 'Approved' || status === 'Delivered') {
        const item = request.items?.[0];
        if (item && item.id) {
          try {
            await api.post('/distribute', {
              itemId: item.id,
              personName: request.requester,
              faculty: request.requesterFaculty,
              quantity: item.quantity || 1
            });
            
            // Send Ready for Pickup Email
            if (request.requesterEmail) {
                await api.post('/send-email', {
                    to: request.requesterEmail,
                    subject: 'Action Required: Item Ready for Pickup',
                    text: `Hello ${request.requester},\nGood news! Your request for "${item.name}" has been processed and is ready for pickup at the logistics center.\n\nTracking ID: ${request.trackingId}\n\nPlease bring your official ID when collecting.`,
                    requestId: request.id,
                    type: 'ready'
                });
            }

            toast.success(`Inventory updated: ${item.name} stock reduced.`);
          } catch (distError) {
            console.error("Post-approval workflow failure:", distError);
            toast.error("Status updated but failed downstream processes.");
          }
        }
      }

      toast.success(`Request ${status} successfully`);
      
      // Send SMS
      await smsService.notifyRequestUpdate(request, status);
      
      onUpdate();
    } catch (e) {
      toast.error(t('process_failed'));
    }
  };

  const handleDelete = async () => {
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/requests/${request.id}`);
      toast.success("Request moved to trash");
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete request");
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handlePrintRequest = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.outerHTML).join('\n');
    
    printWindow.document.write(`
      <html dir="${t('lang_direction')}">
        <head>
          <title>Request - ${request.trackingId}</title>
          ${styles}
          <style>
            @page { size: A4; margin: 20mm; }
            body { padding: 40px; font-family: sans-serif; background: white !important; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body class="bg-white">
          <div class="max-w-4xl mx-auto p-10 border-4 border-slate-900 rounded-[40px] bg-white">
            <div class="flex justify-between items-start mb-10 border-b-4 border-slate-900 pb-8">
              <div class="text-start">
                <h1 class="text-4xl font-black italic uppercase text-slate-900">Official Request</h1>
                <p class="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">Kandahar University Logistics System</p>
              </div>
              <div class="text-end">
                <div class="bg-black text-white px-4 py-1 rounded-lg font-mono text-sm font-black tracking-widest mb-2">${request.trackingId}</div>
                <div class="text-[10px] font-black uppercase text-slate-400">Date: ${new Date(request.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-12 mb-12">
               <div class="space-y-4">
                  <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-primary-teal border-b border-primary-teal/20 pb-2">Requester Details</h3>
                  <div class="space-y-2">
                    <div class="text-xl font-black text-slate-900">${request.requester}</div>
                    <div class="text-xs font-bold text-slate-500">${request.requesterEmail}</div>
                    <div class="text-[10px] font-black uppercase text-slate-400 mt-2">${request.requesterFaculty} / ${request.requesterDepartment || 'N/A'}</div>
                    <div class="text-[10px] font-black uppercase text-slate-400">${request.requesterRole}</div>
                  </div>
               </div>
               <div class="space-y-4">
                  <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-primary-teal border-b border-primary-teal/20 pb-2">Request Status</h3>
                  <div class="space-y-2">
                    <div class="text-2xl font-black text-slate-900">${request.status}</div>
                    <div class="text-xs font-bold text-slate-500">Progress: ${request.progress}%</div>
                  </div>
               </div>
            </div>

            <div class="mb-12">
               <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-4 bg-slate-50 p-3 rounded-xl">Requested Items</h3>
               <table class="w-full text-start border-collapse">
                 <thead>
                   <tr class="border-b-2 border-slate-900">
                     <th class="py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                     <th class="py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</th>
                     <th class="py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Code</th>
                   </tr>
                 </thead>
                 <tbody>
                   ${(request.items || []).map((item: any) => `
                     <tr class="border-b border-slate-100">
                       <td class="py-4 font-black text-slate-900 text-sm">${item.name}</td>
                       <td class="py-4 font-black text-slate-900 text-sm text-center">${item.quantity || 1}</td>
                       <td class="py-4 font-mono text-[10px] text-slate-400 text-center">${item.item_code || '---'}</td>
                     </tr>
                   `).join('')}
                 </tbody>
               </table>
            </div>

            ${request.approvalChain && request.approvalChain.length > 0 ? `
              <div class="mt-12 pt-8 border-t-2 border-slate-100">
                <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-8">Approval Chain Verification</h3>
                <div class="grid grid-cols-3 gap-8">
                  ${request.approvalChain.map((a: any) => `
                    <div class="flex flex-col items-center">
                      <div class="w-full h-24 border-2 border-slate-100 rounded-2xl mb-3 flex items-center justify-center">
                        ${a.approved ? '<span class="text-[8px] font-black uppercase text-emerald-500 border border-emerald-500 px-2 py-1 rounded">Electronically Signed</span>' : '<span class="text-[8px] font-black uppercase text-slate-300">Pending Signature</span>'}
                      </div>
                      <div class="text-[10px] font-black text-slate-900 uppercase">${a.name}</div>
                      <div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">${a.role}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div class="mt-20 pt-8 border-t border-slate-100 text-center">
              <p class="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Kandahar University Logistics Hub • Digital Verification System</p>
            </div>
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const config = statusConfig[request.status] || statusConfig['Pending'];
  const currentProgress = Number(request.progress) || 0;

  return (
    <div className="fintech-card p-8 bg-white group hover:shadow-2xl transition-all border border-slate-100">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-10">
        <div className="flex items-start gap-6 flex-1">
          <div className={cn("w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", config.color)}>
            <config.icon size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] bg-[#1A1D1F] text-white px-2 py-0.5 rounded-lg font-black tracking-widest shadow-sm">
                {request.trackingId}
              </span>
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest", config.color)}>
                {translatedStatus[request.status] || request.status}
              </span>
            </div>
            <h4 className="text-2xl font-black text-[#1A1D1F] mt-2 group-hover:text-primary-teal transition-colors tracking-tight leading-tight text-start">{request.title}</h4>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-slate-400 mt-2.5 font-black uppercase tracking-widest text-start">
                <span className="text-slate-900">{request.requester}</span>
                {request.requesterEmail && (
                  <>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="lowercase font-bold tracking-tight">{request.requesterEmail}</span>
                  </>
                )}
                {request.requesterFaculty && (
                  <>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-primary-teal">{request.requesterFaculty} {request.requesterDepartment && `(${request.requesterDepartment})`}</span>
                  </>
                )}
                <span className="w-1 h-1 bg-slate-300 rounded-full text-start" />
                <span className="text-start">{new Date(request.createdAt).toLocaleDateString()}</span>
              </div>

            {request.approvalChain && request.approvalChain.length > 0 && (
              <div className="mt-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1 text-start">Member Approval Flow</div>
                <div className="flex flex-wrap gap-4">
                  {request.approvalChain.map((approver: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 group/appr">
                      <button 
                        onClick={async () => {
                          const newChain = Array.isArray(request.approvalChain) ? [...request.approvalChain] : [];
                          newChain[i].approved = !newChain[i].approved;
                          
                          // Calculate new progress based on approvals
                          const approvedCount = newChain.filter((a: any) => a.approved).length;
                          const baseProgress = 0; // Request created
                          const approvalMax = 25;
                          const newProgress = Math.min(approvalMax, Math.round((approvedCount / newChain.length) * approvalMax));
                          
                          const finalStatus = approvedCount === newChain.length ? 'Approved' : 'Pending';
                          
                          try {
                            await api.patch(`/requests/${request.id}`, { 
                              approvalChain: newChain,
                              progress: finalStatus === 'Approved' ? 25 : newProgress,
                              status: finalStatus
                            });
                            toast.success(`Approval sync: ${approver.name}`);
                            onUpdate();
                          } catch (e) {
                            toast.error("Sync failed");
                          }
                        }}
                        className={cn(
                          "w-3 h-3 rounded-full border transition-all",
                          approver.approved ? "bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-white border-slate-300 group-hover/appr:border-primary-teal"
                        )} 
                      />
                      <div className="flex flex-col text-start">
                        <span className={cn("text-[10px] font-black uppercase leading-none", approver.approved ? "text-slate-900" : "text-slate-400")}>{approver.name}</span>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">{approver.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Visual Stepper */}
            <div className="mt-8 relative pt-2">
              <div className="flex items-center justify-between w-full relative z-10">
                {stages.map((stage, i) => {
                  const isActive = currentProgress >= stage.threshold;
                  const StageIcon = stage.icon;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 group/step">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2",
                        isActive 
                          ? "bg-primary-teal border-primary-teal text-white shadow-lg shadow-primary-teal/20" 
                          : "bg-white border-slate-100 text-slate-300"
                      )}>
                        <StageIcon size={16} />
                      </div>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-tighter opacity-0 group-hover/step:opacity-100 transition-opacity",
                        isActive ? "text-primary-teal" : "text-slate-300"
                      )}>{stage.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-[21px] left-5 right-5 h-0.5 bg-slate-100 -z-0">
                <div 
                  className="h-full bg-primary-teal shadow-[0_0_8px_rgba(13,148,136,0.3)] transition-all duration-700" 
                  style={{ width: `${Math.min(100, currentProgress)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 w-full xl:w-auto self-center">
          <div className="flex-1 w-full lg:w-48 text-start">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
              <span>{t('pipeline_progress')}</span>
              <span className="text-primary-teal">{currentProgress}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress}%` }}
                className={cn(
                  "h-full rounded-full transition-all",
                  request.status === 'Rejected' ? 'bg-red-500' : getProgressColor(currentProgress)
                )}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {request.status === 'Pending' && (
               <>
                 <button 
                   onClick={() => handleUpdate('Approved', 25)}
                   className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                 >
                   {t('approve_issue')}
                 </button>
                 <button 
                   onClick={() => handleUpdate('Rejected', 0)}
                   className="px-6 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 whitespace-nowrap"
                 >
                   {t('reject')}
                 </button>
               </>
             )}
             <button 
               onClick={handlePrintRequest}
               className="w-14 h-14 bg-white text-slate-900 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center border border-slate-900"
               title="Print Report"
             >
               <Printer size={20} />
             </button>
             <button 
               onClick={handleDelete}
               className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center border border-rose-100"
               title="Move to Trash"
             >
               <Trash2 size={20} />
             </button>
             <button 
               onClick={() => {
                 let tab = 'tender';
                 if (currentProgress >= 50 || request.status === 'TENDER_CREATED') tab = 'comparison';
                 if (currentProgress >= 75 || request.status === 'WINNER_SELECTED') tab = 'po';
                 navigate('/procurement', { state: { tab, requestId: request.id } });
               }}
               className={cn("w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl hover:bg-primary-teal hover:text-white transition-all shadow-sm flex items-center justify-center border border-slate-100 group-hover:border-primary-teal", t('lang_direction') === 'rtl' && "rotate-180")}
             >
               <ChevronRight size={24} />
             </button>
          </div>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Move to Trash"
        message="Are you sure you want to move this request to the trash? It can be restored later."
        variant="warning"
      />
    </div>
  );
}
