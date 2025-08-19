import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSubscriptionStatus } from '@/utils/subscription';

/**
 * React Query hook for fetching and caching subscription status
 */
export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: getSubscriptionStatus,
    // Refetch every 5 minutes to check for subscription updates
    refetchInterval: 5 * 60 * 1000,
    // Keep the data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Retry failed requests
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to invalidate subscription status cache
 * Useful after purchase or subscription changes
 */
export function useInvalidateSubscription() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  };
}

/**
 * Hook to prefetch subscription status
 * Useful for preloading data before navigation
 */
export function usePrefetchSubscription() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['subscription-status'],
      queryFn: getSubscriptionStatus,
    });
  };
}