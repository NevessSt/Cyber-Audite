import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AuditList from './pages/AuditList';
import CreateAudit from './pages/CreateAudit';
import AuditDetails from './pages/AuditDetails';
import CreateFinding from './pages/CreateFinding';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import CreateProject from './pages/CreateProject';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/audits" element={<AuditList />} />
              <Route path="/audits/:id" element={<AuditDetails />} />
            </Route>
          </Route>

          {/* Auditor & Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'AUDITOR']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/audits/new" element={<CreateAudit />} />
              <Route path="/audits/:id/findings/new" element={<CreateFinding />} />
              <Route path="/projects/new" element={<CreateProject />} />
            </Route>
          </Route>

          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/logs" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
