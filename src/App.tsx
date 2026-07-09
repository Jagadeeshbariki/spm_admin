/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import IdExplorer from './pages/admin/IdExplorer';
import Expenses from './pages/admin/Expenses';
import Assets from './pages/admin/Assets';
import Meetings from './pages/admin/Meetings';
import CarRentals from './pages/admin/CarRentals';
import Vendors from './pages/admin/Vendors';
import GuestRoom from './pages/admin/GuestRoom';
import Settings from './pages/admin/Settings';
import Reports from './pages/admin/Reports';
import WaterCollective from './pages/admin/WaterCollective';
import WaterCollectiveManagement from './pages/admin/WaterCollectiveManagement';
import MailTracker from './pages/admin/MailTracker';
import VillageGIS from './pages/admin/VillageGIS';
import VillageGISManagement from './pages/admin/VillageGISManagement';
import TeamTravel from './pages/admin/TeamTravel';
import CropsDashboard from './pages/admin/CropsDashboard';

export default function App() {
  useEffect(() => {
    // Small delay to ensure everything is rendered
    const timer = setTimeout(() => {
      document.body.classList.add('loaded');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="id-explorer" element={<IdExplorer />} />
              
              {/* Data pages accessible to all roles */}
              <Route path="expenses" element={<Expenses />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="guest-room" element={<GuestRoom />} />
              <Route path="reports" element={<Reports />} />
              <Route path="assets" element={<Assets />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="car-rentals" element={<CarRentals />} />
              <Route path="mail-tracker" element={<MailTracker />} />
              <Route path="water-collective" element={<WaterCollective />} />
              <Route path="water-collective-management" element={<WaterCollectiveManagement />} />
              <Route path="about-region" element={<Navigate to="/admin/about-region/working-villages" replace />} />
              <Route path="about-region/working-villages" element={<VillageGIS tab="assets" />} />
              <Route path="about-region/processing-hubs" element={<VillageGIS tab="hubs" />} />
              <Route path="about-region/crops/dashboard" element={<CropsDashboard />} />
              <Route path="village-gis-management" element={<VillageGISManagement />} />
              <Route path="team-travel" element={<TeamTravel />} />

              {/* Admin only routes */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

