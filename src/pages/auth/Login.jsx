import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Login.module.css';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signIn, signed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (signed) {
      navigate('/', { replace: true });
    }
  }, [signed, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    console.info('[AUTH_DEBUG] login_page:submit', { email });

    try {
      const authenticate = typeof login === 'function' ? login : signIn;

      if (typeof authenticate !== 'function') {
        throw new Error('Falha de autenticação. Recarregue a página e tente novamente.');
      }

      await authenticate(email, password);
      console.info('[AUTH_DEBUG] login_page:authenticated, navigating to /');
      navigate('/');
    } catch (err) {
      console.error('[AUTH_DEBUG] login_page:error', err);
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="https://www.inovaflowtec.com.br/svg/junadarci.png" alt="Logo" className={styles.logo} />
          <h1>Bem-vinda</h1>
          <p>Acesse sua conta para gerenciar a clínica</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} />
              <input 
                type="email" 
                id="email"
                placeholder="exemplo@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button 
                type="button" 
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.forgotPass}>
            <a href="/esqueci-senha">Esqueceu a senha?</a>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Acessando...' : 'Entrar'}
            <LogIn size={20} />
          </button>
        </form>

        {/* Rodapé removido para não exibir dica de usuário/senha */}
      </div>
    </div>
  );
};

export default Login;
