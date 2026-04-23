import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Send } from 'lucide-react';
import styles from './Auth.module.css';
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient';

const EsqueciSenha = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hasSupabaseConfig || !supabase) {
      setError('Funcionalidade disponível após configuração do Supabase.');
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSubmitted(true);
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
          <h1>Recuperar Senha</h1>
          <p>Enviaremos um link de redefinição para o seu e-mail.</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.inputGroup}>
              <label>E-mail cadastrado</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} />
                <input 
                  type="email" 
                  placeholder="seuemail@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn}>
              {loading ? 'Enviando...' : 'Enviar link'}
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <h3>E-mail enviado!</h3>
            <p>Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
            <button onClick={() => navigate('/login')} className={styles.submitBtn}>
              Ir para Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EsqueciSenha;
