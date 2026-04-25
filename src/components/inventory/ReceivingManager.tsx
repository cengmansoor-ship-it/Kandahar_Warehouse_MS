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

export const ReceivingManager = () => {
  const { t } = useTranslation();

  const mockReceivings = [
    { id: 'REC-001', vendor: 'Global Tech Solutions', date: '2024-04-20', totalItems: 25, status: 'Completed', ref: 'PO-9912' },
    { id: 'REC-002', vendor: 'Office Supplies Co.', date: '2024-04-21', totalItems: 120, status: 'Completed', ref: 'PO-9915' },
    { id: 'REC-003', vendor: 'Education First', date: '2024-04-22', totalItems: 5, status: 'Pending', ref: 'PO-9920' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('receiving')}</h2>
          <p className="text-slate-500">Record and track new stock arrivals from vendors.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
          <Truck size={18} />
          New Receipt
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by vendor, reference, or ID..."
                className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID & Reference</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockReceivings.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{rec.id}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{rec.ref}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700">{rec.vendor}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {rec.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">{rec.totalItems}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                        rec.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
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

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <ClipboardList className="text-blue-400" />
                Receiving Tips
              </h3>
              <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                Ensure all items match the physical delivery note before completing the receipt. Stock levels will be updated instantly.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  Verify Item Conditions
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  Check Serial Numbers
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                  Confirm PO Reference
                </div>
              </div>
            </div>
            <Truck size={120} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
};
