/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';

const defaultAuthContext = {
  user: null,
  loading: false,
  authError: '',
  signed: false,
  login: async () => {
    throw new Error('Autenticação indisponível no momento');
  },
  signIn: async () => {
    throw new Error('Autenticação indisponível no momento');
  },
  logout: () => {},
};

const AuthContext = createContext(defaultAuthContext);

const getUserByCredentials = (email, password) => {
  if (email === 'admin@clinica.com' && password === 'Admin@123') {
    return {
      id: 'p1',
      nome: 'Dra. Juliana Nardaci',
      email: 'admin@clinica.com',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80'
    };
  }

  if (email === 'profissional@clinica.com' && password === 'Prof@123') {
    return {
      id: 'p2',
      nome: 'Dra. Maria Silva',
      email: 'profissional@clinica.com',
      role: 'profissional',
      avatar: 'https://images.unsplash.com/photo-1594824475317-87f4c9d3e8f6?auto=format&fit=crop&w=200&q=80'
    };
  }

  return null;
};

const normalizeRole = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const isAdminRole = (value) => {
  const normalized = normalizeRole(value);
  return normalized === 'admin' || normalized === 'administrador' || normalized.startsWith('admin');
};

const mapAuthUser = (authUser, profile) => {
  const profileRole = normalizeRole(profile?.role);
  const appRole = normalizeRole(authUser.app_metadata?.role);
  const userMetadataRole = normalizeRole(authUser.user_metadata?.role);

  const adminFromAnySource = isAdminRole(profileRole) || isAdminRole(appRole) || isAdminRole(userMetadataRole);
  const effectiveRole = adminFromAnySource ? 'admin' : profileRole || appRole || userMetadataRole || 'profissional';

  return {
  id: profile?.id || authUser.id,
  nome:
    profile?.nome ||
    authUser.user_metadata?.nome ||
    authUser.user_metadata?.full_name ||
    'Usuário',
  email: authUser.email || profile?.email || '',
  role: effectiveRole,
  isAdmin: adminFromAnySource,
  setor: profile?.setores?.nome || null,
  avatar:
    profile?.avatar_url ||
    authUser.user_metadata?.avatar_url ||
    authUser.app_metadata?.avatar_url ||
    '',
  };
};

const ENABLE_PROFILE_LOOKUP = true;

const fetchProfileByAuthUserId = async (authUserId, _timeoutMs = 10000, maxRetries = 3, retryDelay = 1000) => {
  if (!ENABLE_PROFILE_LOOKUP || !supabase || !authUserId) {
    return { profile: null, profileError: null };
  }

  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { data, error } = await supabase
      .from('profissionais')
      .select('id,nome,email,role,avatar_url,auth_user_id,setores(nome)')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (data && !error) {
      return { profile: data, profileError: null };
    }
    lastError = error;
    // Aguarda antes de tentar novamente
    if (attempt < maxRetries) {
      await new Promise((res) => setTimeout(res, retryDelay));
    }
  }
  return {
    profile: null,
    profileError: lastError ?? new Error('Não foi possível carregar o perfil do profissional.'),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Nunca use localStorage se Supabase está ativo
    if (hasSupabaseConfig) return null;
    const savedUser = sessionStorage.getItem('@Clinic:user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [authError, setAuthError] = useState('');
  const bootstrappingRef = React.useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.info('[AUTH_DEBUG] visibilitychange:hidden, forcing logout');
        logout();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    let mounted = true;
    let bootstrapTimeoutId;

    const logAuthDebug = (stage, payload = {}) => {
      // Logs temporarios para diagnosticar fluxo de autenticacao e redirecionamento.
      console.info('[AUTH_DEBUG]', stage, payload);
    };

    const clearBootstrapTimeout = () => {
      if (bootstrapTimeoutId) {
        clearTimeout(bootstrapTimeoutId);
      }
    };

    const finishBootstrap = () => {
      clearBootstrapTimeout();
      if (mounted) setLoading(false);
    };

    if (hasSupabaseConfig) {
      bootstrapTimeoutId = setTimeout(() => {
        if (!mounted) return;
        // Se ainda estiver carregando apos 15 segundos, tenta liberar a trava
        setAuthError('A validação da sessão está demorando. Isso pode ser um conflito de abas abertas.');
        setLoading(false);
      }, 15000);
    }

    const hydrateSupabaseUser = async () => {
      if (bootstrappingRef.current) return;
      bootstrappingRef.current = true;

      try {
        logAuthDebug('bootstrap:start', { hasSupabaseConfig, hasClient: Boolean(supabase) });
        setAuthError('');
        
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('[AUTH_DEBUG] bootstrap:session_error', sessionError);
          // Nao limpa tudo aqui, apenas registra o erro
        }

        const sessionUser = data?.session?.user;
        logAuthDebug('bootstrap:session', { hasSessionUser: Boolean(sessionUser) });

        if (!mounted) return;

        if (!sessionUser) {
          setUser(null);
          finishBootstrap();
          return;
        }

        // Define usuario basico imediatamente para liberar a tela
        setUser(mapAuthUser(sessionUser, null));
        finishBootstrap();

        // Busca o perfil em segundo plano para nao travar o app
        const { profile, profileError } = await fetchProfileByAuthUserId(sessionUser.id);
        if (!mounted) return;

        if (profile) {
          setUser(mapAuthUser(sessionUser, profile));
        }
        
        if (profileError) {
          console.error('[AUTH_DEBUG] bootstrap:profile_error', profileError);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('[AUTH_DEBUG] bootstrap:catch', error);
        setUser(null);
        setAuthError('Falha na validação da sessão. Tente fazer login novamente.');
      } finally {
        finishBootstrap();
        bootstrappingRef.current = false;
        logAuthDebug('bootstrap:finish');
      }
    };

    if (hasSupabaseConfig && supabase) {
      hydrateSupabaseUser();

      const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
        if (!mounted) return;
        logAuthDebug('auth_state_change', {
          eventHasSession: Boolean(session),
          sessionUserId: session?.user?.id || null,
        });

        if (!session?.user) {
          setUser(null);
          setAuthError('');
          setLoading(false);
          logAuthDebug('auth_state_change:logout');
          return;
        }

        try {
          setUser(mapAuthUser(session.user, null));
          setAuthError('');
          setLoading(false);

          const { profile, profileError } = await fetchProfileByAuthUserId(session.user.id);

          if (!mounted) return;

          setUser(mapAuthUser(session.user, profile));
          setAuthError(profileError?.message || '');
          if (profileError) {
            console.error('[AUTH_DEBUG] auth_state_change:profile_error', profileError);
          }
        } catch (error) {
          if (!mounted) return;
          console.error('[AUTH_DEBUG] auth_state_change:catch', error);
          setUser(null);
          setAuthError(error?.message || 'Nao foi possivel atualizar a sessao autenticada.');
        } finally {
          if (mounted) setLoading(false);
          logAuthDebug('auth_state_change:finish', {
            signed: Boolean(session?.user),
          });
        }
      });

      return () => {
        mounted = false;
        clearBootstrapTimeout();
        listener.subscription.unsubscribe();
      };
    }

    if (hasSupabaseConfig && !supabase) {
      setAuthError('A configuracao do Supabase foi detectada, mas o cliente nao foi inicializado. Ele não prosseguiu para a tela de login.');
      setLoading(false);
    }

    return () => {
      mounted = false;
      clearBootstrapTimeout();
    };
  }, []);


  const login = async (email, password) => {
    console.info('[AUTH_DEBUG] login:start', { email });
    setLoading(true);

    if (hasSupabaseConfig && supabase) {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (error) {
        console.error('[AUTH_DEBUG] login:supabase_error', error);
        setAuthError(error.message || 'Nao foi possivel autenticar com o Supabase.');
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
      setLoading(false);
      console.info('[AUTH_DEBUG] login:success', {
        authUserId: authUser.id,
        mappedUserId: nextUser.id,
        role: nextUser.role,
      });

      fetchProfileByAuthUserId(authUser.id)
        .then(({ profile, profileError }) => {
          if (profile) {
            setUser(mapAuthUser(authUser, profile));
          }

          if (profileError) {
            console.error('[AUTH_DEBUG] login:profile_error', profileError);
            setAuthError(profileError.message || '');
          }
        })
        .catch((profileErr) => {
          console.error('[AUTH_DEBUG] login:profile_fetch_catch', profileErr);
          setAuthError(profileErr?.message || '');
        });

      // Nunca salve no localStorage se Supabase está ativo
      return nextUser;
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userData = getUserByCredentials(email, password);

        if (userData) {
          setUser(userData);
          sessionStorage.setItem('@Clinic:user', JSON.stringify(userData));
          resolve(userData);
        } else {
          reject(new Error('Credenciais inválidas'));
        }

        setLoading(false);
      }, 600);
    });
  };

  const logout = () => {
    if (hasSupabaseConfig && supabase) {
      supabase.auth.signOut();
    }

    setUser(null);
    sessionStorage.removeItem('@Clinic:user');
  };

  const value = {
    user,
    loading,
    authError,
    login,
    signIn: login,
    logout,
    signed: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
