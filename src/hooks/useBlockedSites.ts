import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBlockedSites, saveBlockedSites as saveSites, deleteBlockedSites as deleteSites } from '@/utils/storage';

/**
 * Fetch blocked sites
 */
export function useBlockedSites() {
  return useQuery({
    queryKey: ['blocked-sites'],
    queryFn: async () => {
      const sites = await getBlockedSites();
      // Return as an array of normalized URLs
      return sites;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

/**
 * Add blocked sites
 */
export function useAddBlockedSites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (urls: string[]) => {
      await saveSites(urls);
      return urls;
    },
    onMutate: async (urls) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['blocked-sites'] });
      
      // Snapshot the previous value
      const previous = queryClient.getQueryData<string[]>(['blocked-sites']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['blocked-sites'], (old: string[] = []) => {
        const set = new Set([...old, ...urls]);
        return Array.from(set);
      });
      
      // Return a context object with the snapshotted value
      return { previous };
    },
    onError: (_err, _urls, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previous) {
        queryClient.setQueryData(['blocked-sites'], context.previous);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['blocked-sites'] });
    },
  });
}

/**
 * Remove blocked sites
 */
export function useRemoveBlockedSites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (urls: string[]) => {
      await deleteSites(urls);
      return urls;
    },
    onMutate: async (urls) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['blocked-sites'] });
      
      // Snapshot the previous value
      const previous = queryClient.getQueryData<string[]>(['blocked-sites']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['blocked-sites'], (old: string[] = []) => {
        const urlSet = new Set(urls);
        return old.filter(url => !urlSet.has(url));
      });
      
      // Return a context object with the snapshotted value
      return { previous };
    },
    onError: (_err, _urls, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previous) {
        queryClient.setQueryData(['blocked-sites'], context.previous);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['blocked-sites'] });
    },
  });
}