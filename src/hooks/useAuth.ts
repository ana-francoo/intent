import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { checkExistingSession } from '@/utils/auth';

/**
 * React Query hook for managing authentication state
 */
export function useAuth() {
  const queryClient = useQueryClient();

  // Set up auth state change listener
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // Only invalidate on actual auth state changes, not token refreshes
      // Token refreshes are handled automatically by supabase and don't need query invalidation
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        // Also invalidate subscription status when auth changes
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      }
      // For token refresh, just update the storage without invalidating queries
      else if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token refreshed automatically');
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout')), 10000); // 10 second timeout
      });
      
      try {
        const result = await Promise.race([
          checkExistingSession(),
          timeoutPromise
        ]);
        return result;
      } catch (error) {
        console.error('Auth check failed:', error);
        // Return null instead of throwing to prevent infinite retries
        return null;
      }
    },
    // Keep auth data fresh
    staleTime: 1 * 60 * 1000, // 1 minute
    // Don't garbage collect for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry failed auth checks, but not too aggressively
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * Hook for signing out
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Supabase handles clearing storage on signOut
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      // Clear all cached queries on sign out
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Sign out error:', error);
    },
  });
}

/**
 * Hook to get current user from cached auth data
 */
export function useUser() {
  const { data: session } = useAuth();
  return session?.user || null;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: session, isLoading } = useAuth();
  return {
    isAuthenticated: !!session,
    isLoading,
  };
}