import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  if (env.SUPABASE_URL && url !== env.SUPABASE_URL) throw new Error('Browser and pipeline Supabase targets differ');
  return { root:'web',plugins:[tailwindcss()],build:{outDir:'dist'},define:{
    'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(url),
    'import.meta.env.VITE_SUPABASE_ANON_KEY':JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY),
  } };
});
