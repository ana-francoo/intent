import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabaseClient';

interface EmailConfirmationResponse {
  is_confirmed: boolean;
  confirmed_at: string | null;
}

export function useEmailConfirmation(
  email: string,
  isWaitingForConfirmation: boolean
) {
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['email-confirmation', email],
    queryFn: async () => {
      const response = await supabase
        .rpc('check_email_confirmation', { user_email: email })
        .maybeSingle();
      
      const { data, error } = response;
      
      if (error) {
        console.log('Error checking confirmation status:', error);
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      const typedData = data as EmailConfirmationResponse;
      
      
      if (!typedData.is_confirmed) {
        return null;
      }
      
      console.log('✅ Email confirmed! Invalidating auth queries...');
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      return {
        email_confirmed_at: typedData.confirmed_at,
        confirmed_at: typedData.confirmed_at,
        is_confirmed: true
      };
    },
    enabled: isWaitingForConfirmation && !!email,
    refetchInterval: (query) => {
      const data = query.state.data;
      const isConfirmed = !!(data?.email_confirmed_at || data?.confirmed_at);
      return isConfirmed ? false : 2000;
    },
    refetchIntervalInBackground: true,
    retry: false,
    staleTime: 0,
  });

  const isEmailConfirmed = profile?.is_confirmed === true;
  
  return { 
    userData: profile, 
    isEmailConfirmed, 
    isLoading, 
    error: error as Error | null 
  };
}