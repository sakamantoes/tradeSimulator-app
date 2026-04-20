import React from 'react';
import { Navigate, Outlet, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface AdminRouteProps {
  children?: React.ReactNode;
  requireSuperAdmin?: boolean;
  requirePermissions?: string[];
  redirectTo?: string;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requireSuperAdmin = false,
  requirePermissions = [],
  redirectTo = '/dashboard',
}) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    toast.error('Please login to access admin area');
    return (
      <Navigate
        to="/login"
        search={{
          redirect: location.pathname,
        }}
      />
    );
  }

  // Check if user has admin role
  if (user.role !== 'admin') {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/dashboard" />;
  }

  // Check if super admin is required
  if (requireSuperAdmin) {
    // This would require additional logic to check if user is super admin
    // You might want to add a `isSuperAdmin` flag to the user object
    // For now, we'll assume first admin is super admin
    const isSuperAdmin = user.id === 1; // This should be replaced with actual logic
    if (!isSuperAdmin) {
      toast.error('Super admin privileges required');
      return <Navigate to="/admin" />;
    }
  }

  // Check for specific permissions
  if (requirePermissions.length > 0) {
    // You would need to implement a permissions system
    // For now, we'll check against user permissions if available
    const userPermissions = (user as any).permissions || [];
    const hasAllPermissions = requirePermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      toast.error('You do not have the required permissions');
      return <Navigate to="/admin" />;
    }
  }

  // Render children or outlet
  return <>{children || <Outlet />}</>;
};

// Admin dashboard layout with sidebar and header
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/deposits', label: 'Deposits', icon: '💰' },
    { path: '/admin/withdrawals', label: 'Withdrawals', icon: '💸' },
    { path: '/admin/trades', label: 'Trades', icon: '📈' },
    { path: '/admin/market', label: 'Market Settings', icon: '🎛️' },
    { path: '/admin/settings', label: 'System Settings', icon: '⚙️' },
    { path: '/admin/reports', label: 'Reports', icon: '📄' },
  ];

  const handleLogout = async () => {
    try {
      const { authService } = await import('@/services/auth');
      await authService.logout();
      logout();
      toast.success('Logged out successfully');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Admin Header */}
      <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
        <div className="flex-1">
          <a href="/admin" className="btn btn-ghost normal-case text-xl">
            🎮 Trade Simulator Admin
          </a>
        </div>
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                <span className="text-lg font-bold">
                  {user?.fullName?.charAt(0) || 'A'}
                </span>
              </div>
            </label>
            <ul
              tabIndex={0}
              className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
            >
              <li>
                <a href="/profile" className="justify-between">
                  Profile
                  <span className="badge">Admin</span>
                </a>
              </li>
              <li>
                <a href="/dashboard" className="justify-between">
                  User Dashboard
                </a>
              </li>
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="drawer lg:drawer-open">
        <input id="admin-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content p-6">
          {/* Mobile menu button */}
          <label
            htmlFor="admin-drawer"
            className="btn btn-primary drawer-button lg:hidden mb-4"
          >
            ☰ Menu
          </label>
          {children}
        </div>

        {/* Admin Sidebar */}
        <div className="drawer-side">
          <label htmlFor="admin-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          <ul className="menu p-4 w-80 min-h-full bg-base-100 text-base-content">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-primary">Admin Panel</h2>
              <p className="text-sm text-base-content/60">
                Welcome back, {user?.fullName}
              </p>
            </div>

            {menuItems.map((item) => (
              <li key={item.path} className="mb-1">
                <a
                  href={item.path}
                  className={`${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {item.label}
                </a>
              </li>
            ))}

            <li className="mt-auto pt-8">
              <div className="divider my-2"></div>
              <a
                href="/dashboard"
                className="text-error"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/dashboard';
                }}
              >
                <span className="text-xl mr-3">🏠</span>
                Exit Admin Mode
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Higher-order component for class components
export const withAdminRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AdminRouteProps, 'children'>
): React.FC<P> => {
  return (props: P) => (
    <AdminRoute {...options}>
      <Component {...props} />
    </AdminRoute>
  );
};

// Component for checking admin permissions in child components
export const useAdminPermission = () => {
  const { user } = useAuthStore();

  const hasPermission = (permission: string): boolean => {
    if (user?.role !== 'admin') return false;
    
    // Check specific permissions
    const permissions = (user as any).permissions || [];
    return permissions.includes(permission);
  };

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'admin' && user.id === 1; // Adjust logic as needed

  return {
    isAdmin,
    isSuperAdmin,
    hasPermission,
  };
};