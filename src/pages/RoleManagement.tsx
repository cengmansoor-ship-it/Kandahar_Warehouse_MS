import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Settings, 
  Edit2,
  Search, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  X,
  User as UserIcon,
  ShieldCheck,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { User, UserRole } from '@/src/types';
import { toast } from 'sonner';

import { userService } from '@/src/services/api';

export const RoleManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.DEPARTMENT_USER });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error(t('load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || (!isEditing && !newUser.password)) {
      toast.error(t('missing_fields'));
      return;
    }
    
    try {
      if (isEditing && selectedUser) {
        const res = await userService.updateUser(selectedUser.id, newUser);
        setUsers(users.map(u => u.id === selectedUser.id ? res.data : u));
        toast.success(t('user_updated'));
      } else {
        const res = await userService.addUser(newUser);
        setUsers([...users, res.data]);
        toast.success(t('user_added'));
      }
      setShowAddModal(false);
      resetAddForm();
    } catch (error) {
      toast.error(t('operation_failed'));
    }
  };

  const resetAddForm = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setNewUser({ name: '', email: '', password: '', role: UserRole.DEPARTMENT_USER });
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await userService.updateUser(userId, { role: newRole });
      setUsers(users.map(u => u.id === userId ? res.data : u));
      toast.success(`${t('role_updated')}: ${newRole}`);
      setShowRoleModal(false);
    } catch (error) {
      toast.error(t('operation_failed'));
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(t('confirm_delete_user'))) return;
    try {
      await userService.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      toast.success(t('user_deleted'));
    } catch (error) {
      toast.error(t('operation_failed'));
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const configs = {
      [UserRole.SUPER_ADMIN]: { color: 'bg-slate-900 border-slate-800 text-white', icon: ShieldCheck },
      [UserRole.ADMIN]: { color: 'bg-emerald-50 border-emerald-100 text-emerald-600', icon: Shield },
      [UserRole.PROCUREMENT_OFFICER]: { color: 'bg-blue-50 border-blue-100 text-blue-600', icon: Shield },
      [UserRole.APPROVER]: { color: 'bg-purple-50 border-purple-100 text-purple-600', icon: CheckCircle2 },
      [UserRole.AUDITOR]: { color: 'bg-amber-50 border-amber-100 text-amber-600', icon: AlertCircle },
      [UserRole.DEPARTMENT_USER]: { color: 'bg-slate-50 border-slate-100 text-slate-600', icon: UserIcon },
    };
    const config = configs[role] || configs[UserRole.DEPARTMENT_USER];
    const Icon = config.icon;
    return (
      <div className={cn("px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2", config.color)}>
        <Icon size={12} />
        {t(`role_${(role || 'department_user').toLowerCase().replace(/\s+/g, '_')}`)}
      </div>
    );
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => 
    (u.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes((searchTerm || '').toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic leading-none">
            {t('role_management')}
            <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-lg not-italic font-black uppercase tracking-[0.4em]">{t('security')}</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-8 bg-slate-900/30 rounded-full" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest leading-none text-start">
              {t('role_management_desc')}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
        >
          <UserPlus size={18} />
          {t('add_new_user')}
        </button>
      </div>

      <div className="fintech-card p-6 bg-white flex items-center gap-6 mb-8">
        <div className="relative flex-1 w-full text-start">
          <Search className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder={t('search_users_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-700 shadow-inner"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="fintech-card p-8 bg-white border border-slate-100 group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-100">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={24} />
                )}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => { 
                    setSelectedUser(user); 
                    setNewUser({ name: user.name, email: user.email || '', role: user.role });
                    setIsEditing(true);
                    setShowAddModal(true);
                  }}
                  className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                  title={t('edit_profile')}
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => { setSelectedUser(user); setShowRoleModal(true); }}
                  className="p-2 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition-all"
                  title={t('manage_roles')}
                >
                  <Shield size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                  title={t('delete_user')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h4 className="font-black text-slate-900 text-sm tracking-tight mb-1 truncate">{user.name}</h4>
            <p className="text-[10px] text-slate-400 font-bold mb-6 truncate">{user.email}</p>

            <div className="pt-6 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 italic">{t('current_access')}</span>
                {getRoleBadge(user.role)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-10"
          >
            <div className="flex items-center justify-between mb-10 text-start">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">{t('modify_access_tier')}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{t('update_role_for')} {selectedUser.name}</p>
              </div>
              <button onClick={() => setShowRoleModal(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {Object.values(UserRole).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(selectedUser.id, role)}
                  className={cn(
                    "w-full p-6 rounded-3xl flex items-center justify-between transition-all border-2 text-start group",
                    selectedUser.role === role 
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20" 
                      : "bg-white border-slate-50 text-slate-600 hover:border-slate-200"
                  )}
                >
                  <div>
                    <div className={cn("text-[11px] font-black uppercase tracking-widest mb-1", selectedUser.role === role ? "text-white/70" : "text-slate-400 group-hover:text-slate-600")}>
                      {t(`role_${role.toLowerCase()}`)}
                    </div>
                    <div className="text-[9px] font-bold opacity-50 uppercase tracking-tighter">{t('system_privileges_level')} {Object.values(UserRole).indexOf(role) + 1}</div>
                  </div>
                  {selectedUser.role === role && <CheckCircle2 size={24} className="text-emerald-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-10"
          >
            <div className="flex items-center justify-between mb-10 text-start">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">
                  {isEditing ? t('update_user') : t('register_user')}
                </h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                  {isEditing ? `${t('modifying_profile')} ${selectedUser?.name}` : t('create_profile_desc')}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditing(false);
                  setSelectedUser(null);
                  setNewUser({ name: '', email: '', role: UserRole.DEPARTMENT_USER });
                }} 
                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="space-y-2 text-start">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('full_name')}</label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-2 text-start">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('email_address')}</label>
                <input 
                  type="email" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner"
                  placeholder="name@kdru.edu.af"
                />
              </div>

              {!isEditing && (
                <div className="space-y-2 text-start">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('password')}</label>
                  <input 
                    type="password" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner"
                    placeholder="••••••••"
                    required={!isEditing}
                  />
                </div>
              )}

              <div className="space-y-2 text-start">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('assign_initial_role')}</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner appearance-none"
                >
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>{t(`role_${role.toLowerCase()}`)}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-100 text-slate-900 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-slate-900/5 mt-4 active:scale-95"
              >
                {isEditing ? t('sync_changes') : t('sync_to_system')}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
