import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knzzlcxeyzqvgrwhnjyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuenpsY3hleXpxdmdyd2huanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MDE3NDQsImV4cCI6MjA2Njk3Nzc0NH0.RX3cYTeDSwe6dvw5qIHi3W-yBBsntopvqDfinCNvffs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

