// Removido: hook fora do componente
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, XCircle, Edit2 } from 'lucide-react';
import styles from '../../styles/forms.module.css';
import Input from '../../components/Input';
import MaskInput from '../../components/MaskInput';
import FormSectionHeader from '../../components/FormSectionHeader';
import ErrorCard from '../../components/ErrorCard';
import { useCep } from '../../hooks/useCep';
import { useSaveConfirm } from '../../hooks/useSaveConfirm';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { deleteRow, fetchRows, insertRow, updateRow } from '../../lib/supabaseCrud';
import { supabase } from '../../lib/supabaseClient';

const emptyForm = {
  nome: '',
  cpf: '',
  data_nascimento: '',
  email: '',
  telefone: '',
  profissao: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  contato_emergencia_nome: '',
  contato_emergencia_telefone: '',
  ativo: true,
};

const FormCliente = () => {
  const [cpfCheckModal, setCpfCheckModal] = useState({ open: false, clienteId: null });
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleSave, confirmOpen, handleConfirm, handleStay, toasts } = useSaveConfirm('/clientes');
  const [savedClientId, setSavedClientId] = useState(id || '');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [attendancesLoading, setAttendancesLoading] = useState(false);
  const [attendancesError, setAttendancesError] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [endereco, setEndereco] = useState({
    logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
  });

  const { buscarCep, cepLoading, cepError } = useCep((dados) => {
    setEndereco((prev) => ({ ...prev, ...dados }));
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

    const loadCliente = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setFormError('');

      try {
        const { data: found, error } = await supabase
          .from('clientes')
          .select('id,nome,cpf,data_nascimento,email,telefone,profissao,cep,logradouro,numero,complemento,bairro,cidade,uf,contato_emergencia_nome,contato_emergencia_telefone,ativo')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (!mounted) return;

        if (!found) {
          throw new Error('Cliente nao encontrado.');
        }

        setFormData({
          nome: found.nome || '',
          cpf: found.cpf || '',
          data_nascimento: found.data_nascimento || '',
          email: found.email || '',
          telefone: found.telefone || '',
          profissao: found.profissao || '',
          cep: (found.cep || '').replace(/[^0-9]/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9),
          logradouro: found.logradouro || '',
          numero: found.numero || '',
          complemento: found.complemento || '',
          bairro: found.bairro || '',
          cidade: found.cidade || '',
          uf: found.uf || '',
          contato_emergencia_nome: found.contato_emergencia_nome || '',
          contato_emergencia_telefone: found.contato_emergencia_telefone || '',
          ativo: found.ativo ?? true,
        });

        setEndereco({
          logradouro: found.logradouro || '',
          numero: found.numero || '',
          complemento: found.complemento || '',
          bairro: found.bairro || '',
          cidade: found.cidade || '',
          uf: found.uf || '',
        });
      } catch (err) {
        if (mounted) {
          setFormError(err?.message || 'Nao foi possivel carregar o cliente.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCliente();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    if (!id) return undefined;

    const loadAttendanceData = async () => {
      setAttendancesLoading(true);
      setAttendancesError('');

      try {
        const [atendimentosData, tratamentosData, profissionaisData] = await Promise.all([
          fetchRows('atendimentos', { orderBy: 'created_at', ascending: false }),
          fetchRows('tratamentos', { orderBy: 'nome' }),
          fetchRows('profissionais', { orderBy: 'nome' }),
        ]);

        if (!mounted) return;

        setAttendances(atendimentosData);
        setTreatments(tratamentosData);
        setProfessionals(profissionaisData);
      } catch (err) {
        if (mounted) setAttendancesError(err?.message || 'Nao foi possivel carregar os atendimentos do cliente.');
      } finally {
        if (mounted) setAttendancesLoading(false);
      }
    };

    loadAttendanceData();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleField = (field) => async (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validação de CPF único ao digitar
    if (field === 'cpf') {
      const cpfValue = value.replace(/\D/g, '');
      if (cpfValue.length === 11) {
        // Busca cliente com o mesmo CPF (exceto o atual)
        const { data: clientes, error } = await supabase
          .from('clientes')
          .select('id, nome')
          .eq('cpf', event.target.value)
          .neq('id', id || null);
        if (!error && clientes && clientes.length > 0) {
          setCpfCheckModal({ open: true, clienteId: clientes[0].id });
        }
      }
    }
  };

  const handleSaveCliente = async () => {
    setSaving(true);
    setFormError('');
    try {
      // Validação obrigatória
      if (!formData.cpf.trim()) throw new Error('Informe o CPF do cliente.');
      if (!formData.nome.trim()) throw new Error('Informe o nome do cliente.');
      if (!formData.cep.trim()) throw new Error('Informe o CEP do cliente.');
      if (!endereco.numero.trim()) throw new Error('Informe o número do endereço.');
      if (!formData.telefone.trim()) throw new Error('Informe o telefone do cliente.');
      if (!formData.data_nascimento) throw new Error('Informe a data de nascimento do cliente.');

      // Validação de CPF único
      const { data: clientesCpf, error: errorCpf } = await supabase
        .from('clientes')
        .select('id')
        .eq('cpf', formData.cpf)
        .neq('id', id || null);
      if (!errorCpf && clientesCpf && clientesCpf.length > 0) {
        setCpfCheckModal({ open: true, clienteId: clientesCpf[0].id });
        throw new Error('Já existe um cliente com este CPF.');
      }

      const payload = {
        nome: formData.nome.trim(),
        cpf: formData.cpf.trim(),
        data_nascimento: formData.data_nascimento || null,
        email: formData.email.trim() || null,
        telefone: formData.telefone.trim() || null,
        profissao: formData.profissao.trim() || null,
        cep: formData.cep.trim() || null,
        logradouro: endereco.logradouro.trim() || null,
        numero: endereco.numero.trim() || null,
        complemento: endereco.complemento.trim() || null,
        bairro: endereco.bairro.trim() || null,
        cidade: endereco.cidade.trim() || null,
        uf: endereco.uf.trim().toUpperCase() || null,
        contato_emergencia_nome: formData.contato_emergencia_nome.trim() || null,
        contato_emergencia_telefone: formData.contato_emergencia_telefone.trim() || null,
        ativo: Boolean(formData.ativo),
      };

      const saved = id
        ? await updateRow('clientes', 'id', id, payload)
        : await insertRow('clientes', payload);

      setSavedClientId(saved?.id || savedClientId);
      handleSave();
    } catch (err) {
      setFormError(err?.message || 'Nao foi possivel salvar o cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleStayEditing = () => {
    handleStay();
    const currentClientId = id || savedClientId;

    if (currentClientId) {
      navigate(`/clientes/${currentClientId}`);
    }
  };

  const handleDeleteCliente = async () => {
    setDeleteOpen(false);

    try {
      if (!id) return;
      await deleteRow('clientes', 'id', id);
      navigate('/clientes');
    } catch (err) {
      setFormError(err?.message || 'Nao foi possivel excluir o cliente.');
    }
  };

  const clientAttendances = useMemo(() => (
    id ? attendances.filter((item) => item.cliente_id === id) : []
  ), [attendances, id]);

  const getTreatmentName = (treatmentId) => treatments.find((item) => item.id === treatmentId)?.nome || '-';
  const getProfessionalName = (professionalId) => professionals.find((item) => item.id === professionalId)?.nome || '-';

  if (loading) {
    return <div style={{ padding: 24 }}>Carregando cliente...</div>;
  }

  return (
    <>
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <button onClick={() => navigate('/clientes')} className={styles.backBtn}>
            <ChevronLeft size={20} />
          </button>
          <h1>{id ? 'Editar Cliente' : 'Novo Cliente'}</h1>
        </div>
        <div className={styles.actions}>
          {id && (
            <button className={styles.cancelBtn} onClick={() => setDeleteOpen(true)}>
              <XCircle size={16} />
              Excluir
            </button>
          )}
          <button className={styles.saveBtn} onClick={handleSaveCliente}>
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </header>

      <ErrorCard message={formError} onClose={() => setFormError('')} />

      <div className={styles.card}>
        <FormSectionHeader title="DADOS CADASTRAIS" />
        <div className={styles.grid}>
          <div className={styles.col3}>
            <MaskInput
              label="CPF *"
              mask="000.000.000-00"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onAccept={(value) => setFormData((prev) => ({ ...prev, cpf: value }))}
              onChange={handleField('cpf')}
              required
            />
          </div>
          <div className={styles.col6}>
            <Input label="Nome Completo *" placeholder="Nome do cliente" value={formData.nome} onChange={handleField('nome')} required />
          </div>
          <div className={styles.col3}>
            <Input label="Nascimento *" type="date" value={formData.data_nascimento} onChange={handleField('data_nascimento')} required />
          </div>
          <div className={styles.col4}>
            <Input label="E-mail" type="email" placeholder="email@exemplo.com" value={formData.email} onChange={handleField('email')} />
          </div>
          <div className={styles.col4}>
            <MaskInput
              label="Telefone *"
              mask="(00) 00000-0000"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onAccept={(value) => setFormData((prev) => ({ ...prev, telefone: value }))}
              onChange={handleField('telefone')}
              required
            />
          </div>
          <div className={styles.col4}>
            <Input label="Profissão" placeholder="Ex: Advogada" value={formData.profissao} onChange={handleField('profissao')} />
          </div>
        </div>

        <FormSectionHeader title="ENDEREÇO" spacing />
        <div className={styles.grid}>
          <div className={styles.col2}>
            <MaskInput
              label={cepLoading ? 'CEP (buscando...) *' : 'CEP *'}
              mask="00000-000"
              placeholder="00000-000"
              error={cepError}
              value={formData.cep}
              onChange={(e) => {
                // Garante apenas números e hífen, e máximo 9 caracteres
                let v = e.target.value.replace(/[^0-9-]/g, '').slice(0, 9);
                setFormData((p) => ({ ...p, cep: v }));
              }}
              onAccept={(value) => {
                // Garante apenas números e hífen, e máximo 9 caracteres
                let v = (value || '').replace(/[^0-9-]/g, '').slice(0, 9);
                buscarCep(v);
              }}
              required
            />
          </div>
          <div className={styles.col5}>
            <Input
              label="Logradouro"
              placeholder="Rua, Avenida..."
              value={endereco.logradouro}
              onChange={(e) => {
                setEndereco((p) => ({ ...p, logradouro: e.target.value }));
                setFormData((p) => ({ ...p, logradouro: e.target.value }));
              }}
            />
          </div>
          <div className={styles.col2}>
            <Input
              label="Número *"
              placeholder="123"
              value={endereco.numero}
              onChange={(e) => {
                setEndereco((p) => ({ ...p, numero: e.target.value }));
                setFormData((p) => ({ ...p, numero: e.target.value }));
              }}
              required
            />
          </div>
          <div className={styles.col3}>
            <Input
              label="Complemento"
              placeholder="Apto, sala..."
              value={endereco.complemento}
              onChange={(e) => {
                setEndereco((p) => ({ ...p, complemento: e.target.value }));
                setFormData((p) => ({ ...p, complemento: e.target.value }));
              }}
            />
          </div>
          <div className={styles.col4}>
            <Input
              label="Bairro"
              placeholder="Centro"
              value={endereco.bairro}
              onChange={(e) => {
                setEndereco((p) => ({ ...p, bairro: e.target.value }));
                setFormData((p) => ({ ...p, bairro: e.target.value }));
              }}
            />
          </div>
          <div className={styles.col6}>
            <Input
              label="Cidade"
              placeholder="Cidade"
              value={endereco.cidade}
              onChange={(e) => {
                setEndereco((p) => ({ ...p, cidade: e.target.value }));
                setFormData((p) => ({ ...p, cidade: e.target.value }));
              }}
            />
          </div>
          <div className={styles.col2}>
            <Input
              label="UF"
              maxLength={2}
              placeholder="SP"
              value={endereco.uf}
              onChange={(e) => {
                setEndereco((p) => ({ ...p, uf: e.target.value }));
                setFormData((p) => ({ ...p, uf: e.target.value }));
              }}
            />
          </div>
        </div>

        <FormSectionHeader title="CONTATO DE EMERGÊNCIA" spacing />
        <div className={styles.grid}>
          <div className={styles.col6}>
            <Input
              label="Nome do Contato"
              placeholder="Nome completo"
              value={formData.contato_emergencia_nome}
              onChange={handleField('contato_emergencia_nome')}
            />
          </div>
          <div className={styles.col4}>
            <MaskInput
              label="Telefone de Emergência"
              mask="(00) 00000-0000"
              placeholder="(00) 00000-0000"
              value={formData.contato_emergencia_telefone}
              onAccept={(value) => setFormData((prev) => ({ ...prev, contato_emergencia_telefone: value }))}
            />
          </div>
        </div>

        {id && (
          <>
            <FormSectionHeader title="ATENDIMENTOS DO CLIENTE" spacing />
            <div className={styles.sectionActionRow}>
              <button
                type="button"
                className={styles.startBtn}
                onClick={() => navigate(`/atendimentos/novo?clienteId=${id}`)}
              >
                Novo Atendimento
              </button>
            </div>
            <div className={styles.tableWrap}>
              {attendancesError && <p className={styles.formError}>{attendancesError}</p>}
              <table className={styles.formTable}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tratamento</th>
                    <th>Profissional</th>
                    <th>Status</th>
                    <th>Valor Final</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {attendancesLoading && (
                    <tr>
                      <td colSpan={6}>Carregando atendimentos...</td>
                    </tr>
                  )}
                  {clientAttendances.length === 0 && (
                    <tr>
                      <td colSpan={6}>Nenhum atendimento encontrado para este cliente.</td>
                    </tr>
                  )}
                  {clientAttendances.map((attendance) => (
                    <tr key={attendance.id}>
                      <td>{new Date(attendance.data_inicio).toLocaleDateString('pt-BR')}</td>
                      <td>{getTreatmentName(attendance.tratamento_id)}</td>
                      <td>{getProfessionalName(attendance.profissional_id)}</td>
                      <td>
                        <span className={`${styles.tableBadge} ${attendance.status === 'FINALIZADO' ? styles.statusDone : attendance.status === 'EM_ANDAMENTO' ? styles.statusProgress : styles.statusBudget}`}>
                          {attendance.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(attendance.valor_final)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.tableActionBtn}
                          onClick={() => navigate(`/atendimentos/${attendance.id}`)}
                          title="Abrir atendimento"
                        >
                          <Edit2 size={15} />
                        </button>
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
      isOpen={confirmOpen}
      title="Salvo com sucesso!"
      onClose={handleStayEditing}
      onConfirm={handleConfirm}
      confirmText="Ir para a lista"
      cancelText="Continuar editando"
      size="sm"
    >
      <p>O cadastro foi salvo. Deseja voltar à lista de clientes?</p>
    </Modal>
    <Modal
      isOpen={deleteOpen}
      title="Confirmar exclusão"
      onClose={() => setDeleteOpen(false)}
      onConfirm={handleDeleteCliente}
      confirmText="Excluir"
      cancelText="Cancelar"
      size="sm"
    >
      <p>Deseja realmente excluir este cliente?</p>
    </Modal>
    <Modal
      isOpen={cpfCheckModal.open}
      title="CPF já cadastrado"
      onClose={() => setCpfCheckModal({ open: false, clienteId: null })}
      onConfirm={() => {
        setCpfCheckModal({ open: false, clienteId: null });
        if (cpfCheckModal.clienteId) {
          navigate(`/clientes/${cpfCheckModal.clienteId}`);
        }
      }}
      confirmText="Abrir cadastro"
      cancelText="Cancelar"
      size="sm"
    >
      <p>Já existe um cliente cadastrado com este CPF. Deseja abrir o cadastro deste cliente?</p>
    </Modal>
    <Toast toasts={toasts} />
    </>
  );
};

export default FormCliente;
