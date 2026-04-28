import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

// Singleton — nunca recriar o cliente fora daqui.
// Usa localStorage (padrão) para que o token persista entre abas corretamente.
// O logout ao fechar o navegador é gerenciado pelo beforeunload no AuthContext.
export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'clinica-auth-token', // chave explícita no localStorage
      },
    })
  : null;

