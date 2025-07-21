'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/useAuth';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Unauthorized component
const UnauthorizedAccess = ({ requiredRole, userRole }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this page.
      </p>
      <div className="text-sm text-gray-500 mb-6">
        <p>Required role: <span className="font-semibold">{Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}</span></p>
        <p>Your role: <span className="font-semibold">{userRole || 'None'}</span></p>
      </div>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredRoles = null,
  redirectTo = '/login',
  fallback = null 
}) => {
  const { isAuthenticated, isLoading, user, hasRole, hasAnyRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🛡️ ProtectedRoute: Auth state check:', {
      isAuthenticated,
      isLoading,
      user: user?.userId,
      role: user?.role,
      requiredRole,
      requiredRoles
    });

    // Don't redirect while loading
    if (isLoading) {
      console.log('🛡️ ProtectedRoute: Still loading, waiting...');
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      console.log('🛡️ ProtectedRoute: Not authenticated, redirecting to:', redirectTo);
      console.log('🛡️ ProtectedRoute: Router object:', router);
      try {
        router.push(redirectTo);
        console.log('🛡️ ProtectedRoute: Redirect called successfully');
      } catch (error) {
        console.error('🛡️ ProtectedRoute: Redirect failed:', error);
      }
      return;
    }

    // Check role requirements
    if (requiredRole && !hasRole(requiredRole)) {
      console.log('🛡️ ProtectedRoute: Role check failed for single role:', requiredRole);
      return;
    }

    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      console.log('🛡️ ProtectedRoute: Role check failed for multiple roles:', requiredRoles);
      return;
    }

    console.log('🛡️ ProtectedRoute: All checks passed, rendering content');
  }, [isAuthenticated, isLoading, user, requiredRole, requiredRoles, hasRole, hasAnyRole, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // Check role requirements
  const roleToCheck = requiredRoles || requiredRole;
  if (roleToCheck) {
    const hasRequiredRole = requiredRoles 
      ? hasAnyRole(requiredRoles) 
      : hasRole(requiredRole);

    if (!hasRequiredRole) {
      return <UnauthorizedAccess requiredRole={roleToCheck} userRole={user?.role} />;
    }
  }

  // Render children if all checks pass
  return children;
};

// Higher-order component for protecting pages
export const withAuth = (WrappedComponent, options = {}) => {
  const AuthenticatedComponent = (props) => {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return AuthenticatedComponent;
};

// Role-specific protected route components
export const FacultyRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRoles={["faculty_lab_staff", "hod"]} {...props}>
    {children}
  </ProtectedRoute>
);

export const SecurityRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRoles={['security_staff', 'security_incharge']} {...props}>
    {children}
  </ProtectedRoute>
);

export const SecurityHeadRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRole="security_incharge" {...props}>
    {children}
  </ProtectedRoute>
);

export const AnyAuthenticatedRoute = ({ children, ...props }) => (
  <ProtectedRoute {...props}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
