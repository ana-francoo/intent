import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabaseClient';

export function useEmailConfirmation(email: string, isWaitingForConfirmation: boolean) {
  const { data: userData } = useQuery({
    queryKey: ['email-confirmation', email],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error checking email confirmation:', error);
        return null;
      }
      return user;
    },
    enabled: isWaitingForConfirmation,
    refetchInterval: (query) => {
      return query.state.data?.email_confirmed_at ? false : 1000;
    },
    refetchIntervalInBackground: true,
  });

  const isEmailConfirmed = !!userData?.email_confirmed_at;
  
  return { userData, isEmailConfirmed };
}