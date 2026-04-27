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
  Users,
  Package
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

import { toast } from 'sonner';

export const SettingsManager = () => {
  const { t, i18n } = useTranslation();
  const [roles, setRoles] = useState([
    { label: t('role_system_admin'), count: 2, color: "bg-primary-teal" },
    { label: t('role_store_keeper'), count: 5, color: "bg-blue-500" },
    { label: t('role_faculty_staff'), count: 24, color: "bg-slate-400" },
  ]);

  const [systemLogo, setSystemLogo] = useState<string | null>(localStorage.getItem('system_logo'));
  const [profileImage, setProfileImage] = useState<string | null>(localStorage.getItem('profile_image'));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSystemLogo(base64String);
      localStorage.setItem('system_logo', base64String);
      toast.success("System logo updated successfully");
      window.dispatchEvent(new Event('storage'));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileImage(base64String);
      localStorage.setItem('profile_image', base64String);
      toast.success("Profile image updated successfully");
      window.dispatchEvent(new Event('storage'));
    };
    reader.readAsDataURL(file);
  };

  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const handleSave = () => {
    toast.success(t('pref_saved'));
  };

  const handleAddRoleConfirm = () => {
    console.log('handleAddRoleConfirm triggered with:', newRoleName);
    if (newRoleName.trim()) {
      setRoles([...roles, { label: newRoleName, count: 0, color: "bg-indigo-500" }]);
      toast.success(`${t('role_created')} '${newRoleName}'`);
      setNewRoleName('');
      setIsAddingRole(false);
    }
  };

  const handleAddRoleClick = () => {
    console.log('handleAddRoleClick triggered');
    setIsAddingRole(true);
  };

  const changeLanguage = (lng: string) => {
    console.log('Changing language to:', lng);
    i18n.changeLanguage(lng);
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = lng;
  };

  const auditLogs = [
    { id: 1, action: t('audit_stock'), user: 'Admin Official', time: '2 mins ago', type: 'update' },
    { id: 2, action: t('audit_approval'), user: 'Store Master', time: '1 hour ago', type: 'create' },
    { id: 3, action: t('audit_login'), user: 'Eng. Faculty Rep', time: '2 hours ago', type: 'auth' },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('settings')}</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest leading-none">
            {t('system_config')}
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#0F8F7F] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0F8F7F]/90 transition-all shadow-xl shadow-primary-teal/20"
        >
          <Save size={18} />
          {t('save_preferences')}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Account Profile */}
        <section className="fintech-card p-6 lg:p-8 bg-white space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-primary-teal">
               <Users size={22} />
             </div>
             <div>
               <h3 className="text-lg font-black text-slate-900 leading-none">Account Profile</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Personal Identity</p>
             </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group relative text-center">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-primary-teal w-full h-full flex items-center justify-center text-white font-black text-2xl">
                    {t('admin_initial')}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Change
                  <input type="file" className="hidden" accept="image/*" onChange={handleProfileUpload} />
                </label>
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Profile Picture</div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Your personal avatar shown in the navbar.
                  <br />
                  <span className="text-primary-teal font-bold uppercase tracking-widest text-[9px]">Max Size: 5MB</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Branding & Identity */}
        <section className="fintech-card p-6 lg:p-8 bg-white space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
               <Package size={22} />
             </div>
             <div>
               <h3 className="text-lg font-black text-slate-900 leading-none">Branding & Identity</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">App Logo & Visuals</p>
             </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group relative text-center">
                {systemLogo ? (
                  <img src={systemLogo} alt="System Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-300 font-black text-[10px] uppercase tracking-tighter px-2">No Logo Uploaded</div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Change
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Institution Logo</div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Upload an official PNG or JPG logo. This will be used across the WMS login screen and sidebar.
                  <br />
                  <span className="text-primary-teal font-bold uppercase tracking-widest text-[9px]">Max Size: 5MB</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Localization & Region */}
        <section className="fintech-card p-6 lg:p-8 bg-white space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[#0F8F7F]/5 border border-[#0F8F7F]/10 flex items-center justify-center text-[#0F8F7F]">
               <Globe size={22} />
             </div>
             <div>
               <h3 className="text-lg font-black text-slate-900 leading-none">{t('system_locale')}</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">{t('lang_direction')}</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {[
              { id: 'en', label: t('lang_en') },
              { id: 'ps', label: t('lang_ps') }
            ].map((lang) => (
              <button 
                key={lang.id}
                onClick={() => changeLanguage(lang.id)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  i18n.language === lang.id ? "bg-white shadow-xl shadow-black/5 text-[#0F8F7F]" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        {/* SMS Notification System */}
        <section className="fintech-card p-6 lg:p-8 bg-white space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                   <Smartphone size={22} />
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-slate-900 leading-none">SMS Gateway</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Automated Notifications</p>
                 </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Connected</span>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Enable SMS Alerts</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Requests, Approvals & Stock Alerts</span>
                 </div>
                 <button 
                   onClick={() => {
                     const current = localStorage.getItem('sms_enabled') === 'true';
                     localStorage.setItem('sms_enabled', (!current).toString());
                     toast.success(`SMS Notifications ${!current ? 'Enabled' : 'Disabled'}`);
                     // Trigger state refresh if needed, but localStorage is enough for this demo
                   }}
                   className={cn(
                    "w-12 h-6 rounded-full transition-all relative p-1",
                    localStorage.getItem('sms_enabled') === 'true' ? "bg-primary-teal" : "bg-slate-300"
                   )}
                 >
                    <div className={cn(
                       "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                       localStorage.getItem('sms_enabled') === 'true' ? "translate-x-6" : "translate-x-0"
                    )} />
                 </button>
              </div>

              <div className="space-y-2 text-start">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Provider Service</label>
                 <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-teal/20 transition-all">
                    <option>Twilio Global SMS</option>
                    <option>Infobip Gateway</option>
                    <option>Local GSM Modem</option>
                 </select>
              </div>
           </div>
        </section>

        {/* Security & Roles */}
        <section className="fintech-card p-6 lg:p-8 bg-white space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
               <ShieldCheck size={22} />
             </div>
             <div>
               <h3 className="text-lg font-black text-slate-900 leading-none">{t('auth_roles')}</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">{t('privilege_policies')}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {roles.map((role, idx) => (
              <RoleOption key={idx} label={role.label} count={role.count} color={role.color} t={t} />
            ))}
            
            {isAddingRole ? (
              <div className="sm:col-span-2 lg:col-span-1 p-5 bg-slate-50 rounded-2xl border-2 border-primary-teal/20 space-y-4">
                 <input 
                   autoFocus
                   value={newRoleName}
                   onChange={(e) => setNewRoleName(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAddRoleConfirm()}
                   className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-[#0F8F7F]/20 focus:outline-none transition-all"
                   placeholder={t('enter_role_name')}
                 />
                 <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleAddRoleConfirm}
                      className="flex-1 py-3 bg-[#0F8F7F] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0F8F7F]/90 transition-all shadow-lg shadow-primary-teal/10"
                    >
                       Confirm
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsAddingRole(false)}
                      className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                    >
                       Cancel
                    </button>
                 </div>
              </div>
            ) : (
              <button 
                id="add-role-button"
                type="button"
                onClick={handleAddRoleClick}
                className="sm:col-span-2 lg:col-span-1 w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-[#0F8F7F] hover:text-[#0F8F7F] active:scale-[0.98] transition-all cursor-pointer relative z-10 pointer-events-auto"
              >
                + {t('create_role')}
              </button>
            )}
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
                 <h3 className="text-lg font-black text-slate-900 leading-none">{t('system_activity')}</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">{t('live_timeline')}</p>
               </div>
            </div>
             <button 
               onClick={() => toast.info(t('opening_audit'))}
               className="text-[10px] font-black text-[#0F8F7F] uppercase tracking-widest hover:underline"
             >
               {t('view_full_audit')}
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
  t: any;
}

const RoleOption: React.FC<RoleOptionProps> = ({ label, count, color, t }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-4">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
      {count} {t('users_count')}
    </div>
  </div>
);
