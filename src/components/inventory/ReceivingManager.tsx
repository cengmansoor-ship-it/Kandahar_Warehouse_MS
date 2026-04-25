import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Truck, 
  Calendar, 
  User, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

import { toast } from 'sonner';

export const ReceivingManager = () => {
  const { t } = useTranslation();

  const mockReceivings = [
    { id: 'REC-001', vendor: 'Global Tech Solutions', date: '2024-04-20', totalItems: 25, status: 'Completed', ref: 'PO-9912' },
    { id: 'REC-002', vendor: 'Office Supplies Co.', date: '2024-04-21', totalItems: 120, status: 'Completed', ref: 'PO-9915' },
    { id: 'REC-003', vendor: 'Education First', date: '2024-04-22', totalItems: 5, status: 'Pending', ref: 'PO-9920' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('receiving')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none">
            Inbound Logistics & Quality Assurance
          </p>
        </div>
        <button 
          onClick={() => toast.info("Feature coming soon: New Stock Arrival panel")}
          className="flex items-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
        >
          <Truck size={18} />
          New Receipt
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="fintech-card p-6 bg-white flex items-center gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Lookup by Vendor ID, Reference, or Tracking No..."
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all text-slate-700"
              />
            </div>
          </div>

          <div className="fintech-card bg-white overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID & Reference</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Entity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrival Timestamp</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {mockReceivings.map((rec) => (
                    <tr 
                      key={rec.id} 
                      onClick={() => toast.info(`Viewing receipt ${rec.id} from ${rec.vendor}`)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900 leading-none">{rec.id}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{rec.ref}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-xs font-black text-slate-700 uppercase tracking-tight">{rec.vendor}</div>
                      </td>
                      <td className="px-8 py-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-300" />
                          {rec.date}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 uppercase">{rec.totalItems} PCS</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest",
                          rec.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100"
                        )}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#1A1D1F] rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <ClipboardList className="text-primary-teal" />
              </div>
              <h3 className="text-2xl font-black tracking-tight ltr-only">
                Quality Protocol
              </h3>
              <p className="mt-4 text-white/50 text-xs font-medium leading-relaxed">
                Ensure all shipments undergo visual inspection and count verification before digital acknowledgment.
              </p>
              <div className="mt-10 space-y-5">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/70">
                  <div className="w-2 h-2 rounded-full bg-primary-teal shadow-[0_0_12px_rgba(15,143,127,0.8)]" />
                  Physical Count Sync
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/70">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                  Package Integrity
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/70">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                  SKU Code Match
                </div>
              </div>
            </div>
            <Truck size={160} className="absolute -bottom-16 -right-16 text-white/5 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
};
