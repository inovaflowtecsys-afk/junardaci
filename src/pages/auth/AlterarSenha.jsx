import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal';
import { KeyRound } from 'lucide-react';
import Input from '../../components/Input';
import useToast from '../../hooks/useToast';
import styles from './Auth.module.css';

const AlterarSenha = ({ isOpen, onClose }) => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      addToast('Preencha todos os campos.', 'error');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      addToast('A nova senha e a confirmação não conferem.', 'error');
      return;
    }
    if (novaSenha.length < 6) {
      addToast('A nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaAtual,
      });
      if (loginError) throw loginError;
      const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
      if (updateError) throw updateError;
      addToast('Senha alterada com sucesso!', 'success');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      if (onClose) onClose();
    } catch (err) {
      addToast(err.message || 'Erro ao alterar senha.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={
      <span style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <KeyRound size={26} style={{color: '#b0b0b0'}} />
        <span style={{fontWeight: 800, fontSize: '1.35rem', color: '#888', fontFamily: 'Inter, sans-serif'}}>Alterar Senha</span>
      </span>
    }>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginTop: 6,
        maxWidth: 320,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        <div style={{color: '#888', fontSize: '1rem', marginBottom: 8, marginTop: -8}}>Altere sua senha de acesso ao sistema.</div>
        <Input
          label="Senha atual"
          type="password"
          value={senhaAtual}
          onChange={e => setSenhaAtual(e.target.value)}
          autoComplete="current-password"
        />
        <Input
          label="Nova senha"
          type="password"
          value={novaSenha}
          onChange={e => setNovaSenha(e.target.value)}
          autoComplete="new-password"
        />
        <Input
          label="Confirmar nova senha"
          type="password"
          value={confirmarSenha}
          onChange={e => setConfirmarSenha(e.target.value)}
          autoComplete="new-password"
        />
        <button type="submit" className={styles.submitBtn} disabled={loading} style={{marginTop: 8, minWidth: 0}}>
          {loading ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </form>
    </Modal>
  );
};

export default AlterarSenha;
