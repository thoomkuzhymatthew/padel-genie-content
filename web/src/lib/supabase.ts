import { createClient } from '@supabase/supabase-js';
const env = import.meta.env;
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) throw new Error('Public Supabase configuration is missing');
export const supabase = createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_ANON_KEY);
