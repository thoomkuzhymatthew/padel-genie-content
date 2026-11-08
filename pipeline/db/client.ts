import { createClient } from '@supabase/supabase-js';
import { requireEnv } from '../env.js';
export const adminClient = () => createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SECRET_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
