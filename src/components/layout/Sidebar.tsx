import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  Truck, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  onLogout: () => void;
}

export const Sidebar = ({ collapsed, setCollapsed, onLogout }: SidebarProps) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { id: 'inventory', label: t('inventory'), icon: Package, path: '/inventory' },
    { id: 'receiving', label: t('receiving'), icon: Truck, path: '/receiving' },
    { id: 'requests', label: t('requests'), icon: FileText, path: '/requests' },
    { id: 'procurement', label: t('procurement'), icon: ShoppingCart, path: '/procurement' },
    { id: 'reports', label: t('reports'), icon: BarChart3, path: '/reports' },
    { id: 'settings', label: t('settings'), icon: Settings, path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setCollapsed(true)}
        />
      )}

      <motion.div
        initial={false}
        animate={{ 
          width: collapsed ? (typeof window !== 'undefined' && window.innerWidth < 1024 ? 0 : 100) : 320,
          x: (collapsed && typeof window !== 'undefined' && window.innerWidth < 1024) 
            ? (isRtl ? '100%' : '-100%') 
            : 0
        }}
        className={cn(
          "fixed lg:relative h-screen bg-[#0F8F7F] text-white flex flex-col transition-all duration-300 border-r border-white/5 z-[70] shadow-[20px_0_50px_rgba(0,0,0,0.1)] lg:shadow-none",
          isRtl ? "right-0 border-l border-r-0" : "left-0"
        )}
      >
        <div className="p-8 pb-10 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                  <span className="text-primary-teal font-black text-2xl">K</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter leading-none">KANDAHAR</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">Warehouse MS</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-3 bg-white/10 hover:bg-white text-white hover:text-primary-teal rounded-2xl transition-all shadow-lg group hidden lg:block"
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} className={cn("transition-transform", isRtl ? "rotate-180" : "group-hover:-translate-x-0.5")} />}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setCollapsed(true)}
            className="lg:hidden p-3 bg-white/10 rounded-2xl"
          >
            <ChevronLeft size={20} className={isRtl ? "rotate-180" : ""} />
          </button>
        </div>

      <nav className="flex-1 px-5 space-y-3 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => cn(
              "w-full flex items-center gap-5 p-4 rounded-3xl transition-all group relative",
              isActive 
                ? "bg-white text-primary-teal shadow-2xl shadow-black/10" 
                : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} className="shrink-0" />
                {!collapsed && (
                  <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
                )}
                {!collapsed && isActive && (
                  <motion.div 
                    layoutId="nav-dot"
                    className={cn(
                      "absolute w-1.5 h-1.5 bg-primary-teal rounded-full",
                      isRtl ? "left-4" : "right-4"
                    )}
                  />
                )}
                {collapsed && (
                  <div className={cn(
                    "absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 bg-slate-900 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-xl",
                    isRtl ? "right-24" : "left-24"
                  )}>
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-5 p-4 rounded-3xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut size={22} />
          {!collapsed && <span className="font-black text-xs uppercase tracking-widest">{t('logout')}</span>}
        </button>
      </div>
    </motion.div>
    </>
  );
};
