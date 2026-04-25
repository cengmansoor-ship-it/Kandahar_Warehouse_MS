import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  onLogout: () => void;
}

export const Sidebar = ({ collapsed, setCollapsed, onLogout }: SidebarProps) => {
  const { t, i18n } = useTranslation();
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
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { id: 'inventory', label: t('inventory'), icon: Package, path: '/inventory' },
    { id: 'receiving', label: t('receiving'), icon: Truck, path: '/receiving' },
    { id: 'requests', label: t('requests'), icon: FileText, path: '/requests' },
    { id: 'procurement', label: t('procurement'), icon: ShoppingCart, path: '/procurement' },
    { id: 'reports', label: t('reports'), icon: BarChart3, path: '/reports' },
    { id: 'trash', label: t('trash_bin'), icon: Trash2, path: '/trash' },
    { id: 'settings', label: t('settings'), icon: Settings, path: '/settings' },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? '90px' : '280px' }}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        "bg-[#0F8F7F] h-screen flex flex-col transition-all duration-500 overflow-hidden z-50 fixed lg:relative sidebar",
        collapsed ? "w-[90px]" : "w-[280px]"
      )}
    >
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

      <nav className="flex-1 px-5 space-y-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => cn(
              "w-full flex items-center gap-5 p-4 rounded-3xl transition-all group relative",
              isActive 
                ? "bg-white/20 text-white shadow-lg" 
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <div className="flex flex-1 items-center gap-5 text-start">
                  <item.icon size={22} className="shrink-0" />
                  {!collapsed && (
                    <span className={cn("font-black uppercase tracking-widest", isRtl ? "text-sm" : "text-xs")}>{item.label}</span>
                  )}
                </div>
                {!collapsed && isActive && (
                  <motion.div 
                    layoutId="nav-dot"
                    className={cn(
                      "absolute w-1.5 h-1.5 bg-white rounded-full",
                      isRtl ? "right-4" : "left-4"
                    )}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

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
