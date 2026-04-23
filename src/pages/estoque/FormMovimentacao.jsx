import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import styles from '../../styles/forms.module.css';
import Input from '../../components/Input';
import FormSectionHeader from '../../components/FormSectionHeader';
import { useSaveConfirm } from '../../hooks/useSaveConfirm';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { fetchRows, insertRow } from '../../lib/supabaseCrud';
import { useAuth } from '../../contexts/AuthContext';

const FormMovimentacao = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tipo, setTipo] = useState('ENTRADA');
  const { handleSave, confirmOpen, handleConfirm, handleStay, toasts } = useSaveConfirm('/estoque');
  const [products, setProducts] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [formData, setFormData] = useState({
    produtoId: '',
    operacao: 'COMPRA',
    quantidade: '',
    valorUnitario: '',
    fornecedorId: '',
    profissionalId: '',
    observacoes: '',
  });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const [produtosData, profissionaisData, fornecedoresData] = await Promise.all([
          fetchRows('produtos', { orderBy: 'nome' }),
          fetchRows('profissionais', { orderBy: 'nome' }),
          fetchRows('fornecedores', { orderBy: 'razao_social' }),
        ]);

        if (!mounted) return;

        setProducts(produtosData);
        setProfessionals(profissionaisData);
        setSuppliers(fornecedoresData);
      } catch (err) {
        if (mounted) setLoadError(err?.message || 'Nao foi possivel carregar os dados da movimentacao.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      operacao: tipo === 'ENTRADA' ? 'COMPRA' : 'SAIDA_MANUAL',
      fornecedorId: tipo === 'ENTRADA' ? prev.fornecedorId : '',
    }));
  }, [tipo]);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSaveMovimentacao = async () => {
    const quantidade = Number(formData.quantidade || 0);
    const valorUnitario = Number(formData.valorUnitario || 0);
    const profissionalId = formData.profissionalId || professionals.find((item) => item.auth_user_id === user?.id)?.id || null;

    if (!formData.produtoId || quantidade <= 0) {
      setSaveError('Informe produto e quantidade valida.');
      return;
    }

    if (tipo === 'ENTRADA' && !formData.fornecedorId) {
      setSaveError('Fornecedor e obrigatorio para compra.');
      return;
    }

    if (tipo === 'SAIDA' && !profissionalId) {
      setSaveError('Responsavel e obrigatorio para saida.');
      return;
    }

    try {
      setSaveError('');
      await insertRow('estoque_movimentacoes', {
        produto_id: formData.produtoId,
        tipo,
        operacao: formData.operacao,
        quantidade,
        valor_unitario: tipo === 'ENTRADA' ? valorUnitario : 0,
        fornecedor_id: tipo === 'ENTRADA' ? formData.fornecedorId || null : null,
        profissional_id: profissionalId,
        observacoes: formData.observacoes || null,
      });
      handleSave();
    } catch (err) {
      setSaveError(err?.message || 'Nao foi possivel registrar a movimentacao.');
    }
  };

  return (
    <>
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <button onClick={() => navigate('/estoque')} className={styles.backBtn}>
            <ChevronLeft size={24} />
          </button>
          <h1>Nova Movimentação</h1>
        </div>

        <button className={styles.saveBtn} onClick={handleSaveMovimentacao}>
          <Save size={18} />
          Registrar Movimento
        </button>
      </header>

      <div className={styles.card}>
          {loadError && <p className={styles.formError}>{loadError}</p>}
          {saveError && <p className={styles.formError}>{saveError}</p>}
          <div className={styles.tipoSwitch}>
            <button
              className={`${styles.switchBtn} ${tipo === 'ENTRADA' ? styles.activeEntry : ''}`}
              onClick={() => setTipo('ENTRADA')}
            >
              <ArrowUpRight size={16} />
              Entrada
            </button>
            <button
              className={`${styles.switchBtn} ${tipo === 'SAIDA' ? styles.activeExit : ''}`}
              onClick={() => setTipo('SAIDA')}
            >
              <ArrowDownLeft size={16} />
              Saída
            </button>
          </div>

          <FormSectionHeader title="DADOS DA MOVIMENTAÇÃO" />
          {loading ? <div style={{ padding: '8px 0 16px' }}>Carregando dados...</div> : null}
          <div className={styles.grid}>
            <div className={`${styles.col4} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Produto</label>
              <select className={styles.fieldSelect} value={formData.produtoId} onChange={handleChange('produtoId')}>
                <option value="">Selecione um produto...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className={`${styles.col4} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Operação</label>
              <select className={styles.fieldSelect} value={formData.operacao} onChange={handleChange('operacao')}>
                {tipo === 'ENTRADA' ? (
                  <option value="COMPRA">Compra</option>
                ) : (
                  <>
                    <option value="SAIDA_MANUAL">Saída Manual</option>
                    <option value="AJUSTE">Ajuste de Inventário</option>
                  </>
                )}
              </select>
            </div>
            <div className={styles.col4}>
              <Input label="Quantidade" type="number" placeholder="0" value={formData.quantidade} onChange={handleChange('quantidade')} />
            </div>

            {tipo === 'ENTRADA' && (
              <>
                <div className={styles.col4}>
                  <Input label="Valor Unitário (R$)" type="number" step="0.01" placeholder="0,00" value={formData.valorUnitario} onChange={handleChange('valorUnitario')} />
                </div>
                <div className={`${styles.col8} ${styles.fieldGroup}`}>
                  <label className={styles.fieldLabel}>Fornecedor</label>
                  <select className={styles.fieldSelect} value={formData.fornecedorId} onChange={handleChange('fornecedorId')}>
                    <option value="">Selecione o fornecedor...</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.razao_social}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className={`${styles.col4} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Responsável</label>
              <select className={styles.fieldSelect} value={formData.profissionalId} onChange={handleChange('profissionalId')}>
                <option value="">Selecione o profissional...</option>
                {professionals.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className={`${styles.col8} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Observações</label>
              <textarea className={styles.fieldTextarea} placeholder="Motivo da movimentação..." value={formData.observacoes} onChange={handleChange('observacoes')} />
            </div>
          </div>
      </div>
    </div>

    <Modal
      isOpen={confirmOpen}
      title="Salvo com sucesso!"
      onClose={handleStay}
      onConfirm={handleConfirm}
      confirmText="Ir para o estoque"
      cancelText="Continuar editando"
      size="sm"
    >
      <p>A movimentação foi registrada com sucesso. Deseja voltar ao estoque?</p>
    </Modal>
    <Toast toasts={toasts} />
    </>
  );
};

export default FormMovimentacao;
