import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

/**
 * Gets the dashboard path for a given user role.
 */
function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'client':
      return '/dashboard';
    case 'worker':
      return '/dashboard/worker';
    case 'admin':
      return '/dashboard/admin';
  }
}

/**
 * A route wrapper that:
 * - Shows a loading spinner while auth state is being determined
 * - Redirects to /login if the user is not authenticated
 * - Restricts access by role when allowedRoles is provided
 * - Displays an error for unrecognized roles with a support contact link
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuthStore();

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"
            role="status"
            aria-label="Loading"
          />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Handle unrecognized or missing role
  if (!role || !['client', 'worker', 'admin'].includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Unrecognized Account Type
          </h1>
          <p className="text-gray-700 mb-4">
            We could not determine your account type. Please contact support for
            assistance.
          </p>
          <a
            href="mailto:support@barangayworks.ph"
            className="text-primary-600 underline hover:text-primary-800"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // If allowedRoles is specified, check if the user's role is permitted
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the user's own dashboard
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <Outlet />;
}
