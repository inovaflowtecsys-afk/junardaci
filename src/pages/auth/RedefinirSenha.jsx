import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, Save } from 'lucide-react';
import styles from './Auth.module.css';
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient';

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;

    let mounted = true;

    const hydrate = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setReady(!!data?.session?.user);
    };

    hydrate();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || session?.user) {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!hasSupabaseConfig || !supabase) {
      setError('Funcionalidade disponível após configuração do Supabase.');
      return;
    }

    if (!ready) {
      setError('Abra o link de recuperação enviado por e-mail para carregar a sessão.');
      return;
    }

    if (!password || password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Senha atualizada com sucesso. Você já pode entrar com a nova senha.');
    setTimeout(() => navigate('/login'), 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <div className={styles.card}>
        <button onClick={() => navigate('/login')} className={styles.backBtn}>
          <ChevronLeft size={20} />
          Voltar para login
        </button>

        <div className={styles.header}>
          <h1>Redefinir Senha</h1>
          <p>Crie uma nova senha usando o link de recuperação do Supabase.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!hasSupabaseConfig && (
            <div className={styles.error}>
              Funcionalidade disponível após configuração do Supabase.
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.success}>{message}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="password">Nova senha</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} />
              <input
                id="password"
                type="password"
                placeholder="Digite a nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} />
              <input
                id="confirmPassword"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Salvando...' : 'Salvar nova senha'}
            <Save size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default RedefinirSenha;
