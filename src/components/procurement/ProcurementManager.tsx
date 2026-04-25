import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  UserCheck, 
  Gavel, 
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

import { toast } from 'sonner';

export const ProcurementManager = () => {
  const { t } = useTranslation();

  const mockTenders = [
    { id: 'TND-8821', title: 'IT Infrastructure - Server Upgrade', deadline: '2024-05-15', status: 'Bidding', quotations: 12, budget: '$45,000' },
    { id: 'TND-8822', title: 'Office Furniture - Main Admin', deadline: '2024-05-20', status: 'Review', quotations: 8, budget: '$12,500' },
    { id: 'TND-8823', title: 'Solar Panel Maintenance', deadline: '2024-05-02', status: 'Awarded', quotations: 4, budget: '$8,000' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('procurement')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none">
            Procurement Lifecycle & Vendor Management
          </p>
        </div>
        <button 
          onClick={() => toast.info("Feature coming soon: Tender Creation panel")}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
        >
          <Gavel size={18} />
          Create Tender
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <ProcurementStatsCard title="Active Tenders" value="12" icon={<Gavel size={24} className="text-primary-teal" />} />
        <ProcurementStatsCard title="Quotation Reviews" value="48" icon={<FileCheck2 size={24} className="text-amber-500" />} />
        <ProcurementStatsCard title="New Vendors" value="3" icon={<UserCheck size={24} className="text-blue-500" />} />
      </div>

      <div className="fintech-card bg-white mt-8 overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-6 bg-primary-teal rounded-full" />
             <h3 className="font-black text-xl text-slate-900 tracking-tight">Active Tenders & Bids</h3>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Filter by ID or Title..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700"
            />
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Tender Info</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Quotations</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Est. Budget</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Deadline</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockTenders.map((tender) => (
                <tr key={tender.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{tender.title}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{tender.id}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{tender.quotations}</span>
                      <span className="text-xs text-slate-400 italic">submitted</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-emerald-600 tracking-tight">{tender.budget}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{tender.deadline}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest",
                        tender.status === 'Awarded' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        tender.status === 'Review' ? "bg-amber-50 text-amber-500 border-amber-100" :
                        "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {tender.status}
                      </span>
                      <button 
                        onClick={() => toast.success(`Opening tender ${tender.id} details`)}
                        className="p-3 text-slate-300 hover:text-primary-teal hover:bg-primary-teal/5 rounded-xl transition-all border border-transparent hover:border-primary-teal/10"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function ProcurementStatsCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="fintech-card p-8 bg-white group hover:scale-[1.02] transition-transform cursor-pointer">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm group-hover:bg-primary-teal/5 transition-colors">
          {icon}
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{title}</div>
          <div className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}
