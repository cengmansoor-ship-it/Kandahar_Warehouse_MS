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
}

export const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
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
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 100 : 300 }}
      className={cn(
        "h-screen bg-[#0F8F7F] text-white flex flex-col transition-all duration-300 border-r border-[#0F8F7F]/10 relative z-50",
        isRtl ? "border-l border-r-0" : ""
      )}
    >
      <div className="p-8 pb-12 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-primary-teal font-black text-2xl">K</span>
              </div>
              <span className="font-black tracking-tighter">WMS</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2.5 bg-white/10 hover:bg-white text-white hover:text-primary-teal rounded-2xl transition-all shadow-lg"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} className={isRtl ? "rotate-180" : ""} />}
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
        <button className="w-full flex items-center gap-5 p-4 rounded-3xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all group">
          <LogOut size={22} />
          {!collapsed && <span className="font-black text-xs uppercase tracking-widest">{t('logout')}</span>}
        </button>
      </div>
    </motion.div>
  );
};
