import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query'; // Changed from @tanstack/react-query
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import VendorDashboard from './pages/vendor/VendorDashboard';
import PendingEvents from './pages/admin/PendingEvents';
import VendorManagement from './pages/admin/VendorManagement';
import OrdersManagement from './pages/admin/OrdersManagement';
import MyEvents from './pages/vendor/MyEvents';
import CreateEvent from './pages/vendor/CreateEvent';
import VendorOrders from './pages/vendor/VendorOrders';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          user?.role === 'ADMIN' ? <AdminDashboard /> : <VendorDashboard />
        } />
        
        {/* Admin Routes */}
        <Route path="admin" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/pending-events" element={
          <ProtectedRoute requiredRole="ADMIN">
            <PendingEvents />
          </ProtectedRoute>
        } />
        <Route path="admin/vendors" element={
          <ProtectedRoute requiredRole="ADMIN">
            <VendorManagement />
          </ProtectedRoute>
        } />
        <Route path="admin/orders" element={
          <ProtectedRoute requiredRole="ADMIN">
            <OrdersManagement />
          </ProtectedRoute>
        } />
        
        {/* Vendor Routes */}
        <Route path="vendor" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorDashboard />
          </ProtectedRoute>
        } />
        <Route path="vendor/my-events" element={
          <ProtectedRoute requiredRole="VENDOR">
            <MyEvents />
          </ProtectedRoute>
        } />
        <Route path="vendor/create-event" element={
          <ProtectedRoute requiredRole="VENDOR">
            <CreateEvent />
          </ProtectedRoute>
        } />
        <Route path="vendor/orders" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorOrders />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;