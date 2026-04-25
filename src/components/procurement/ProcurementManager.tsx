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

export const ProcurementManager = () => {
  const { t } = useTranslation();

  const mockTenders = [
    { id: 'TND-8821', title: 'IT Infrastructure - Server Upgrade', deadline: '2024-05-15', status: 'Bidding', quotations: 12, budget: '$45,000' },
    { id: 'TND-8822', title: 'Office Furniture - Main Admin', deadline: '2024-05-20', status: 'Review', quotations: 8, budget: '$12,500' },
    { id: 'TND-8823', title: 'Solar Panel Maintenance', deadline: '2024-05-02', status: 'Awarded', quotations: 4, budget: '$8,000' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('procurement')}</h2>
          <p className="text-slate-500">Manage tenders, quotations, and vendor selections.</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
          <Gavel size={18} />
          Create Tender
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProcurementStatsCard title="Active Tenders" value="12" icon={<Gavel className="text-blue-600" />} />
        <ProcurementStatsCard title="Quotation Reviews" value="48" icon={<FileCheck2 className="text-amber-600" />} />
        <ProcurementStatsCard title="New Vendors" value="3" icon={<UserCheck className="text-emerald-600" />} />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg">Active Tenders & Bids</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search tenders..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
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
                    <span className="text-xs text-slate-400">submitted</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-sm font-bold text-emerald-600">{tender.budget}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-sm text-slate-500 font-medium">{tender.deadline}</div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                      tender.status === 'Awarded' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      tender.status === 'Review' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                      {tender.status}
                    </span>
                    <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function ProcurementStatsCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
          {icon}
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{title}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
        </div>
      </div>
    </div>
  );
}
