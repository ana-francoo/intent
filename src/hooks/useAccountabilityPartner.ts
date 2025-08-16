import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabaseClient';
import { useUser } from './useAuth';

interface AccountabilityPartner {
  email: string;
  enabled: boolean;
}

/**
 * Fetch accountability partner data
 */
export function useAccountabilityPartner() {
  const user = useUser();

  return useQuery({
    queryKey: ['accountability-partner', user?.id],
    queryFn: async (): Promise<AccountabilityPartner> => {
      if (!user) {
        return { email: '', enabled: false };
      }

      const { data, error } = await supabase
        .from('accountability_partners')
        .select('email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        return { email: '', enabled: false };
      }

      return {
        email: data.email || '',
        enabled: true,
      };
    },
    enabled: !!user, // Only run query if user exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Save accountability partner
 */
export function useSaveAccountabilityPartner() {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('accountability_partners')
        .upsert({
          user_id: user.id,
          email,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { email, enabled: true };
    },
    onSuccess: (data) => {
      // Update the cache with new data
      queryClient.setQueryData(['accountability-partner', user?.id], data);
    },
  });
}