import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, Save, XCircle } from 'lucide-react';
import styles from '../../styles/forms.module.css';
import Input from '../../components/Input';
import MaskInput from '../../components/MaskInput';
import FormSectionHeader from '../../components/FormSectionHeader';
import ErrorCard from '../../components/ErrorCard';
import { useCep } from '../../hooks/useCep';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { supabase } from '../../lib/supabaseClient';
import { fetchRows } from '../../lib/supabaseCrud';
import { createClient } from '@supabase/supabase-js';

const emptyEndereco = {
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

const emptyForm = {
  nome: '',
  cpf: '',
  data_nascimento: '',
  email: '',
  telefone: '',
  cargo_id: '',
  setor_id: '',
  especialidade_id: '',
  role: 'profissional',
  autoriza_cortesia: false,
  ativo: true,
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  avatar_url: '',
};

const FormProfissional = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [cargoNome, setCargoNome] = useState('');
  const [cargos, setCargos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [endereco, setEndereco] = useState(emptyEndereco);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

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
    setEndereco((prev) => ({ ...prev, ...dados }));
  });

  useEffect(() => {
    let mounted = true;

    const loadBaseData = async () => {
      try {
        const [cargosData, setoresData, especialidadesData] = await Promise.all([
          fetchRows('cargos', { orderBy: 'nome' }),
          fetchRows('setores', { orderBy: 'nome' }),
          fetchRows('especialidades', { orderBy: 'nome' }),
        ]);

        // Logs para depuração
        // eslint-disable-next-line no-console
        console.log('CARGOS:', cargosData);
        // eslint-disable-next-line no-console
        console.log('SETORES:', setoresData);
        // eslint-disable-next-line no-console
        console.log('ESPECIALIDADES:', especialidadesData);

        if (!mounted) return;

        setCargos(cargosData);
        setSetores(setoresData);
        setEspecialidades(especialidadesData);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar dados iniciais:', err);
        if (mounted) setError((err && err.message ? err.message : 'Nao foi possivel carregar os dados iniciais.') + (err && err.code ? ` [${err.code}]` : ''));
      }
    };

    loadBaseData();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const loadProfissional = async () => {
      setLoading(true);
      setError('');

      try {
        const { data, error: loadError } = await supabase
          .from('profissionais')
          .select('id,nome,cpf,data_nascimento,email,telefone,cargo_id,setor_id,especialidade_id,role,autoriza_cortesia,ativo,cep,logradouro,numero,complemento,bairro,cidade,uf,avatar_url')
          .eq('id', id)
          .single();

        if (loadError) throw loadError;
        if (!mounted || !data) return;

        setFormData((prev) => ({
          ...prev,
          ...data,
          data_nascimento: data.data_nascimento || '',
        }));

        setEndereco({
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          uf: data.uf || '',
        });

        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url);
        }

        const selectedCargo = cargos.find((cargo) => cargo.id === data.cargo_id);
        setCargoNome(selectedCargo?.nome || '');
      } catch (err) {
        if (mounted) setError(err?.message || 'Nao foi possivel carregar o profissional.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfissional();

    return () => {
      mounted = false;
    };
  }, [id, cargos]);

  const isMedico = useMemo(() => {
    const nome = cargoNome.trim().toLowerCase();
    return nome === 'médico' || nome === 'medico';
  }, [cargoNome]);

  const handleField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCargoChange = (event) => {
    const nextCargoId = event.target.value;
    const nextCargo = cargos.find((cargo) => cargo.id === nextCargoId);
    setCargoNome(nextCargo?.nome || '');
    setFormData((prev) => ({
      ...prev,
      cargo_id: nextCargoId,
      especialidade_id: nextCargo?.nome?.trim().toLowerCase() === 'medico' || nextCargo?.nome?.trim().toLowerCase() === 'médico'
        ? prev.especialidade_id
        : '',
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem válida (jpg, png, webp).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (profissionalId) => {
    if (!avatarFile) return formData.avatar_url || null;
    setUploadingAvatar(true);
    try {
      const ext = avatarFile.name.split('.').pop();
      const path = `${profissionalId}.${ext}`;
      const { error: upError } = await supabase.storage
        .from('profissionais')
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (upError) throw upError;
      const { data: urlData } = supabase.storage.from('profissionais').getPublicUrl(path);
      return urlData.publicUrl;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfissional = async () => {
    setSaving(true);
    setError('');

    try {
      // Validação obrigatória dos campos
      if (!formData.nome.trim()) throw new Error('Nome é obrigatório.');
      if (!formData.cpf) throw new Error('CPF é obrigatório.');
      if (!formData.data_nascimento) throw new Error('Data de nascimento é obrigatória.');
      if (!formData.email) throw new Error('E-mail é obrigatório.');
      if (!formData.cargo_id || formData.cargo_id === "") throw new Error('Cargo é obrigatório.');
      if (!formData.setor_id || formData.setor_id === "") throw new Error('Setor é obrigatório.');
      if (!formData.telefone) throw new Error('Telefone é obrigatório.');
      if (isMedico && (!formData.especialidade_id || formData.especialidade_id === "")) {
        throw new Error('Para cargo Médico, a especialidade é obrigatória.');
      }

      const payload = {
        nome: formData.nome.trim(),
        cpf: formData.cpf || '',
        data_nascimento: formData.data_nascimento || '',
        email: formData.email || '',
        telefone: formData.telefone || '',
        cargo_id: formData.cargo_id || null,
        setor_id: formData.setor_id || null,
        especialidade_id: isMedico ? (formData.especialidade_id || null) : null,
        role: formData.role,
        autoriza_cortesia: Boolean(formData.autoriza_cortesia),
        ativo: Boolean(formData.ativo),
        cep: endereco.cep || formData.cep || '',
        logradouro: endereco.logradouro || formData.logradouro || '',
        numero: endereco.numero || formData.numero || '',
        complemento: endereco.complemento || formData.complemento || '',
        bairro: endereco.bairro || formData.bairro || '',
        cidade: endereco.cidade || formData.cidade || '',
        uf: endereco.uf || formData.uf || '',
      };

      if (id) {
        const avatarUrl = await uploadAvatar(id);
        if (avatarUrl !== undefined) payload.avatar_url = avatarUrl;

        const { error: updateError } = await supabase
          .from('profissionais')
          .update(payload)
          .eq('id', id);

        if (updateError) throw updateError;
      } else {
        // 1. Cria usuário no Supabase Auth usando um cliente secundário para não deslogar o admin
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const supabaseSignUpClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            storageKey: 'sb-temp-auth-token',
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
          }
        });

        const { data: authData, error: authError } = await supabaseSignUpClient.auth.signUp({
          email: formData.email,
          password: '0102ju',
        });
        if (authError || !authData?.user?.id) {
          let msg = 'Erro ao criar usuário no Auth.';
          // Tratamento especial para erro 429 (rate limit)
          if (authError?.status === 429 || (authError?.message && authError.message.includes('rate limit'))) {
            msg = 'Limite de cadastros atingido. Aguarde alguns minutos antes de tentar novamente.';
          } else if (authError?.message) {
            msg += ' ' + authError.message;
          } else if (authError) {
            msg += ' ' + JSON.stringify(authError);
          }
          // Exibe erro detalhado no console
          // eslint-disable-next-line no-console
          console.error('Erro detalhado Supabase Auth:', authError);
          setError(msg);
          addToast(msg, 'error');
          setSaving(false);
          return;
        }
        const userId = authData.user.id;

        // 2. Insere na tabela profissionais, vinculando ao auth_user_id do Auth
        const { data: inserted, error: insertError } = await supabase
          .from('profissionais')
          .insert({ ...payload, auth_user_id: userId })
          .select('id')
          .single();

        if (insertError) throw insertError;

        if (avatarFile && inserted?.id) {
          const avatarUrl = await uploadAvatar(inserted.id);
          if (avatarUrl) {
            await supabase.from('profissionais').update({ avatar_url: avatarUrl }).eq('id', inserted.id);
          }
        }
      }

      addToast('Profissional salvo com sucesso!', 'success');
      navigate('/profissionais');
    } catch (err) {
      setError(err?.message || 'Nao foi possivel salvar o profissional.');
      addToast(err?.message || 'Nao foi possivel salvar o profissional.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfissional = async () => {
    setDeleteOpen(false);
    setSaving(true);

    try {
      const { error: deleteError } = await supabase.from('profissionais').delete().eq('id', id);
      if (deleteError) throw deleteError;
      navigate('/profissionais');
    } catch (err) {
      setError(err?.message || 'Nao foi possivel excluir o profissional.');
      addToast(err?.message || 'Nao foi possivel excluir o profissional.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Carregando profissional...</div>;
  }

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <button onClick={() => navigate('/profissionais')} className={styles.backBtn}>
              <ChevronLeft size={20} />
            </button>
            <h1>{id ? 'Editar Profissional' : 'Novo Profissional'}</h1>
          </div>
          <div className={styles.actions}>
            {id && (
              <button className={styles.cancelBtn} onClick={() => setDeleteOpen(true)} disabled={saving}>
                <XCircle size={16} />
                Excluir
              </button>
            )}
            <button className={styles.saveBtn} onClick={handleSaveProfissional} disabled={saving}>
              <Save size={16} />
              Salvar Profissional
            </button>
          </div>
        </header>

        <ErrorCard message={error} onClose={() => setError('')} />

        <div className={styles.card}>
          <FormSectionHeader title="DADOS CADASTRAIS" />

          {/* Upload de foto */}
          <div className={styles.avatarUploadArea}>
            <button
              type="button"
              className={styles.avatarUploadBtn}
              onClick={() => avatarInputRef.current?.click()}
              title="Clique para alterar a foto"
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className={styles.avatarUploadImg} />
                : <Camera size={32} className={styles.avatarUploadIcon} />}
              <span className={styles.avatarUploadOverlay}>
                <Camera size={20} />
                {avatarPreview ? 'Alterar foto' : 'Adicionar foto'}
              </span>
            </button>
            <div className={styles.avatarUploadInfo}>
              <p className={styles.avatarUploadLabel}>Foto do Profissional</p>
              <p className={styles.avatarUploadHint}>JPG, PNG ou WEBP · Máx. 2MB</p>
              {uploadingAvatar && <p className={styles.avatarUploadHint}>Enviando...</p>}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          <div className={styles.grid}>
            <div className={styles.col3}>
              <MaskInput
                label="CPF"
                mask="000.000.000-00"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onAccept={(value) => setFormData((prev) => ({ ...prev, cpf: value }))}
              />
            </div>
            <div className={styles.col6}>
              <Input
                label="Nome Completo"
                placeholder="Nome do profissional"
                value={formData.nome}
                onChange={handleField('nome')}
              />
            </div>
            <div className={styles.col3}>
              <Input
                label="Nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={handleField('data_nascimento')}
              />
            </div>

            <div className={styles.col4}>
              <Input
                label="E-mail"
                type="email"
                placeholder="email@clinica.com"
                value={formData.email}
                onChange={handleField('email')}
              />
            </div>
            <div className={`${styles.col4} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Cargo</label>
              <select className={styles.fieldSelect} value={formData.cargo_id || ""} onChange={handleCargoChange} required>
                <option value="">Selecione...</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className={`${styles.col4} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Setor</label>
              <select className={styles.fieldSelect} value={formData.setor_id || ""} onChange={handleField('setor_id')} required>
                <option value="">Selecione...</option>
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            <div className={styles.col4}>
              <MaskInput
                label="Telefone"
                mask="(00) 00000-0000"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onAccept={(value) => setFormData((prev) => ({ ...prev, telefone: value }))}
              />
            </div>
            <div className={`${styles.col8} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Especialidade {isMedico ? '*' : '(opcional)'}</label>
              <select
                className={styles.fieldSelect}
                value={formData.especialidade_id || ""}
                onChange={handleField('especialidade_id')}
                disabled={!isMedico}
                required={isMedico}
              >
                <option value="">{isMedico ? 'Selecione a especialidade...' : 'Habilitado apenas para cargo Medico'}</option>
                {especialidades.filter((e) => e.ativa).map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>

            <div className={`${styles.col12} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Perfil e Status</label>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={['admin', 'administrador'].includes(String(formData.role || '').toLowerCase())}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.checked ? 'administrador' : 'profissional' }))}
                  />
                  Administrador
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={handleField('ativo')}
                  />
                  Usuario Ativo
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.autoriza_cortesia}
                    onChange={handleField('autoriza_cortesia')}
                  />
                  Autoriza Cortesia
                </label>
              </div>
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
              />
            </div>
            <div className={styles.col5}>
              <Input
                label="Logradouro"
                placeholder="Rua, Avenida..."
                value={endereco.logradouro}
                onChange={(e) => setEndereco((p) => ({ ...p, logradouro: e.target.value }))}
              />
            </div>
            <div className={styles.col2}>
              <Input
                label="Número"
                placeholder="123"
                value={endereco.numero}
                onChange={(e) => setEndereco((p) => ({ ...p, numero: e.target.value }))}
              />
            </div>
            <div className={styles.col3}>
              <Input
                label="Complemento"
                placeholder="Apto, sala..."
                value={endereco.complemento}
                onChange={(e) => setEndereco((p) => ({ ...p, complemento: e.target.value }))}
              />
            </div>
            <div className={styles.col4}>
              <Input
                label="Bairro"
                placeholder="Centro"
                value={endereco.bairro}
                onChange={(e) => setEndereco((p) => ({ ...p, bairro: e.target.value }))}
              />
            </div>
            <div className={styles.col6}>
              <Input
                label="Cidade"
                placeholder="Cidade"
                value={endereco.cidade}
                onChange={(e) => setEndereco((p) => ({ ...p, cidade: e.target.value }))}
              />
            </div>
            <div className={styles.col2}>
              <Input
                label="UF"
                maxLength={2}
                placeholder="SP"
                value={endereco.uf}
                onChange={(e) => setEndereco((p) => ({ ...p, uf: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteOpen}
        title="Confirmar exclusão"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteProfissional}
        confirmText="Excluir"
        cancelText="Cancelar"
        size="sm"
      >
        <p>Deseja realmente excluir este profissional?</p>
      </Modal>
      <Toast toasts={toasts} />
    </>
  );
};

export default FormProfissional;
