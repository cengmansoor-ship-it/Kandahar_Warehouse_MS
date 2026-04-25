import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Globe, 
  User, 
  Bell, 
  Shield, 
  Database,
  Smartphone,
  Save,
  Activity,
  Lock,
  Eye,
  History,
  ShieldCheck,
  Users
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

import { toast } from 'sonner';

export const SettingsManager = () => {
  const { t, i18n } = useTranslation();
  const [roles, setRoles] = useState([
    { label: "System Admin", count: 2, color: "bg-primary-teal" },
    { label: "Store Keeper", count: 5, color: "bg-blue-500" },
    { label: "Faculty Staff", count: 24, color: "bg-slate-400" },
  ]);

  const handleSave = () => {
    toast.success("System preferences saved successfully");
  };

  const handleAddRole = () => {
    const roleName = prompt("Enter new role name:");
    if (roleName) {
      setRoles([...roles, { label: roleName, count: 0, color: "bg-indigo-500" }]);
      toast.success(`Role '${roleName}' created`);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = lng;
  };

  const auditLogs = [
    { id: 1, action: 'Stock Updated', user: 'Admin Official', time: '2 mins ago', type: 'update' },
    { id: 2, action: 'New Request Approved', user: 'Store Master', time: '1 hour ago', type: 'create' },
    { id: 3, action: 'User Login', user: 'Eng. Faculty Rep', time: '2 hours ago', type: 'auth' },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('settings')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none">
            System Configuration & Governance
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary-teal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary-teal/20"
        >
          <Save size={18} />
          Save Preferences
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Localization & Region */}
        <section className="fintech-card p-6 lg:p-8 bg-white space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary-teal/5 border border-primary-teal/10 flex items-center justify-center text-primary-teal">
               <Globe size={22} />
             </div>
             <div>
               <h3 className="text-lg font-black text-slate-900 leading-none">System Locale</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Language & Direction</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {[
              { id: 'en', label: 'English (US)' },
              { id: 'ps', label: 'پښتو (Pashto)' }
            ].map((lang) => (
              <button 
                key={lang.id}
                onClick={() => changeLanguage(lang.id)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  i18n.language === lang.id ? "bg-white shadow-xl shadow-black/5 text-primary-teal" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        {/* Security & Roles */}
        <section className="fintech-card p-6 lg:p-8 bg-white space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
               <ShieldCheck size={22} />
             </div>
             <div>
               <h3 className="text-lg font-black text-slate-900 leading-none">Auth & Roles</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Privilege Policies</p>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {roles.map((role, idx) => (
              <RoleOption key={idx} label={role.label} count={role.count} color={role.color} />
            ))}
            <button 
              onClick={handleAddRole}
              className="sm:col-span-2 lg:col-span-1 w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-primary-teal hover:text-primary-teal transition-all"
            >
              + Create New System Role
            </button>
          </div>
        </section>

        {/* Audit Logs / Activity */}
        <section className="fintech-card p-8 bg-white lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                 <History size={22} />
               </div>
               <div>
                 <h3 className="text-lg font-black text-slate-900 leading-none">System Activity</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Live Governance Timeline</p>
               </div>
            </div>
             <button 
               onClick={() => toast.info("Opening full system audit trail...")}
               className="text-[10px] font-black text-primary-teal uppercase tracking-widest hover:underline"
             >
               View Full Audit
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl transition-all">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-teal/5 group-hover:text-primary-teal transition-all">
                   <Activity size={18} />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 leading-none">{log.action}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{log.user}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

interface RoleOptionProps {
  label: string;
  count: number;
  color: string;
}

const RoleOption: React.FC<RoleOptionProps> = ({ label, count, color }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-4">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
      {count} USERS
    </div>
  </div>
);
