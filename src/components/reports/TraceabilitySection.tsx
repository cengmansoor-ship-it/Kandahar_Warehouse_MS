import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, Target, ShieldCheck, LayoutGrid, User, Search, 
  Plus, Edit, Trash2, ArrowLeft, Camera, Package, Calendar,
  Activity, Clock, ChevronRight, MoreHorizontal, Image as ImageIcon,
  Printer, Download, FileSpreadsheet, FileJson
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import api, { traceabilityService, inventoryService } from '@/src/services/api';

type Level = 'ROOT' | 'FACULTIES_L1' | 'FACULTY_L2' | 'ADMIN_L1' | 'ADMIN_L2' | 'PERSONNEL_L3' | 'PERSONNEL_DETAILS';

interface TraceabilitySectionProps {
  onRefresh?: () => void;
}

export const TraceabilitySection: React.FC<TraceabilitySectionProps> = ({ onRefresh }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [level, setLevel] = useState<Level>('ROOT');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data State
  const [faculties, setFaculties] = useState<any[]>([]);
  const [adminUnits, setAdminUnits] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  // Selection State
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [selectedAdminUnit, setSelectedAdminUnit] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [personHistory, setPersonHistory] = useState<any[]>([]);

  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'FACULTY' | 'ADMIN_UNIT' | 'DEPARTMENT' | 'PERSONNEL'>('FACULTY');
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (selectedPerson && personnel.length > 0) {
      const updated = personnel.find(p => p.id === selectedPerson.id);
      if (updated && (updated.itemsCount !== selectedPerson.itemsCount || updated.image !== selectedPerson.image)) {
        setSelectedPerson(updated);
      }
    }
  }, [personnel, selectedPerson]);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const [facRes, adminRes, deptRes, perRes, itemRes] = await Promise.all([
        traceabilityService.getFaculties(),
        traceabilityService.getAdminUnits(),
        traceabilityService.getDepartments(),
        traceabilityService.getPersonnel(),
        inventoryService.getItems()
      ]);
      setFaculties(Array.isArray(facRes.data) ? facRes.data : []);
      setAdminUnits(Array.isArray(adminRes.data) ? adminRes.data : []);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setPersonnel(Array.isArray(perRes.data) ? perRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
    } catch (err) {
      toast.error("Failed to fetch traceability data");
    } finally {
      setLoading(false);
    }
  };

  const getPersonHistory = async (person: any) => {
    try {
      const res = await traceabilityService.getHistory({ personId: person.id });
      setPersonHistory(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation Logic
  const handleBack = () => {
    if (level === 'PERSONNEL_DETAILS') setLevel('PERSONNEL_L3');
    else if (level === 'PERSONNEL_L3') {
      if (selectedFaculty) setLevel('FACULTY_L2');
      else if (selectedAdminUnit) setLevel('ADMIN_L2');
    }
    else if (level === 'FACULTY_L2') setLevel('FACULTIES_L1');
    else if (level === 'ADMIN_L2') setLevel('ADMIN_L1');
    else setLevel('ROOT');
  };

  // CRUD Handlers
  const handleDelete = async (type: string, id: string) => {
    if (!confirm(t('confirm_delete') || "Are you sure?")) return;
    try {
      if (type === 'FACULTY') await traceabilityService.deleteFaculty(id);
      if (type === 'ADMIN_UNIT') await traceabilityService.deleteAdminUnit(id);
      if (type === 'DEPARTMENT') await traceabilityService.deleteDepartment(id);
      if (type === 'PERSONNEL') await traceabilityService.deletePersonnel(id);
      
      toast.success(t('delete_success') || "Deleted successfully");
      fetchBaseData();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(t('delete_failed') || "Delete failed");
    }
  };

  const totals = {
    faculties: faculties.length,
    adminUnits: adminUnits.length,
    items: personnel.reduce((acc, p) => acc + (p.itemsCount || 0), 0) // Just a mock metric
  };

  const handleGovernanceClick = () => {
    toast.info("Navigating to Logistics Governance Board...");
    navigate('/procurement', { state: { tab: 'po' } });
  };

  const handleAuditTrailClick = () => {
    toast.info("Accessing comprehensive audit logs...");
    navigate('/reports', { state: { tab: 'needs' } });
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    let exportData: any[] = [];
    let title = "Traceability Report";
    let filename = `traceability_${new Date().toISOString().split('T')[0]}`;

    // Filter logic based on level
    if (level === 'ROOT') {
      exportData = personnel.map(p => ({
        Name: p.name,
        Faculty: p.faculty || p.facultyId || 'N/A',
        Department: p.department || 'N/A',
        Items: p.itemsCount || 0
      }));
      title = "University Wide Traceability Summary";
    } else if (selectedFaculty) {
      const filtered = personnel.filter(p => p.facultyId === selectedFaculty.id);
      exportData = filtered.map(p => ({
        Name: p.name,
        Department: p.department || 'N/A',
        Role: p.jobTitle || 'N/A',
        "Assets Count": p.itemsCount || 0
      }));
      title = `Faculty of ${selectedFaculty.name} - Traceability Report`;
      filename = `faculty_${selectedFaculty.name.toLowerCase().replace(/\s+/g, '_')}`;
    } else if (selectedPerson) {
      exportData = personHistory.map(h => ({
        Item: h.itemName,
        Action: h.action,
        Date: h.date,
        Reference: h.referenceNumber
      }));
      title = `Asset Assignment History: ${selectedPerson.name}`;
      filename = `personnel_${selectedPerson.name.toLowerCase().replace(/\s+/g, '_')}`;
    }

    if (exportData.length === 0) {
      toast.error("No data available for export in this view.");
      return;
    }

    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Traceability");
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success("Excel report generated successfully.");
    } else {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      autoTable(doc, {
        startY: 35,
        head: [Object.keys(exportData[0])],
        body: exportData.map(obj => Object.values(obj)),
        theme: 'striped',
        headStyles: { fillColor: [15, 143, 127] }
      });
      doc.save(`${filename}.pdf`);
      toast.success("PDF report generated successfully.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderRoot = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div 
        onClick={() => setLevel('FACULTIES_L1')}
        className="fintech-card p-10 bg-white group cursor-pointer hover:border-primary-teal transition-all relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-teal/5 rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-125 transition-transform" />
        <div className="w-16 h-16 bg-primary-teal rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-primary-teal/20">
          <Target size={32} />
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-2">University Faculties</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              Manage {totals.faculties} faculties and their internal academic departments.
            </p>
          </div>
          <div className="flex flex-col gap-2 no-print">
            <button 
              onClick={(e) => { e.stopPropagation(); handleGovernanceClick(); }}
              className="text-[8px] font-black uppercase tracking-widest text-primary-teal hover:underline"
            >
              Logistics Governance
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleAuditTrailClick(); }}
              className="text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
            >
              View Full Audit Trail
            </button>
          </div>
        </div>
        <div className="mt-8 flex items-center gap-2 text-primary-teal font-black text-[10px] uppercase tracking-widest">
          Enter Gateway <ChevronRight size={14} />
        </div>
      </div>

      <div 
        onClick={() => setLevel('ADMIN_L1')}
        className="fintech-card p-10 bg-white group cursor-pointer hover:border-slate-900 transition-all relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-125 transition-transform" />
        <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-slate-900/20">
          <ShieldCheck size={32} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-2">Administrative Section</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Manage {totals.adminUnits} units, directorates, and administrative sections.
        </p>
        <div className="mt-8 flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest">
          Enter Gateway <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );

  const renderFaculties = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {faculties.map((f, idx) => (
          <div 
            key={f.id || `fac-${idx}`}
            onClick={() => { setSelectedFaculty(f); setLevel('FACULTY_L2'); }}
            className="fintech-card bg-white p-6 group cursor-pointer hover:border-primary-teal transition-all text-center relative"
          >
            <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-slate-50 overflow-hidden shadow-sm ring-4 ring-primary-teal/5">
              <img src={f.image || 'https://images.unsplash.com/photo-1541339907198-e08756ebafe1?w=200&h=200&fit=crop'} className="w-full h-full object-cover" />
            </div>
            <h4 className="font-black text-slate-900 uppercase tracking-tight">{f.name}</h4>
            <div className="mt-3 flex justify-center gap-2">
              <span className="px-3 py-1 bg-slate-50 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest">
                {departments.filter(d => d.facultyId === f.id).length} Depts
              </span>
              <span className="px-3 py-1 bg-primary-teal/5 rounded-full text-[8px] font-black text-primary-teal uppercase tracking-widest">
                {personnel.filter(p => p.facultyId === f.id).length} Personnel
              </span>
            </div>
            
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingItem(f); setModalType('FACULTY'); setIsModalOpen(true); }}
                className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-900 hover:text-white"
              >
                <Edit size={12} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete('FACULTY', f.id); }}
                className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        <button 
          onClick={() => { setEditingItem(null); setModalType('FACULTY'); setIsModalOpen(true); }}
          className="fintech-card border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-primary-teal hover:text-primary-teal transition-all group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-primary-teal transition-all">
            <Plus size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Add New Faculty</span>
        </button>
      </div>
    </div>
  );

  const renderAdminUnits = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminUnits.map((u, idx) => (
          <div 
            key={u.id || `admin-${idx}`}
            onClick={() => { setSelectedAdminUnit(u); setLevel('ADMIN_L2'); }}
            className="fintech-card bg-white p-6 group cursor-pointer hover:border-slate-900 transition-all text-center relative"
          >
            <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-slate-50 overflow-hidden shadow-sm ring-4 ring-slate-900/5">
              <img src={u.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop'} className="w-full h-full object-cover" />
            </div>
            <h4 className="font-black text-slate-900 uppercase tracking-tight">{u.name}</h4>
            <div className="mt-3 flex justify-center gap-2">
              <span className="px-3 py-1 bg-slate-50 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest">
                {departments.filter(d => d.adminUnitId === u.id).length} Sections
              </span>
              <span className="px-3 py-1 bg-slate-900/5 rounded-full text-[8px] font-black text-slate-900 uppercase tracking-widest">
                {personnel.filter(p => p.adminUnitId === u.id).length} Personnel
              </span>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingItem(u); setModalType('ADMIN_UNIT'); setIsModalOpen(true); }}
                className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-900 hover:text-white"
              >
                <Edit size={12} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete('ADMIN_UNIT', u.id); }}
                className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        <button 
          onClick={() => { setEditingItem(null); setModalType('ADMIN_UNIT'); setIsModalOpen(true); }}
          className="fintech-card border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-slate-900 transition-all">
            <Plus size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Add Admin Unit</span>
        </button>
      </div>
    </div>
  );

  const renderDepartments = (parentType: 'FACULTY' | 'ADMIN') => {
    const parentId = parentType === 'FACULTY' ? selectedFaculty?.id : selectedAdminUnit?.id;
    const filteredDepts = departments.filter(d => parentType === 'FACULTY' ? d.facultyId === parentId : d.adminUnitId === parentId);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDepts.map((d, idx) => (
            <div 
              key={d.id || `dept-${idx}`}
              onClick={() => { setSelectedDepartment(d); setLevel('PERSONNEL_L3'); }}
              className="fintech-card bg-white p-6 group cursor-pointer hover:border-primary-teal transition-all text-center relative"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-slate-400 group-hover:bg-primary-teal group-hover:text-white transition-all shadow-sm">
                <LayoutGrid size={24} />
              </div>
              <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{d.name}</h4>
              <div className="mt-3">
                <span className="px-3 py-1 bg-slate-50 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  {personnel.filter(p => p.departmentId === d.id).length} Personnel
                </span>
              </div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingItem(d); setModalType('DEPARTMENT'); setIsModalOpen(true); }}
                  className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-900 hover:text-white"
                >
                  <Edit size={12} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete('DEPARTMENT', d.id); }}
                  className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          <button 
            onClick={() => { setEditingItem(null); setModalType('DEPARTMENT'); setIsModalOpen(true); }}
            className="fintech-card border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-primary-teal hover:text-primary-teal transition-all group"
          >
            <Plus size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Add {parentType === 'FACULTY' ? 'Department' : 'Section'}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderPersonnel = () => {
    const filteredPersonnel = personnel.filter(p => p.departmentId === selectedDepartment?.id);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPersonnel.map((p, idx) => (
            <div 
              key={p.id || `person-${idx}`}
              onClick={() => { setSelectedPerson(p); setLevel('PERSONNEL_DETAILS'); getPersonHistory(p); }}
              className="fintech-card bg-white p-6 flex items-center gap-6 group cursor-pointer hover:border-primary-teal transition-all relative"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white flex-shrink-0">
                <img src={p.image || `https://i.pravatar.cc/150?u=${p.id}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-start">
                <h4 className="font-black text-slate-900 uppercase tracking-tight">{p.name}</h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.jobTitle || 'Staff Member'}</p>
                <div className="mt-4 flex gap-2">
                  <div className="bg-slate-50 p-2 rounded-xl flex-1 text-center">
                    <div className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">ID No</div>
                    <div className="text-[10px] font-black text-slate-900">{p.idNumber || '---'}</div>
                  </div>
                  <div className="bg-primary-teal/5 p-2 rounded-xl flex-1 text-center">
                    <div className="text-[7px] font-black text-primary-teal uppercase tracking-[0.2em] mb-1">Items</div>
                    <div className="text-[10px] font-black text-primary-teal">{p.itemsCount || 0}</div>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingItem(p); setModalType('PERSONNEL'); setIsModalOpen(true); }}
                  className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-900 hover:text-white"
                >
                  <Edit size={12} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete('PERSONNEL', p.id); }}
                  className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          <button 
             onClick={() => { setEditingItem(null); setModalType('PERSONNEL'); setIsModalOpen(true); }}
             className="fintech-card border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-primary-teal hover:text-primary-teal transition-all group min-h-[140px]"
          >
            <Plus size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Register Personnel</span>
          </button>
        </div>
      </div>
    );
  };

  const renderPersonnelDetails = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500 no-print">
      <div className="lg:col-span-1 space-y-8">
        <div className="fintech-card p-10 bg-white text-center">
          <div className="relative w-40 h-40 mx-auto group">
            <div className="w-full h-full rounded-[40px] overflow-hidden border-8 border-slate-50 shadow-2xl relative">
              <img src={selectedPerson.image || `https://i.pravatar.cc/150?u=${selectedPerson.id}`} className="w-full h-full object-cover" />
            </div>
            <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary-teal text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer">
              <Camera size={20} />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64 = reader.result as string;
                      try {
                        await traceabilityService.updatePersonnel(selectedPerson.id, { image: base64 });
                        setSelectedPerson({ ...selectedPerson, image: base64 });
                        toast.success("Profile picture updated");
                        fetchBaseData();
                      } catch (err) {
                        toast.error("Failed to update picture");
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
              />
            </label>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-8">{selectedPerson.name}</h3>
          <p className="text-[10px] text-primary-teal font-black uppercase tracking-widest mt-2">{selectedPerson.jobTitle}</p>
          
          <button 
            onClick={() => setIsAllocationModalOpen(true)}
            className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all flex items-center justify-center gap-2 group no-print"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
            Assign Item
          </button>

          <div className="mt-10 grid grid-cols-1 gap-4 text-start">
             <div className="p-4 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm"><Activity size={20} /></div>
                <div><div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee ID</div><div className="text-xs font-black text-slate-900">{selectedPerson.idNumber || 'ID-993-221'}</div></div>
             </div>
             <div className="p-4 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm"><User size={20} /></div>
                <div><div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Work Email</div><div className="text-xs font-black text-slate-900">{selectedPerson.email || 'user@university.edu'}</div></div>
             </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
        <div className="fintech-card p-8 bg-white">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-primary-teal rounded-full" />
                <h3 className="font-black text-xl text-slate-900 tracking-tight uppercase italic underline decoration-primary-teal/30">Item Allocation History</h3>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                <Clock size={14} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Ledger Access</span>
              </div>
           </div>
           
           <div className="space-y-4">
              {personHistory.length > 0 ? personHistory.map((h, idx) => (
                <div key={h.id || `history-${idx}`} className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] hover:bg-white hover:border-primary-teal hover:shadow-xl transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-teal shadow-sm group-hover:bg-primary-teal group-hover:text-white transition-all">
                      <Package size={24} />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 uppercase tracking-tight">{h.itemName}</h5>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10}/> {new Date(h.timestamp).toLocaleDateString()}</span>
                        <span className="text-[9px] font-black text-primary-teal uppercase tracking-widest px-2 py-0.5 bg-primary-teal/5 rounded">Qty: {h.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-3 bg-white text-slate-400 rounded-2xl hover:text-primary-teal transition-colors shadow-sm"><MoreHorizontal size={20} /></button>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400">
                   <Package size={48} className="mx-auto mb-4 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No allocations recorded for this person</p>
                </div>
              )}
           </div>
        </div>

        {/* Print-only Signatures */}
        <div className="hidden print:grid grid-cols-2 gap-20 mt-20 pt-10 border-t border-slate-100">
          <div className="text-start">
            <div className="w-48 h-px bg-slate-900 mb-2" />
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-none">Employee Signature</div>
            <div className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">{selectedPerson.name}</div>
          </div>
          <div className="text-end flex flex-col items-end">
            <div className="w-48 h-px bg-slate-900 mb-2" />
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-none">Director of Logistics</div>
            <div className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Authorized Verification</div>
          </div>
        </div>
      </div>
    </div>
  );

   return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Print-only University Header */}
      <div className="hidden print:block mb-10 pb-6 border-b-2 border-slate-900 text-start">
        <div className="flex justify-between items-end">
          <div className="text-start">
            <h1 className="text-3xl font-black uppercase tracking-tighter">Kandahar University</h1>
            <p className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Logistics & Asset Management Directorate</p>
          </div>
          <div className="text-end">
            <div className="text-xl font-black uppercase italic">Personnel Liability Ledger</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Date Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Print-only Data for PERSONNEL_DETAILS */}
      {level === 'PERSONNEL_DETAILS' && selectedPerson && (
        <div className="hidden print:block space-y-12 mb-12">
           <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
              <div className="flex gap-10 items-center">
                 <div className="w-32 h-32 rounded-[32px] border-4 border-slate-900 overflow-hidden shadow-xl">
                    <img src={selectedPerson.image || `https://i.pravatar.cc/150?u=${selectedPerson.id}`} className="w-full h-full object-cover" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight italic">{selectedPerson.name}</h2>
                    <p className="text-sm font-black text-primary-teal uppercase tracking-[0.2em]">{selectedPerson.jobTitle}</p>
                    <div className="flex items-center gap-6 mt-4">
                       <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Employee ID</span><span className="text-lg font-black text-slate-900">{selectedPerson.idNumber || 'ID-KU-001'}</span></div>
                       <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Work Email</span><span className="text-lg font-black text-slate-900 font-mono italic">{selectedPerson.email || 'staff@ku.edu'}</span></div>
                    </div>
                 </div>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-3xl text-center min-w-[200px]">
                 <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Total Assets Held</div>
                 <div className="text-5xl font-black">{selectedPerson.itemsCount || 0}</div>
                 <div className="text-[8px] font-black uppercase tracking-[0.3em] mt-2 italic text-emerald-400">Verified Personnel Liability</div>
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xl font-black uppercase italic border-b-2 border-slate-900 pb-2">Complete Asset Allocation History</h3>
              <table className="w-full border-collapse border-4 border-slate-900">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-4 text-start font-black uppercase tracking-widest text-[10px]">Date Recorded</th>
                    <th className="p-4 text-start font-black uppercase tracking-widest text-[10px]">Item Description</th>
                    <th className="p-4 text-center font-black uppercase tracking-widest text-[10px]">Qty</th>
                    <th className="p-4 text-start font-black uppercase tracking-widest text-[10px]">Reference / Notes</th>
                    <th className="p-4 text-center font-black uppercase tracking-widest text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-900 font-bold">
                  {personHistory.map((h, i) => (
                    <tr key={i} className="border-b-2 border-slate-100">
                      <td className="p-4 text-[11px] font-mono whitespace-nowrap">{new Date(h.timestamp).toLocaleString()}</td>
                      <td className="p-4 text-sm font-black uppercase tracking-tight">{h.itemName}</td>
                      <td className="p-4 text-center text-sm font-black">{h.quantity}</td>
                      <td className="p-4 text-[10px] text-slate-500 italic max-w-xs">{h.notes || 'Official Allocation via System'}</td>
                      <td className="p-4 text-center">
                        <span className="text-[8px] font-black uppercase px-2 py-1 border border-emerald-500 text-emerald-600 rounded">Issued</span>
                      </td>
                    </tr>
                  ))}
                  {personHistory.length === 0 && (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-300 font-black uppercase text-sm tracking-[0.2em]">No history recorded in ledger</td></tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div className="text-start flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => setLevel('ROOT')}
              className={cn("text-[10px] font-black uppercase tracking-[0.2em]", level === 'ROOT' ? "text-[#0F8F7F]" : "text-slate-400 hover:text-[#0F8F7F]")}
            >
              Traceability Gateway
            </button>
            {level !== 'ROOT' && (
              <>
                <ChevronRight size={12} className="text-slate-300" />
                <span className="text-[10px] font-black text-[#0F8F7F] uppercase tracking-[0.2em] italic">
                  {selectedFaculty?.name || selectedAdminUnit?.name}
                </span>
                {selectedDepartment && (
                  <>
                    <ChevronRight size={12} className="text-slate-300" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">
                      {selectedDepartment.name}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
             {level === 'ROOT' && 'System Drill-Down'}
             {level === 'FACULTIES_L1' && 'University Faculties'}
             {level === 'ADMIN_L1' && 'Administrative Section'}
             {(level === 'FACULTY_L2' || level === 'ADMIN_L2') && (selectedFaculty?.name || selectedAdminUnit?.name)}
             {level === 'PERSONNEL_L3' && selectedDepartment?.name}
             {level === 'PERSONNEL_DETAILS' && 'Personnel Portrait'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 no-print">
          {/* Print button removed as requested */}

          <div className="relative group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#0F8F7F] transition-colors" />
            <input 
              type="text" 
              placeholder="Search Intelligence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-3xl py-4 pl-14 pr-6 text-[11px] font-black uppercase tracking-widest outline-none focus:border-[#0F8F7F] focus:ring-4 focus:ring-[#0F8F7F]/5 transition-all shadow-xl shadow-slate-900/5 lg:w-80"
            />
            {searchTerm && (
              <div className="absolute top-full mt-3 left-0 right-0 bg-white border border-slate-100 rounded-3xl shadow-2xl z-[100] max-h-[300px] overflow-y-auto custom-scrollbar p-4 space-y-2">
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-2 border-b border-slate-50 pb-2 text-start">Matched entities found</div>
                {personnel.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p, idx) => (
                  <div key={`s-p-${idx}`} onClick={() => { setSelectedPerson(p); setLevel('PERSONNEL_DETAILS'); getPersonHistory(p); setSearchTerm(''); }} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#0F8F7F] font-black text-[10px] border border-slate-100 uppercase">{p.name[0]}</div>
                    <div className="flex flex-col text-start">
                      <span className="text-[10px] font-black text-slate-900 uppercase">{p.name}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">{p.jobTitle || 'Personnel'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {level !== 'ROOT' && (
            <button 
              onClick={handleBack}
              className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
         <StatWidget 
           key="stat-units" 
           label="Units Total" 
           value={(totals.faculties + totals.adminUnits).toString()} 
           icon={<Target size={18}/>} 
           color="primary" 
           onClick={() => setLevel('ROOT')}
         />
         <StatWidget 
           key="stat-depts" 
           label="Departments" 
           value={departments.length.toString()} 
           icon={<LayoutGrid size={18}/>} 
           color="amber" 
           onClick={() => setLevel('FACULTIES_L1')}
         />
         <StatWidget 
           key="stat-personnel" 
           label="System Personnel" 
           value={personnel.length.toString()} 
           icon={<Users size={18}/>} 
           color="slate" 
           onClick={() => {
             const input = document.querySelector('input[placeholder="Search Intelligence..."]') as HTMLInputElement;
             if (input) {
               input.focus();
               toast.info("Filter personnel by name using the search intelligence bar");
             }
           }}
         />
         <StatWidget 
           key="stat-assets" 
           label="Allocated Assets" 
           value={totals.items.toString()} 
           icon={<Package size={18}/>} 
           color="teal" 
           onClick={() => navigate('/reports', { state: { tab: 'analytics' } })}
         />
      </div>

      <main className="mt-8">
        {level === 'ROOT' && renderRoot()}
        {level === 'FACULTIES_L1' && renderFaculties()}
        {level === 'ADMIN_L1' && renderAdminUnits()}
        {level === 'FACULTY_L2' && renderDepartments('FACULTY')}
        {level === 'ADMIN_L2' && renderDepartments('ADMIN')}
        {level === 'PERSONNEL_L3' && renderPersonnel()}
        {level === 'PERSONNEL_DETAILS' && renderPersonnelDetails()}
      </main>

      {/* CRUD Modals for all entities */}
      {isModalOpen && (
        <EntityModal 
          type={modalType} 
          item={editingItem} 
          parent={{ facultyId: selectedFaculty?.id, adminUnitId: selectedAdminUnit?.id, departmentId: selectedDepartment?.id }}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => { setIsModalOpen(false); fetchBaseData(); if(onRefresh) onRefresh(); }}
        />
      )}

      {isAllocationModalOpen && (
        <ManualAllocationModal 
          person={selectedPerson}
          items={items}
          onClose={() => setIsAllocationModalOpen(false)}
          onSuccess={() => {
            setIsAllocationModalOpen(false);
            fetchBaseData();
            if (selectedPerson) {
              getPersonHistory(selectedPerson);
              // Update local selected person's itemsCount immediately if possible
              // or let the next render handle it if we find the updated person in the list
            }
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

const ManualAllocationModal = ({ person, items, onClose, onSuccess }: any) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    personId: person.id,
    itemId: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId) return toast.error("Please select an item");
    
    setLoading(true);
    try {
      await traceabilityService.manualAllocate(formData);
      toast.success("Item assigned successfully");
      onSuccess();
    } catch (err) {
      toast.error("Failed to assign item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[44px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="text-start">
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Manual Assignment</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Assign to: {person.name}</p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><Trash2 size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-start">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Item</label>
              <select 
                required
                value={formData.itemId}
                onChange={e => setFormData({...formData, itemId: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-primary-teal/5 outline-none text-black appearance-none"
              >
                <option value="">Choose an item...</option>
                {items.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.item_code}) - Stock: {item.current_stock}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-primary-teal/5 outline-none text-black"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignment Date</label>
                <input 
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-primary-teal/5 outline-none text-black"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-primary-teal/5 outline-none text-black min-h-[100px]"
                placeholder="Why is this item being assigned manually?"
              />
            </div>

            <div className="pt-6 flex gap-4">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-[2] bg-slate-900 text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
              >
                {loading ? 'Recording...' : 'Assign Item Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const StatWidget = ({ label, value, icon, color = "primary", onClick }: any) => {
  const colors: any = {
    primary: "bg-blue-600 text-white shadow-blue-500/20",
    amber: "bg-amber-500 text-white shadow-amber-500/20",
    slate: "bg-slate-900 text-white shadow-slate-900/20",
    teal: "bg-primary-teal text-white shadow-primary-teal/20"
  };
  return (
    <div 
      onClick={onClick}
      className={cn(
        "fintech-card p-6 bg-white border border-slate-100 flex items-center gap-6 group hover:shadow-2xl transition-all",
        onClick && "cursor-pointer active:scale-95"
      )}
    >
       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", colors[color])}>
         {icon}
       </div>
       <div className="text-start">
          <div className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 leading-none">{label}</div>
          <div className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</div>
       </div>
    </div>
  );
};

const EntityModal = ({ type, item, parent, onClose, onSuccess }: any) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(item || { 
    name: '', image: '', idNumber: '', email: '', jobTitle: '',
    ...parent
  });

  const [items, setItems] = useState<any[]>([]);
  const [assignItem, setAssignItem] = useState(false);
  const [allocationData, setAllocationData] = useState({
    itemId: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    notes: 'Initial assignment'
  });

  useEffect(() => {
    if (type === 'PERSONNEL') {
      inventoryService.getItems().then(res => setItems(res.data || []));
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSubmit = { ...formData };
      
      let createdPersonId = item?.id;
      if (item?.id) {
        if (type === 'FACULTY') await traceabilityService.updateFaculty(item.id, dataToSubmit);
        else if (type === 'ADMIN_UNIT') await traceabilityService.updateAdminUnit(item.id, dataToSubmit);
        else if (type === 'DEPARTMENT') await traceabilityService.updateDepartment(item.id, dataToSubmit);
        else if (type === 'PERSONNEL') await traceabilityService.updatePersonnel(item.id, dataToSubmit);
        toast.success("Updated successfully");
      } else {
        let res;
        if (type === 'FACULTY') res = await traceabilityService.addFaculty(dataToSubmit);
        else if (type === 'ADMIN_UNIT') res = await traceabilityService.addAdminUnit(dataToSubmit);
        else if (type === 'DEPARTMENT') res = await traceabilityService.addDepartment(dataToSubmit);
        else if (type === 'PERSONNEL') res = await traceabilityService.addPersonnel(dataToSubmit);
        
        createdPersonId = res?.data?.id;
        
        // Handle initial item assignment if checked
        if (type === 'PERSONNEL' && assignItem && createdPersonId && allocationData.itemId) {
          try {
            await traceabilityService.manualAllocate({
              ...allocationData,
              personId: createdPersonId
            });
            toast.success("Initial item assigned");
          } catch (allocErr) {
            console.error("Initial allocation failed:", allocErr);
            toast.error("Personnel created, but initial assignment failed");
          }
        }
        
        toast.success("Created successfully");
      }
      onSuccess();
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[44px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10">
          <div className="flex items-center justify-between mb-8">
             <div className="text-start">
                <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{item ? 'Update' : 'Register New'} {type.replace('_', ' ')}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">System Administration Hub</p>
             </div>
             <button onClick={onClose} className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><Trash2 size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-start">
             <div className="flex justify-center mb-6">
                <div className="relative group">
                   <div className="w-24 h-24 rounded-[30px] overflow-hidden border-4 border-slate-100 shadow-xl bg-slate-50 flex items-center justify-center text-slate-300">
                      {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImageIcon size={32} />}
                   </div>
                   <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-teal text-white rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                      <Camera size={18} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                   </label>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entity Name</label>
                <input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-primary-teal/5 outline-none text-black" 
                  placeholder="Enter official name..." 
                />
             </div>

             {type === 'PERSONNEL' && (
               <>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Title</label>
                       <input value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-primary-teal/5 outline-none text-black" placeholder="Position" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel ID</label>
                       <input value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-primary-teal/5 outline-none text-black" placeholder="ID Number" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-primary-teal/5 outline-none text-black" placeholder="university.email@edu.af" />
                 </div>
               </>
             )}

             {type === 'PERSONNEL' && !item?.id && (
               <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                 <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={assignItem} onChange={e => setAssignItem(e.target.checked)} className="w-4 h-4 text-primary-teal border-slate-300 rounded" />
                    <span className="text-[10px] font-black text-slate-900 uppercase">Issue Item (Manual Entrance)</span>
                 </label>
                 {assignItem && (
                   <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <select 
                        value={allocationData.itemId} 
                        onChange={e => setAllocationData({...allocationData, itemId: e.target.value})} 
                        className="w-full bg-white rounded-xl p-3 text-[10px] font-bold text-black border-none outline-none focus:ring-0"
                      >
                        <option value="">Select Asset...</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.item_code})</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" min="1" value={allocationData.quantity} onChange={e => setAllocationData({...allocationData, quantity: parseInt(e.target.value) || 0})} className="w-full bg-white rounded-xl p-3 text-[10px] font-bold text-black border-none outline-none focus:ring-0" placeholder="Qty" />
                        <input type="date" value={allocationData.date} onChange={e => setAllocationData({...allocationData, date: e.target.value})} className="w-full bg-white rounded-xl p-3 text-[10px] font-bold text-black border-none outline-none focus:ring-0" />
                      </div>
                   </div>
                 )}
               </div>
             )}

             <div className="pt-6 flex gap-4">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] bg-slate-900 text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-primary-teal transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : item ? 'Update Record' : 'Register Now'}
                </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
};
