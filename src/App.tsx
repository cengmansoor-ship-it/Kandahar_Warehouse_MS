/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { InventoryManager } from './components/inventory/InventoryManager';
import { ReceivingManager } from './components/inventory/ReceivingManager';
import { RequestManager } from './components/requests/RequestManager';
import { ProcurementManager } from './components/procurement/ProcurementManager';
import { ReportManager } from './components/reports/ReportManager';
import { SettingsManager } from './components/settings/SettingsManager';
import { TrashManager } from './components/inventory/TrashManager';
import { ExitClearanceManager } from './components/inventory/ExitClearanceManager';
import { LoginManager } from './components/auth/LoginManager';
import AboutUs from './pages/AboutUs';
import AIAssistantPage from './pages/AIAssistantPage';
import Dashboard from './pages/Dashboard';
import { Package, TrendingUp, AlertTriangle, FileCheck, ArrowRight } from 'lucide-react';
import { User, UserRole } from './types';
import { RoleManagement } from './pages/RoleManagement';
import SystemGuide from './pages/SystemGuide';
import { Toaster } from 'sonner';
import { cn } from './lib/utils';

function MainRoutes({ user, handleLogout }: { user: User, handleLogout: () => void }) {
  return (
    <Layout onLogout={handleLogout} user={user}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<InventoryManager />} />
        <Route path="/receiving" element={<ReceivingManager />} />
        <Route path="/requests" element={<RequestManager />} />
        <Route path="/procurement" element={<ProcurementManager />} />
        <Route path="/reports" element={<ReportManager />} />
        <Route path="/trash" element={<TrashManager />} />
        <Route path="/settings" element={<SettingsManager />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/chat" element={<AIAssistantPage />} />
        <Route path="/guide" element={<SystemGuide />} />
        <Route path="/roles" element={<RoleManagement />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const [user, setUser] = React.useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser || savedUser === 'undefined') return null;
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      console.error("Auth: Failed to parse user session", e);
      return null;
    }
  });

  const handleLogin = (userData?: any) => {
    if (userData) {
      setUser(userData);
    } else {
      // Default fallback
      const defaultUser: User = {
        id: '1',
        name: 'Admin User',
        email: 'admin@kandahar.edu.af',
        role: UserRole.SUPER_ADMIN,
      };
      setUser(defaultUser);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      {!user ? (
        <LoginManager onLogin={handleLogin} />
      ) : (
        <MainRoutes user={user} handleLogout={handleLogout} />
      )}
    </BrowserRouter>
  );
}



