import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, XCircle } from 'lucide-react';
import styles from '../../styles/forms.module.css';
import Input from '../../components/Input';
import FormSectionHeader from '../../components/FormSectionHeader';
import ErrorCard from '../../components/ErrorCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { supabase } from '../../lib/supabaseClient';

const emptyForm = {
  nome: '',
  descricao: '',
  valor: '',
  perc_max_desconto: '',
  duracao_estimada: '',
  ativo: true,
};

const FormTratamento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const addToast = (message, type = 'success') => {
    const toast = {
      id: `${Date.now()}-${Math.random()}`,
      title: type === 'success' ? 'Sucesso' : 'Atenção',
      message,
      type,
    };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 3200);
  };

  const handleField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: loadError } = await supabase
          .from('tratamentos')
          .select('*')
          .eq('id', id)
          .single();
        if (loadError) throw loadError;
        if (mounted && data) {
          setFormData({
            nome: data.nome || '',
            descricao: data.descricao || '',
            valor: data.valor ?? '',
            perc_max_desconto: data.perc_max_desconto ?? '',
            duracao_estimada: data.duracao_estimada ?? '',
            ativo: data.ativo ?? true,
          });
        }
      } catch (err) {
        if (mounted) setError(err?.message || 'Não foi possível carregar o tratamento.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  const handleSave = async () => {
    setError('');
    if (!formData.nome.trim()) {
      setError('O nome do tratamento é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: formData.nome.trim(),
        descricao: formData.descricao || null,
        valor: parseFloat(formData.valor) || 0,
        perc_max_desconto: parseFloat(formData.perc_max_desconto) || 0,
        duracao_estimada: parseInt(formData.duracao_estimada) || 0,
        ativo: Boolean(formData.ativo),
      };

      if (id) {
        const { error: updateError } = await supabase
          .from('tratamentos')
          .update(payload)
          .eq('id', id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('tratamentos')
          .insert(payload);
        if (insertError) throw insertError;
      }

      addToast('Tratamento salvo com sucesso!', 'success');
      navigate('/tratamentos');
    } catch (err) {
      setError(err?.message || 'Não foi possível salvar o tratamento.');
      addToast(err?.message || 'Erro ao salvar o tratamento.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteOpen(false);
    setSaving(true);
    try {
      const { error: deleteError } = await supabase.from('tratamentos').delete().eq('id', id);
      if (deleteError) throw deleteError;
      navigate('/tratamentos');
    } catch (err) {
      setError(err?.message || 'Não foi possível excluir o tratamento.');
      addToast(err?.message || 'Erro ao excluir o tratamento.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Carregando tratamento...</div>;
  }

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <button onClick={() => navigate('/tratamentos')} className={styles.backBtn}>
              <ChevronLeft size={20} />
            </button>
            <h1>{id ? 'Editar Tratamento' : 'Novo Tratamento'}</h1>
          </div>
          <div className={styles.actions}>
            {id && (
              <button className={styles.cancelBtn} onClick={() => setDeleteOpen(true)} disabled={saving}>
                <XCircle size={16} />
                Excluir
              </button>
            )}
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              <Save size={16} />
              Salvar Tratamento
            </button>
          </div>
        </header>

        <ErrorCard message={error} onClose={() => setError('')} />

        <div className={styles.card}>
          <FormSectionHeader title="DADOS DO TRATAMENTO" />
          <div className={styles.grid}>
            <div className={styles.col6}>
              <Input
                label="Nome do Tratamento"
                placeholder="Ex: Limpeza de Pele Profunda"
                value={formData.nome}
                onChange={handleField('nome')}
              />
            </div>
            <div className={styles.col2}>
              <Input
                label="Valor Base (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.valor}
                onChange={handleField('valor')}
              />
            </div>
            <div className={styles.col2}>
              <Input
                label="Duração (min)"
                type="number"
                min="0"
                placeholder="60"
                value={formData.duracao_estimada}
                onChange={handleField('duracao_estimada')}
              />
            </div>
            <div className={styles.col2}>
              <Input
                label="Desconto Máx. (%)"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={formData.perc_max_desconto}
                onChange={handleField('perc_max_desconto')}
              />
            </div>
            <div className={`${styles.col2} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Status</label>
              <select
                className={styles.fieldSelect}
                value={String(formData.ativo)}
                onChange={(e) => setFormData((prev) => ({ ...prev, ativo: e.target.value === 'true' }))}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className={`${styles.col12} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Descrição</label>
              <textarea
                className={styles.fieldTextarea}
                placeholder="Descreva os detalhes do procedimento..."
                value={formData.descricao}
                onChange={handleField('descricao')}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteOpen}
        title="Confirmar exclusão"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
        size="sm"
      >
        <p>Deseja realmente excluir este tratamento?</p>
      </Modal>
      <Toast toasts={toasts} />
    </>
  );
};

export default FormTratamento;
