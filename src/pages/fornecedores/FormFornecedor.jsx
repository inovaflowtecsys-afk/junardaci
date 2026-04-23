import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, XCircle } from 'lucide-react';
import styles from '../../styles/forms.module.css';
import Input from '../../components/Input';
import MaskInput from '../../components/MaskInput';
import FormSectionHeader from '../../components/FormSectionHeader';
import ErrorCard from '../../components/ErrorCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useCep } from '../../hooks/useCep';
import { supabase } from '../../lib/supabaseClient';

const emptyForm = {
  tipo_pessoa: 'PJ',
  razao_social: '',
  nome_fantasia: '',
  cpf_cnpj: '',
  ie: '',
  contato: '',
  telefone: '',
  email: '',
  site: '',
  ativo: true,
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

const emptyAddress = {
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

const normalizeDigits = (value = '') => value.replace(/\D/g, '');

const FormFornecedor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyForm);
  const [address, setAddress] = useState(emptyAddress);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);

  const addToast = (message, type = 'success') => {
    const toast = {
      id: `${Date.now()}-${Math.random()}`,
      title: type === 'success' ? 'Sucesso' : 'Atenção',
      message,
      type,
    };

    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    }, 3200);
  };

  const { buscarCep, cepLoading, cepError } = useCep((dados) => {
    setAddress((prev) => ({ ...prev, ...dados }));
    setFormData((prev) => ({
      ...prev,
      cep: dados.cep || prev.cep,
      logradouro: dados.logradouro || prev.logradouro,
      bairro: dados.bairro || prev.bairro,
      cidade: dados.cidade || prev.cidade,
      uf: dados.uf || prev.uf,
    }));
  });

  useEffect(() => {
    let mounted = true;

    const loadFornecedor = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [{ data: fornecedor, error: fornecedorError }, { data: purchases, error: purchasesError }] = await Promise.all([
          supabase
            .from('fornecedores')
            .select('id,tipo_pessoa,razao_social,nome_fantasia,cpf_cnpj,ie,contato,telefone,email,site,ativo,cep,logradouro,numero,complemento,bairro,cidade,uf')
            .eq('id', id)
            .single(),
          supabase
            .from('estoque_movimentacoes')
            .select('id,data_movimentacao,quantidade,valor_unitario,produto:produtos(nome,marca)')
            .eq('fornecedor_id', id)
            .eq('tipo', 'ENTRADA')
            .eq('operacao', 'COMPRA')
            .order('data_movimentacao', { ascending: false })
            .limit(5),
        ]);

        if (fornecedorError) throw fornecedorError;
        if (purchasesError) throw purchasesError;
        if (!mounted || !fornecedor) return;

        setFormData({
          tipo_pessoa: fornecedor.tipo_pessoa || 'PJ',
          razao_social: fornecedor.razao_social || '',
          nome_fantasia: fornecedor.nome_fantasia || '',
          cpf_cnpj: fornecedor.cpf_cnpj || '',
          ie: fornecedor.ie || '',
          contato: fornecedor.contato || '',
          telefone: fornecedor.telefone || '',
          email: fornecedor.email || '',
          site: fornecedor.site || '',
          ativo: fornecedor.ativo ?? true,
          cep: fornecedor.cep || '',
          logradouro: fornecedor.logradouro || '',
          numero: fornecedor.numero || '',
          complemento: fornecedor.complemento || '',
          bairro: fornecedor.bairro || '',
          cidade: fornecedor.cidade || '',
          uf: fornecedor.uf || '',
        });

        setAddress({
          logradouro: fornecedor.logradouro || '',
          numero: fornecedor.numero || '',
          complemento: fornecedor.complemento || '',
          bairro: fornecedor.bairro || '',
          cidade: fornecedor.cidade || '',
          uf: fornecedor.uf || '',
        });

        setRecentPurchases(
          (purchases || []).map((purchase) => ({
            id: purchase.id,
            purchase_date: purchase.data_movimentacao,
            quantity: purchase.quantidade,
            unit_price: purchase.valor_unitario,
            product_name: purchase.produto?.nome || 'Produto',
            brand: purchase.produto?.marca || '',
          }))
        );
      } catch (err) {
        if (mounted) {
          setError(err?.message || 'Nao foi possivel carregar o fornecedor.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadFornecedor();

    return () => {
      mounted = false;
    };
  }, [id]);

  const tipoPessoa = formData.tipo_pessoa;

  const normalizeDocument = (value) => normalizeDigits(value || formData.cpf_cnpj || '');

  const findExistingByDocument = async (doc) => {
    if (!doc) return null;

    if (tipoPessoa === 'PJ') {
      const { data: fornecedores, error: fornecedoresError } = await supabase
        .from('fornecedores')
        .select('id,razao_social,cpf_cnpj')
        .neq('id', id || '00000000-0000-0000-0000-000000000000');

      if (fornecedoresError) throw fornecedoresError;

      const fornecedorFound = (fornecedores || []).find((item) => normalizeDocument(item.cpf_cnpj) === doc);
      if (fornecedorFound) {
        return {
          path: `/fornecedores/${fornecedorFound.id}`,
          label: `Fornecedor ${fornecedorFound.razao_social}`,
        };
      }
    } else {
      const [{ data: clientes, error: clientesError }, { data: profissionais, error: profissionaisError }] = await Promise.all([
        supabase.from('clientes').select('id,nome,cpf').neq('id', id || '00000000-0000-0000-0000-000000000000'),
        supabase.from('profissionais').select('id,nome,cpf').neq('id', id || '00000000-0000-0000-0000-000000000000'),
      ]);

      if (clientesError) throw clientesError;
      if (profissionaisError) throw profissionaisError;

      const clientFound = (clientes || []).find((item) => normalizeDocument(item.cpf) === doc);
      if (clientFound) {
        return {
          path: `/clientes/${clientFound.id}`,
          label: `Cliente ${clientFound.nome}`,
        };
      }

      const professionalFound = (profissionais || []).find((item) => normalizeDocument(item.cpf) === doc);
      if (professionalFound) {
        return {
          path: `/profissionais/${professionalFound.id}`,
          label: `Profissional ${professionalFound.nome}`,
        };
      }
    }

    return null;
  };

  const handleField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTipoPessoaChange = (nextTipo) => {
    setFormData((prev) => ({
      ...prev,
      tipo_pessoa: nextTipo,
      cpf_cnpj: '',
      ie: nextTipo === 'PJ' ? prev.ie : '',
    }));
    setDocumentError('');
  };

  const handleDocumentoBlur = async () => {
    const doc = normalizeDigits(formData.cpf_cnpj);
    const expectedLength = tipoPessoa === 'PJ' ? 14 : 11;

    if (!doc) {
      setDocumentError('');
      return;
    }

    if (doc.length !== expectedLength) {
      setDocumentError(tipoPessoa === 'PJ' ? 'CNPJ incompleto.' : 'CPF incompleto.');
      return;
    }

    try {
      const existing = await findExistingByDocument(doc);
      if (!existing) {
        setDocumentError('');
        return;
      }

      setDocumentError(`${tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'} já cadastrado.`);
      const shouldOpen = window.confirm(
        `${tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'} já cadastrado em ${existing.label}. Deseja abrir este registro?`
      );
      if (shouldOpen) {
        navigate(existing.path);
      }
    } catch (err) {
      setDocumentError(err?.message || 'Nao foi possivel validar o documento.');
    }
  };

  const isDocumentValid = useMemo(() => {
    const doc = normalizeDigits(formData.cpf_cnpj);
    if (!doc) return true;
    return tipoPessoa === 'PJ' ? doc.length === 14 : doc.length === 11;
  }, [formData.cpf_cnpj, tipoPessoa]);

  const handleSaveFornecedor = async () => {
    setSaving(true);
    setError('');

    try {
      const doc = normalizeDigits(formData.cpf_cnpj);
      const expectedLength = tipoPessoa === 'PJ' ? 14 : 11;

      if (!formData.razao_social.trim()) {
        throw new Error('Informe a razão social.');
      }

      if (!doc || doc.length !== expectedLength) {
        throw new Error(tipoPessoa === 'PJ' ? 'CNPJ inválido.' : 'CPF inválido.');
      }

      if (documentError) {
        throw new Error('Corrija o documento antes de salvar.');
      }

      const existing = await findExistingByDocument(doc);
      if (existing) {
        throw new Error(`${tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'} já cadastrado.`);
      }

      const payload = {
        tipo_pessoa: tipoPessoa,
        razao_social: formData.razao_social.trim(),
        nome_fantasia: formData.nome_fantasia.trim() || null,
        cpf_cnpj: formData.cpf_cnpj.trim(),
        ie: formData.ie.trim() || null,
        contato: formData.contato.trim() || null,
        telefone: formData.telefone.trim() || null,
        email: formData.email.trim() || null,
        site: formData.site.trim() || null,
        ativo: Boolean(formData.ativo),
        cep: formData.cep.trim() || null,
        logradouro: address.logradouro.trim() || null,
        numero: address.numero.trim() || null,
        complemento: address.complemento.trim() || null,
        bairro: address.bairro.trim() || null,
        cidade: address.cidade.trim() || null,
        uf: address.uf.trim().toUpperCase() || null,
      };

      const query = id
        ? supabase.from('fornecedores').update(payload).eq('id', id)
        : supabase.from('fornecedores').insert(payload);

      const { error: saveError } = await query;
      if (saveError) throw saveError;

      addToast('Fornecedor salvo com sucesso!', 'success');
      navigate('/fornecedores');
    } catch (err) {
      setError(err?.message || 'Nao foi possivel salvar o fornecedor.');
      addToast(err?.message || 'Nao foi possivel salvar o fornecedor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFornecedor = async () => {
    setDeleteOpen(false);
    setSaving(true);

    try {
      const { error: deleteError } = await supabase.from('fornecedores').delete().eq('id', id);
      if (deleteError) throw deleteError;
      navigate('/fornecedores');
    } catch (err) {
      setError(err?.message || 'Nao foi possivel excluir o fornecedor.');
      addToast(err?.message || 'Nao foi possivel excluir o fornecedor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Carregando fornecedor...</div>;
  }

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <button onClick={() => navigate('/fornecedores')} className={styles.backBtn}>
              <ChevronLeft size={20} />
            </button>
            <h1>{id ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h1>
          </div>
          <div className={styles.actions}>
            {id && (
              <button className={styles.cancelBtn} onClick={() => setDeleteOpen(true)} disabled={saving}>
                <XCircle size={16} />
                Excluir
              </button>
            )}
            <button className={styles.saveBtn} onClick={handleSaveFornecedor} disabled={saving || !isDocumentValid}>
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Fornecedor'}
            </button>
          </div>
        </header>

        <ErrorCard message={error} onClose={() => setError('')} />

        <div className={styles.card}>
          <div className={styles.tipoSwitch}>
            <button
              className={`${styles.switchBtn} ${tipoPessoa === 'PF' ? styles.activeSwitch : ''}`}
              onClick={() => handleTipoPessoaChange('PF')}
              type="button"
              disabled={saving}
            >
              Pessoa Física
            </button>
            <button
              className={`${styles.switchBtn} ${tipoPessoa === 'PJ' ? styles.activeSwitch : ''}`}
              onClick={() => handleTipoPessoaChange('PJ')}
              type="button"
              disabled={saving}
            >
              Pessoa Jurídica
            </button>
          </div>

          <FormSectionHeader title="DADOS CADASTRAIS" />
          <div className={styles.grid}>
            <div className={styles.col5}>
              <Input
                label={tipoPessoa === 'PJ' ? 'Razão Social' : 'Nome Completo'}
                placeholder="Nome ou razão social"
                value={formData.razao_social}
                onChange={handleField('razao_social')}
                disabled={saving}
              />
            </div>
            <div className={styles.col4}>
              <Input
                label="Nome Fantasia"
                placeholder="Nome comercial"
                value={formData.nome_fantasia}
                onChange={handleField('nome_fantasia')}
                disabled={saving}
              />
            </div>
            <div className={styles.col3}>
              <MaskInput
                label={tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'}
                mask={tipoPessoa === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                placeholder={tipoPessoa === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                value={formData.cpf_cnpj}
                onAccept={(value) => {
                  setFormData((prev) => ({ ...prev, cpf_cnpj: value }));
                  if (documentError) setDocumentError('');
                }}
                onBlur={handleDocumentoBlur}
                error={documentError}
                disabled={saving}
              />
            </div>
            {tipoPessoa === 'PJ' && (
              <div className={styles.col3}>
                <Input
                  label="Inscrição Estadual"
                  placeholder="IE"
                  value={formData.ie}
                  onChange={handleField('ie')}
                  disabled={saving}
                />
              </div>
            )}
            <div className={styles.col3}>
              <Input
                label="Pessoa de Contato"
                placeholder="Nome do contato"
                value={formData.contato}
                onChange={handleField('contato')}
                disabled={saving}
              />
            </div>
            <div className={styles.col3}>
              <MaskInput
                label="Telefone"
                mask="(00) 00000-0000"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onAccept={(value) => setFormData((prev) => ({ ...prev, telefone: value }))}
                disabled={saving}
              />
            </div>
            <div className={styles.col3}>
              <Input
                label="E-mail"
                type="email"
                placeholder="email@fornecedor.com"
                value={formData.email}
                onChange={handleField('email')}
                disabled={saving}
              />
            </div>
            <div className={styles.col3}>
              <Input
                label="Site"
                placeholder="https://..."
                value={formData.site}
                onChange={handleField('site')}
                disabled={saving}
              />
            </div>
          </div>

          <FormSectionHeader title="ENDEREÇO" spacing />
          <div className={styles.grid}>
            <div className={styles.col2}>
              <MaskInput
                label={cepLoading ? 'CEP (buscando...)' : 'CEP'}
                mask="00000-000"
                placeholder="00000-000"
                error={cepError}
                value={formData.cep}
                onAccept={(value) => {
                  setFormData((prev) => ({ ...prev, cep: value }));
                  buscarCep(value);
                }}
                disabled={saving}
              />
            </div>
            <div className={styles.col5}>
              <Input
                label="Logradouro"
                placeholder="Rua, Avenida..."
                value={address.logradouro}
                onChange={(e) => setAddress((prev) => ({ ...prev, logradouro: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className={styles.col2}>
              <Input
                label="Número"
                placeholder="123"
                value={address.numero}
                onChange={(e) => setAddress((prev) => ({ ...prev, numero: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className={styles.col3}>
              <Input
                label="Complemento"
                placeholder="Apto, sala..."
                value={address.complemento}
                onChange={(e) => setAddress((prev) => ({ ...prev, complemento: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className={styles.col4}>
              <Input
                label="Bairro"
                placeholder="Centro"
                value={address.bairro}
                onChange={(e) => setAddress((prev) => ({ ...prev, bairro: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className={styles.col6}>
              <Input
                label="Cidade"
                placeholder="Cidade"
                value={address.cidade}
                onChange={(e) => setAddress((prev) => ({ ...prev, cidade: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className={styles.col2}>
              <Input
                label="UF"
                maxLength={2}
                placeholder="SP"
                value={address.uf}
                onChange={(e) => setAddress((prev) => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                disabled={saving}
              />
            </div>
            <div className={styles.col3}>
              <label className={styles.fieldLabel}>Status</label>
              <div style={{ marginTop: 8 }}>
                <label className={styles.checkboxLabel} style={{ display: 'inline-flex', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(formData.ativo)}
                    onChange={handleField('ativo')}
                    disabled={saving}
                  />
                  Fornecedor ativo
                </label>
              </div>
            </div>
          </div>

          {id && (
            <>
              <FormSectionHeader title="ÚLTIMAS COMPRAS" spacing />
              <div className={styles.tableWrap}>
                <table className={styles.formTable}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Produto</th>
                      <th>Marca</th>
                      <th>Quantidade</th>
                      <th>Valor Unitário</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPurchases.length === 0 && (
                      <tr>
                        <td colSpan={6}>Nenhuma compra registrada para este fornecedor.</td>
                      </tr>
                    )}
                    {recentPurchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td>{new Date(purchase.purchase_date).toLocaleDateString('pt-BR')}</td>
                        <td>{purchase.product_name}</td>
                        <td>{purchase.brand || '-'}</td>
                        <td>{purchase.quantity}</td>
                        <td>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(purchase.unit_price || 0)}
                        </td>
                        <td>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format((purchase.quantity || 0) * (purchase.unit_price || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={deleteOpen}
        title="Confirmar exclusão"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteFornecedor}
        confirmText="Excluir"
        cancelText="Cancelar"
        size="sm"
      >
        <p>Deseja realmente excluir este fornecedor?</p>
      </Modal>
      <Toast toasts={toasts} />
    </>
  );
};

export default FormFornecedor;
