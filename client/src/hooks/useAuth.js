import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

/**
 * Hook to access auth state and actions.
 * Provides a convenient API for components.
 */
const useAuth = () => {
  const { user, accessToken, isLoading, error, login, register, logout, fetchMe, clearError } =
    useAuthStore();

  const isAuthenticated = !!user && !!accessToken;

  return { user, isAuthenticated, isLoading, error, login, register, logout, fetchMe, clearError };
};

/**
 * Redirect to login if not authenticated.
 */
export const useRequireAuth = (redirectTo = '/login') => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
};

export default useAuth;
