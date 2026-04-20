import React from 'react';
import { Navigate, Outlet, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '../UI/LoadingSpinner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireVerified?: boolean;
  requireEmailVerification?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerified = true,
  requireEmailVerification = false,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={redirectTo}
        search={{
          redirect: location.pathname,
        }}
      />
    );
  }

  // Check if email verification is required
  if (requireEmailVerification && !user.isVerified) {
    return <Navigate to="/verify-email" />;
  }

  // Check if user is verified (if required)
  if (requireVerified && !user.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card w-96 bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-warning">Email Verification Required</h2>
            <p className="py-4">
              Please verify your email address to access this page. Check your inbox for the
              verification link.
            </p>
            <div className="card-actions justify-end">
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    // Resend verification email logic
                    const { authService } = await import('@/services/auth');
                    await authService.resendVerificationEmail(user.email);
                    alert('Verification email sent!');
                  } catch (error) {
                    console.error('Failed to resend verification email:', error);
                    alert('Failed to send verification email. Please try again.');
                  }
                }}
              >
                Resend Verification Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render children or outlet
  return <>{children || <Outlet />}</>;
};

// Higher-order component for class components
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
): React.FC<P> => {
  return (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};