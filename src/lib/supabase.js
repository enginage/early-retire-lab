import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// 환경 변수가 없으면 개발 환경에서만 경고 출력
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  if (import.meta.env.DEV) {
    console.warn('⚠️ Supabase environment variables are not set. Authentication features will not work.');
    console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables.');
    console.warn('See VERCEL_ENV_SETUP.md for details.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

