/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Expenses from './pages/admin/Expenses';
import Assets from './pages/admin/Assets';
import Meetings from './pages/admin/Meetings';
import CarRentals from './pages/admin/CarRentals';
import Vendors from './pages/admin/Vendors';
import Settings from './pages/admin/Settings';
import Reports from './pages/admin/Reports';

export default function App() {
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
              
              {/* Admin & Office Admin only routes */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'office admin']} />}>
                <Route path="expenses" element={<Expenses />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* All roles (Admin, Office Admin, TL) */}
              <Route path="assets" element={<Assets />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="car-rentals" element={<CarRentals />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

