import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dwihmvfanfnuxullwhyf.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_FZuodYYBnLYsK949Q_NJeg_YhxhpAlL';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);