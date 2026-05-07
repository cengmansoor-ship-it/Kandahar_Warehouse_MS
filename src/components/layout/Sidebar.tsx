import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  FileText, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  Menu,
  Trash2,
  Activity,
  Info,
  Sparkles,
  Shield,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

import { User, UserRole, RolePermissions } from '@/src/types';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  onLogout: () => void;
  user: User;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemAnim = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

export const Sidebar = ({ collapsed, setCollapsed, onLogout, user }: SidebarProps) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [logo, setLogo] = React.useState<string>(localStorage.getItem('system_logo') || "https://upload.wikimedia.org/wikipedia/en/2/23/Kandahar_University_Logo.png");
  const isRtl = i18n.dir() === 'rtl';

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setLogo(base64String);
      localStorage.setItem('system_logo', base64String);
      toast.success("System logo updated successfully");
      window.dispatchEvent(new Event('storage'));
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    const handleStorageChange = () => {
      const storedLogo = localStorage.getItem('system_logo');
      if (storedLogo) setLogo(storedLogo);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, path: '/dashboard', permission: 'view_dashboard' },
    { id: 'inventory', label: t('inventory'), icon: Package, path: '/inventory', permission: 'manage_inventory' },
    { id: 'receiving', label: t('receiving'), icon: Truck, path: '/receiving', permission: 'manage_receiving' },
    { id: 'requests', label: t('requests'), icon: FileText, path: '/requests', permission: 'manage_requests' },
    { id: 'procurement', label: t('procurement'), icon: ShoppingCart, path: '/procurement', permission: 'manage_procurement' },
    { id: 'reports', label: t('reports'), icon: BarChart3, path: '/reports', permission: 'view_reports' },
    { id: 'trash', label: t('trash_bin'), icon: Trash2, path: '/trash', permission: 'manage_inventory' },
    { id: 'settings', label: t('settings'), icon: Settings, path: '/settings', permission: 'manage_settings' },
    { id: 'about', label: t('about_us'), icon: Info, path: '/about', permission: 'public' },
    { id: 'roles', label: 'Role Management', icon: Shield, path: '/roles', permission: 'all' },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.permission === 'public') return true;
    const permissions = RolePermissions[user.role];
    if (permissions.includes('all')) return true;
    return permissions.includes(item.permission);
  });

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: collapsed ? (window.innerWidth < 1024 ? '0px' : '90px') : '280px',
        x: collapsed && window.innerWidth < 1024 ? (isRtl ? 100 : -100) + '%' : '0%'
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        "bg-primary-teal h-screen flex flex-col transition-all duration-500 overflow-hidden z-[100] fixed lg:relative sidebar shadow-2xl lg:shadow-none",
        collapsed && "lg:w-[90px]"
      )}
    >
      {/* Overlay for mobile when sidebar is open */}
      {window.innerWidth < 1024 && !collapsed && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[-1]" 
          onClick={() => setCollapsed(true)} 
        />
      )}
      <div className="p-6 flex items-center justify-between mb-8">
        {!collapsed && (
          <motion.div 
            initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? 10 : -10 }}
            className="flex items-center gap-4"
          >
            <label className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl transition-all border border-slate-100 overflow-hidden cursor-pointer hover:ring-4 hover:ring-white/20 group relative">
              <img 
                src={logo} 
                alt="System Logo" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-black text-white uppercase tracking-tighter rounded-full">
                Change
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
            </label>
            <div className="flex flex-col text-start pt-1">
              <span className={cn("font-black uppercase text-white/60", isRtl ? "text-xs tracking-wider" : "text-[10px] tracking-[0.2em]")}>{t('warehouse_ms')}</span>
            </div>
          </motion.div>
        )}
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-lg hidden lg:block"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} className={cn("transition-transform", isRtl ? "rotate-180" : "rotate-0")} />}
        </button>

        {/* Mobile Close Button */}
        <button 
          onClick={() => setCollapsed(true)}
          className="lg:hidden p-3 bg-white/10 text-white rounded-2xl"
        >
          <ChevronLeft size={20} className={cn(isRtl && "rotate-180")} />
        </button>
      </div>

      <motion.nav 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 px-5 space-y-2 overflow-y-auto custom-scrollbar"
      >
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div variants={itemAnim} key={item.id}>
              <Link
                to={item.path}
                className={cn(
                  "w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-400 group relative border border-transparent overflow-hidden",
                  isActive 
                    ? "bg-white/20 text-white shadow-xl border-white/20 scale-[1.02]" 
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {/* Glossy hover effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className={cn("flex flex-1 items-center gap-4 relative z-10", isRtl ? "text-right" : "text-left")}>
                  <item.icon size={20} className={cn("shrink-0 transition-transform duration-500", isActive ? "rotate-[5deg]" : "group-hover:scale-110 group-hover:rotate-12")} />
                  {!collapsed && (
                    <span className={cn("font-black uppercase tracking-[0.1em] transition-all", isRtl ? "text-xs" : "text-[10px]", !isActive && "group-hover:translate-x-1")}>{item.label}</span>
                  )}
                </div>
                {!collapsed && isActive && (
                  <motion.div 
                    layoutId="nav-dot"
                    className={cn(
                      "absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)] z-10",
                      isRtl ? "right-2" : "left-2"
                    )}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>

      <div className="p-6">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-5 p-4 rounded-3xl text-white/70 hover:bg-white/10 hover:text-white transition-all group text-start"
        >
          <LogOut size={22} />
          {!collapsed && <span className={cn("font-black uppercase tracking-widest", isRtl ? "text-sm" : "text-xs")}>{t('logout')}</span>}
        </button>
      </div>
    </motion.aside>
  );
};
