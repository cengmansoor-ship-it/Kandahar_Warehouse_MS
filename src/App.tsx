/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { InventoryManager } from './components/inventory/InventoryManager';
import { ReceivingManager } from './components/inventory/ReceivingManager';
import { RequestManager } from './components/requests/RequestManager';
import { ProcurementManager } from './components/procurement/ProcurementManager';
import { ReportManager } from './components/reports/ReportManager';
import { SettingsManager } from './components/settings/SettingsManager';
import { LoginManager } from './components/auth/LoginManager';
import { Package, TrendingUp, AlertTriangle, FileCheck } from 'lucide-react';
import { Toaster } from 'sonner';
import { cn } from './lib/utils';

function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('welcome')}, Admin</h1>
        <p className="text-slate-500 mt-1">Here is a summary of the university warehouse today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('stock_summary')} 
          value="1,284" 
          subValue="+12 today" 
          icon={<Package className="text-blue-600" size={24} />}
          color="blue"
        />
        <StatCard 
          title={t('recent_requests')} 
          value="48" 
          subValue="12 pending" 
          icon={<FileCheck className="text-emerald-600" size={24} />}
          color="emerald"
        />
        <StatCard 
          title={t('low_stock')} 
          value="14" 
          subValue="Critical items" 
          icon={<AlertTriangle className="text-amber-600" size={24} />}
          color="amber"
        />
        <StatCard 
          title="Procurement" 
          value="5" 
          subValue="Active tenders" 
          icon={<TrendingUp className="text-indigo-600" size={24} />}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="font-bold text-lg mb-6">Inventory Movement</h3>
          <div className="flex-1 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200 uppercase tracking-widest text-[10px]">
            Chart implementation coming soon...
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Recent Activities</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-slate-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">New items received</div>
                  <div className="text-xs text-slate-500">Eng. Faculty - Computer Lab supplies</div>
                  <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">2 hours ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  return (
    <>
      <Toaster position="top-center" richColors />
      {!isAuthenticated ? (
        <LoginManager onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<InventoryManager />} />
              <Route path="/receiving" element={<ReceivingManager />} />
              <Route path="/requests" element={<RequestManager />} />
              <Route path="/procurement" element={<ProcurementManager />} />
              <Route path="/reports" element={<ReportManager />} />
              <Route path="/settings" element={<SettingsManager />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      )}
    </>
  );
}

const StatCard: React.FC<{ title: string, value: string, subValue: string, icon: React.ReactNode, color: string }> = ({ title, value, subValue, icon, color }) => {
  const colorMap: Record<string, string> = {
    blue: "bg-[#0F8F7F]/5 border-[#0F8F7F]/10 text-[#0F8F7F]",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
  };

  return (
    <div className="fintech-card p-8 group">
      <div className="flex items-start justify-between">
        <div className={cn("p-4 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110", colorMap[color] || "bg-slate-50 border-slate-100")}>
          {icon}
        </div>
        <div className="text-[10px] font-black p-1 px-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 uppercase tracking-widest">
          LIVE
        </div>
      </div>
      <div className="mt-8">
        <div className="text-slate-400 text-xs font-black uppercase tracking-widest">{title}</div>
        <div className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{value}</div>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-600">
            <TrendingUp size={10} />
          </div>
          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{subValue}</div>
        </div>
      </div>
    </div>
  );
}


