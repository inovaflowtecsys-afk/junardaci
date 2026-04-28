/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';

// ─── Context default ──────────────────────────────────────────────────────────
const defaultAuthContext = {
  user: null,
  loading: true,
  sessionReady: false,
  authError: '',
  signed: false,
  login: async () => { throw new Error('Autenticação indisponível'); },
  signIn: async () => { throw new Error('Autenticação indisponível'); },
  logout: () => {},
};

const AuthContext = createContext(defaultAuthContext);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeRole = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const isAdminRole = (value) => {
  const r = normalizeRole(value);
  return r === 'admin' || r === 'administrador' || r.startsWith('admin');
};

const mapAuthUser = (authUser, profile) => {
  const profileRole  = normalizeRole(profile?.role);
  const appRole      = normalizeRole(authUser.app_metadata?.role);
  const metaRole     = normalizeRole(authUser.user_metadata?.role);

  const adminFromAny = isAdminRole(profileRole) || isAdminRole(appRole) || isAdminRole(metaRole);
  const effectiveRole = adminFromAny
    ? 'admin'
    : profileRole || appRole || metaRole || 'profissional';

  return {
    id:      profile?.id || authUser.id,
    nome:    profile?.nome || authUser.user_metadata?.nome || authUser.user_metadata?.full_name || 'Usuário',
    email:   authUser.email || profile?.email || '',
    role:    effectiveRole,
    isAdmin: adminFromAny,
    setor:   profile?.setores?.nome || null,
    avatar:  profile?.avatar_url || authUser.user_metadata?.avatar_url || '',
  };
};

// Busca perfil sem recursão: a função no banco é SECURITY DEFINER
const fetchProfile = async (authUserId) => {
  if (!supabase || !authUserId) return { profile: null, profileError: null };

  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await supabase
      .from('profissionais')
      .select('id,nome,email,role,avatar_url,auth_user_id,setores(nome)')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (data && !error) return { profile: data, profileError: null };
    if (attempt < 3) await new Promise((r) => setTimeout(r, 800 * attempt));
  }

  return { profile: null, profileError: new Error('Não foi possível carregar o perfil.') };
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(hasSupabaseConfig);
  const [sessionReady, setSessionReady] = useState(!hasSupabaseConfig);
  const [authError,    setAuthError]    = useState('');

  const bootstrapped = useRef(false);
  const mounted      = useRef(true);

  // ── Marca a sessão como pronta e libera o loading ─────────────────────────
  const markReady = useCallback(() => {
    if (!mounted.current) return;
    setLoading(false);
    setSessionReady(true);
  }, []);

  // ── Bootstrap: lê a sessão salva no localStorage ao montar ───────────────
  useEffect(() => {
    mounted.current = true;

    if (!hasSupabaseConfig || !supabase) {
      if (hasSupabaseConfig) {
        setAuthError('Cliente Supabase não inicializado.');
      }
      markReady();
      return;
    }

    if (bootstrapped.current) return;
    bootstrapped.current = true;

    // Timeout de segurança: se demorar mais de 12s, libera a UI
    const safetyTimer = setTimeout(() => {
      if (!mounted.current) return;
      setAuthError('A validação da sessão demorou demais. Tente recarregar a página.');
      markReady();
    }, 12000);

    const bootstrap = async () => {
      try {
        // 1. Pega a sessão do localStorage (pode estar expirada)
        let { data, error } = await supabase.auth.getSession();

        if (error) console.warn('[AUTH] getSession error:', error.message);

        let sessionUser = data?.session?.user ?? null;

        // 2. Se o token expirou, tenta refresh silencioso
        if (!sessionUser && data?.session) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          sessionUser = refreshed?.session?.user ?? null;
        }

        if (!mounted.current) return;

        if (!sessionUser) {
          setUser(null);
          clearTimeout(safetyTimer);
          markReady();
          return;
        }

        // 3. Define usuário básico imediatamente (sem bloquear a UI)
        setUser(mapAuthUser(sessionUser, null));
        clearTimeout(safetyTimer);
        markReady();

        // 4. Busca perfil em background
        const { profile, profileError } = await fetchProfile(sessionUser.id);
        if (!mounted.current) return;
        if (profile) setUser(mapAuthUser(sessionUser, profile));
        if (profileError) console.error('[AUTH] profile fetch error:', profileError.message);

      } catch (err) {
        if (!mounted.current) return;
        console.error('[AUTH] bootstrap error:', err);
        setUser(null);
        clearTimeout(safetyTimer);
        markReady();
      }
    };

    bootstrap();

    // ── Listener do Supabase: dispara em login, logout, refresh de token ──
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;

      if (!session?.user) {
        setUser(null);
        setAuthError('');
        markReady();
        return;
      }

      // Atualiza usuário básico imediatamente
      setUser(mapAuthUser(session.user, null));
      setAuthError('');
      markReady();

      // Busca perfil em background
      const { profile, profileError } = await fetchProfile(session.user.id);
      if (!mounted.current) return;
      if (profile) setUser(mapAuthUser(session.user, profile));
      if (profileError) console.error('[AUTH] onAuthStateChange profile error:', profileError.message);
    });

    // ── visibilitychange: revalida token ao voltar para a aba ─────────────
    // NÃO derruba sessão válida — só faz refresh se o token estiver expirado.
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      try {
        const { data } = await supabase.auth.getSession();
        const session  = data?.session;

        if (!session) {
          // Sem sessão: o onAuthStateChange já cuidará disso
          return;
        }

        // Verifica se o token expira em menos de 60 segundos
        const expiresAt = session.expires_at; // unix timestamp
        const now       = Math.floor(Date.now() / 1000);

        if (expiresAt && expiresAt - now < 60) {
          // Força refresh silencioso
          const { data: refreshed, error } = await supabase.auth.refreshSession();
          if (error) {
            console.warn('[AUTH] refresh failed on visibilitychange:', error.message);
            return;
          }
          if (refreshed?.session?.user && mounted.current) {
            setUser(mapAuthUser(refreshed.session.user, null));
            // Busca perfil atualizado em background
            fetchProfile(refreshed.session.user.id).then(({ profile }) => {
              if (profile && mounted.current) setUser(mapAuthUser(refreshed.session.user, profile));
            });
          }
        }
        // Se o token ainda é válido, não faz nada — evita "Empty token!"
      } catch (err) {
        console.warn('[AUTH] visibilitychange error:', err.message);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── beforeunload: logout ao fechar o navegador/aba ─────────────────────
    const handleBeforeUnload = () => {
      // fire-and-forget: o browser pode não aguardar promises, mas
      // signOut() limpa o localStorage antes de fechar.
      try { supabase.auth.signOut(); } catch (_) {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted.current = false;
      clearTimeout(safetyTimer);
      listener.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    setAuthError('');

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setAuthError(error.message || 'Não foi possível autenticar.');
        setLoading(false);
        throw error;
      }

      const authUser = data?.user || data?.session?.user;
      if (!authUser) {
        setLoading(false);
        throw new Error('Não foi possível autenticar o usuário.');
      }

      const nextUser = mapAuthUser(authUser, null);
      setUser(nextUser);
      setAuthError('');
      markReady();

      // Busca perfil em background sem bloquear o redirect
      fetchProfile(authUser.id)
        .then(({ profile, profileError }) => {
          if (profile) setUser(mapAuthUser(authUser, profile));
          if (profileError) console.error('[AUTH] login profile error:', profileError.message);
        })
        .catch((err) => console.error('[AUTH] login profile catch:', err.message));

      return nextUser;
    }

    // Fallback sem Supabase (modo demo)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setLoading(false);
        reject(new Error('Supabase não configurado.'));
      }, 400);
    });
  };

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSessionReady(false);
  };

  const value = {
    user,
    loading,
    sessionReady,
    authError,
    signed: !!user,
    login,
    signIn: login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
