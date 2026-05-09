import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Globe, 
  User as UserIcon, 
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
  Package,
  ArrowRight,
  Edit,
  Trash2,
  Mail
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

import { toast } from 'sonner';
import { userService, api } from '@/src/services/api';
import { User } from '@/src/types';

export const SettingsManager = () => {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [emailSettings, setEmailSettings] = useState({ user: '', pass: '' });
  const [mailConfigs, setMailConfigs] = useState<any[]>([]);
  const [editingMailConfig, setEditingMailConfig] = useState<any>(null);
  const [roles, setRoles] = useState([
    { label: t('role_system_admin'), count: 2, color: "bg-primary-teal" },
    { label: t('role_store_keeper'), count: 5, color: "bg-blue-500" },
    { label: t('role_faculty_staff'), count: 24, color: "bg-slate-400" },
  ]);

  const [activities, setActivities] = useState<any[]>([]);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      setActivities(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch activities", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSettings();
    fetchActivities();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setEmailSettings({
          user: res.data.mailUser || '',
          pass: res.data.mailPass || ''
        });
        setMailConfigs(res.data.mailConfigs || []);
      }
    } catch (e) {
      console.error("Failed to fetch system settings", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userService.getUsers();
      const userList = Array.isArray(res.data) ? res.data : [];
      setUsers(userList);
      
      // Update role counts based on real data
      const adminCount = userList.filter((u: any) => u.role === 'Super Admin' || u.role === 'Admin').length;
      const storeCount = userList.filter((u: any) => u.role === 'Procurement Officer').length;
      const staffCount = userList.filter((u: any) => u.role === 'Department User').length;
      
      setRoles([
        { label: t('role_system_admin'), count: adminCount, color: "bg-primary-teal" },
        { label: t('role_store_keeper'), count: storeCount, color: "bg-blue-500" },
        { label: t('role_faculty_staff'), count: staffCount, color: "bg-slate-400" },
      ]);
    } catch (e) {
      console.error("Failed to fetch users for settings", e);
    }
  };

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

  const handleSaveEmailSettings = async () => {
    try {
      const newConfig = {
        id: editingMailConfig?.id || Math.random().toString(36).substr(2, 9),
        user: emailSettings.user,
        pass: emailSettings.pass,
        isDefault: mailConfigs.length === 0 || editingMailConfig?.isDefault
      };

      let updatedConfigs;
      if (editingMailConfig) {
        updatedConfigs = mailConfigs.map(c => c.id === editingMailConfig.id ? newConfig : c);
      } else {
        // Prevent duplicate users
        if (mailConfigs.some(c => c.user === newConfig.user)) {
          toast.error("This email is already configured");
          return;
        }
        updatedConfigs = [...mailConfigs, newConfig];
      }

      await api.post('/settings', {
        mailUser: newConfig.user,
        mailPass: newConfig.pass,
        mailConfigs: updatedConfigs
      });

      setMailConfigs(updatedConfigs);
      setEmailSettings({ user: '', pass: '' });
      setEditingMailConfig(null);
      toast.success("System configuration updated successfully");
    } catch (e) {
      toast.error("Failed to update system configuration");
    }
  };

  const handleDeleteMailConfig = async (id: string) => {
    try {
      const updatedConfigs = mailConfigs.filter(c => c.id !== id);
      const remainingDefault = updatedConfigs.find(c => c.isDefault) || updatedConfigs[0];
      
      await api.post('/settings', {
        mailUser: remainingDefault?.user || '',
        mailPass: remainingDefault?.pass || '',
        mailConfigs: updatedConfigs
      });

      setMailConfigs(updatedConfigs);
      toast.success("Email configuration removed");
    } catch (e) {
      toast.error("Failed to remove configuration");
    }
  };

  const handleSetDefaultMail = async (config: any) => {
    try {
      const updatedConfigs = mailConfigs.map(c => ({
        ...c,
        isDefault: c.id === config.id
      }));

      await api.post('/settings', {
        mailUser: config.user,
        mailPass: config.pass,
        mailConfigs: updatedConfigs
      });

      setMailConfigs(updatedConfigs);
      toast.success(`${config.user} set as primary`);
    } catch (e) {
      toast.error("Failed to update primary email");
    }
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
    i18n.changeLanguage(lng);
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = lng;
  };

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

        {/* System Configuration & Email */}
        <section className="fintech-card p-6 lg:p-8 bg-white space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                   <Shield size={22} />
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-slate-900 leading-none">System Configuration</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Email & Services</p>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              {/* Existing Configs List */}
              <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Configured Gmail Accounts</h4>
                 {mailConfigs.length === 0 ? (
                   <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
                     <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">No accounts configured</p>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     {mailConfigs.map((config) => (
                       <div key={config.id} className={cn(
                         "p-3 rounded-xl border flex items-center justify-between transition-all",
                         config.isDefault ? "bg-primary-teal/5 border-primary-teal/20" : "bg-white border-slate-100"
                       )}>
                         <div className="flex items-center gap-3">
                           <div className={cn(
                             "w-8 h-8 rounded-lg flex items-center justify-center",
                             config.isDefault? "bg-primary-teal text-white" : "bg-slate-100 text-slate-400"
                           )}>
                             <Mail size={14} />
                           </div>
                           <div>
                             <p className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[120px]">{config.user}</p>
                             {config.isDefault && <span className="text-[7px] font-black text-primary-teal uppercase tracking-widest">Primary Account</span>}
                           </div>
                         </div>
                           <div className="flex items-center gap-1">
                             {!config.isDefault && (
                               <button 
                                 onClick={() => handleSetDefaultMail(config)}
                                 className="p-2 text-slate-400 hover:text-primary-teal transition-all"
                                 title="Set as Primary"
                               >
                                 <Activity size={14} />
                               </button>
                             )}
                             <button 
                               onClick={() => {
                                 setEditingMailConfig(config);
                                 setEmailSettings({ user: config.user, pass: config.pass });
                               }}
                               className="p-2 text-slate-400 hover:text-blue-500 transition-all"
                             >
                               <Edit size={14} />
                             </button>
                             <button 
                               onClick={() => handleDeleteMailConfig(config.id)}
                               className="p-2 text-slate-400 hover:text-red-500 transition-all"
                             >
                               <Trash2 size={14} />
                             </button>
                           </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {editingMailConfig ? 'Edit Selected Account' : 'Configure New Gmail Account'}
                </h4>
                
                <div className="space-y-2 text-start">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gmail SMTP User</label>
                   <input 
                     type="email"
                     value={emailSettings.user}
                     onChange={(e) => setEmailSettings({...emailSettings, user: e.target.value})}
                     placeholder="e.g. yourname@gmail.com"
                     className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-teal/20 transition-all font-mono" 
                   />
                </div>

                <div className="space-y-2 text-start">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gmail App Password (16 Letters)</label>
                   <input 
                     type="password"
                     value={emailSettings.pass}
                     onChange={(e) => setEmailSettings({...emailSettings, pass: e.target.value})}
                     placeholder="xxxx xxxx xxxx xxxx"
                     className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-teal/20 transition-all font-mono" 
                   />
                </div>

                <div className="flex gap-2">
                   <button 
                     onClick={handleSaveEmailSettings}
                     className={cn(
                       "flex-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg",
                       editingMailConfig ? "bg-primary-teal text-white" : "bg-slate-900 text-white"
                     )}
                   >
                     {editingMailConfig ? 'Update Account' : 'Add Configuration'}
                   </button>
                   {editingMailConfig && (
                     <button 
                       onClick={() => {
                         setEditingMailConfig(null);
                         setEmailSettings({ user: '', pass: '' });
                       }}
                       className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
                     >
                       Cancel
                     </button>
                   )}
                </div>
              </div>
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
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('sms_via_email')}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{t('enable_email_gateway_desc')}</span>
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
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('email_gateway')}</label>
                 <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-teal/20 transition-all">
                    <option>Twilio Global SMS</option>
                    <option>Infobip Gateway</option>
                    <option>Local GSM Modem</option>
                 </select>
              </div>
           </div>
        </section>

        {/* System Activities Integration */}
        <section className="fintech-card p-6 lg:p-8 bg-white border-2 border-slate-900 space-y-8 shadow-2xl">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white">
                   <Activity size={22} />
                 </div>
                 <div className="text-start">
                   <h3 className="text-lg font-black leading-none italic uppercase text-black">System Activities</h3>
                   <p className="text-xs text-black font-bold uppercase tracking-wider mt-1.5">Audit Logs & History</p>
                 </div>
              </div>
              <Link to="/activities" className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                 <span className="text-white font-black">View Full Ledger</span>
                 <ArrowRight size={14} className="text-white" />
              </Link>
           </div>
           
           <div className="space-y-3 text-start">
              {activities.length === 0 ? (
                <div className="py-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No activities recorded in ledger</div>
              ) : activities.slice(0, 5).map((log, idx) => (
                <div key={`${log.id}-${idx}`} className="p-4 bg-white rounded-2xl border-2 border-black flex items-center justify-between group hover:bg-slate-50 transition-all">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                         <History size={14} />
                      </div>
                      <div className="text-start">
                         <div className="text-[10px] font-black uppercase tracking-wide text-black">{log.action}</div>
                         <div className="text-[8px] text-black font-black uppercase italic mt-0.5">{log.user} • {new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Security & Roles */}
        <section className="fintech-card p-6 lg:p-8 bg-white lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                 <ShieldCheck size={22} />
               </div>
               <div>
                 <h3 className="text-lg font-black text-slate-900 leading-none">{t('auth_roles')}</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">{t('privilege_policies')}</p>
               </div>
            </div>
            <Link to="/roles" className="text-[10px] font-black text-primary-teal uppercase tracking-widest hover:underline flex items-center gap-2">
               Advanced Manager
               <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">System Access Tiers</h4>
              <div className="grid grid-cols-1 gap-4">
                {roles.map((role, idx) => (
                  <RoleOption key={idx} label={role.label} count={role.count} color={role.color} t={t} />
                ))}
                
                {isAddingRole ? (
                  <div className="p-5 bg-slate-50 rounded-2xl border-2 border-primary-teal/20 space-y-4">
                    <input 
                      autoFocus
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddRoleConfirm()}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-[#0F8F7F]/20 focus:outline-none transition-all"
                      placeholder={t('enter_role_name')}
                    />
                    <div className="flex gap-2">
                        <button type="button" onClick={handleAddRoleConfirm} className="flex-1 py-3 bg-[#0F8F7F] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0F8F7F]/90 transition-all shadow-lg shadow-primary-teal/10">Confirm</button>
                        <button type="button" onClick={() => setIsAddingRole(false)} className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={handleAddRoleClick} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-[#0F8F7F] hover:text-[#0F8F7F] transition-all">+ {t('create_role')}</button>
                )}
              </div>
            </div>

             <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick User Management</h4>
               <div className="space-y-3">
                  {/* Real User List for Settings */}
                  {Array.isArray(users) && users.slice(0, 3).map((u, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 text-[10px] font-black border border-slate-100 overflow-hidden">
                             {u.image ? (
                               <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                             ) : (
                               u.name && u.name[0] ? u.name[0] : '?'
                             )}
                          </div>
                          <div>
                             <div className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[120px]">{u.name}</div>
                             <div className="text-[8px] text-slate-400 font-bold uppercase">{u.role ? u.role.replace('_', ' ') : 'USER'}</div>
                          </div>
                       </div>
                       <div className="flex gap-1">
                          <Link to="/roles" className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-primary-teal transition-all"><Edit size={14} /></Link>
                          <Link to="/roles" className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 size={14} /></Link>
                       </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No users detected</p>
                    </div>
                  )}
                  <Link to="/roles" className="block w-full py-4 text-center rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-100 transition-all italic underline">
                    {users.length > 3 ? `View & Manage All ${users.length} Registered Users` : 'Advanced System Roles Manager'}
                  </Link>
               </div>
            </div>
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
