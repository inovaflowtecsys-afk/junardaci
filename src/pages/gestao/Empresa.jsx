import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Save, 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  AlertCircle,
  CheckCircle2,
  Paperclip
} from 'lucide-react';
import styles from './Empresa.module.css';
import Input from '../../components/Input';
import MaskInput from '../../components/MaskInput';
import FormSectionHeader from '../../components/FormSectionHeader';
import ErrorCard from '../../components/ErrorCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useCep } from '../../hooks/useCep';
import { useSaveConfirm } from '../../hooks/useSaveConfirm';
import { supabase } from '../../lib/supabaseClient';
import { fetchRows, insertRow, updateRow, deleteRow } from '../../lib/supabaseCrud';

const emptyForm = {
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  email: '',
  telefone: '',
  celular: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  responsavel_nome: '',
  responsavel_cpf: '',
  responsavel_celular: '',
};

const Empresa = () => {
  const navigate = useNavigate();
  const { handleSave, confirmOpen, handleConfirm, handleStay, toasts } = useSaveConfirm('/gestao');
  
  const [formData, setFormData] = useState(emptyForm);
  const [empresaId, setEmpresaId] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteDocModal, setDeleteDocModal] = useState({ open: false, doc: null });

  const { buscarCep, cepLoading, cepError } = useCep((dados) => {
    setFormData((prev) => ({
      ...prev,
      logradouro: dados.logradouro || prev.logradouro,
      bairro: dados.bairro || prev.bairro,
      cidade: dados.cidade || prev.cidade,
      estado: dados.uf || prev.estado,
    }));
  });

  useEffect(() => {
    loadEmpresaData();
  }, []);

  const loadEmpresaData = async () => {
    setLoading(true);
    setFormError('');
    try {
      // Busca a primeira empresa (geralmente só há uma cadastrada no sistema de clínica)
      const { data, error } = await supabase
        .from('empresa')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEmpresaId(data.id);
        setFormData({
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          cnpj: data.cnpj || '',
          email: data.email || '',
          telefone: data.telefone || '',
          celular: data.celular || '',
          cep: data.cep || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          responsavel_nome: data.responsavel_nome || '',
          responsavel_cpf: data.responsavel_cpf || '',
          responsavel_celular: data.responsavel_celular || '',
        });
        
        loadDocumentos(data.id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da empresa:', err);
      setFormError('Não foi possível carregar os dados da empresa.');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentos = async (id) => {
    try {
      const docs = await fetchRows('empresa_documentos', { 
        filter: { empresa_id: id },
        orderBy: 'created_at',
        ascending: false 
      });
      setDocumentos(docs);
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEmpresa = async () => {
    if (!formData.razao_social.trim()) {
      setFormError('A Razão Social é obrigatória.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        estado: formData.estado.toUpperCase().slice(0, 2),
      };

      let result;
      if (empresaId) {
        result = await updateRow('empresa', 'id', empresaId, payload);
      } else {
        result = await insertRow('empresa', payload);
        setEmpresaId(result.id);
      }

      handleSave();
    } catch (err) {
      console.error('Erro ao salvar empresa:', err);
      setFormError(err.message || 'Erro ao salvar os dados da empresa.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !empresaId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${empresaId}/${fileName}`;

      // 1. Upload do arquivo para o storage (Bucket: documentos)
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message === 'The resource was not found') {
          throw new Error('O bucket "documentos" não foi encontrado no Supabase Storage. Por favor, crie-o como público.');
        }
        throw uploadError;
      }

      // 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      // 3. Salvar metadados na tabela
      await insertRow('empresa_documentos', {
        empresa_id: empresaId,
        nome: file.name,
        url: publicUrl,
        tipo: fileExt,
        tamanho: file.size
      });

      loadDocumentos(empresaId);
    } catch (err) {
      console.error('Erro no upload:', err);
      setFormError(err.message || 'Erro ao anexar documento.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = (doc) => {
    window.open(doc.url, '_blank');
  };

  const handleDeleteDoc = async () => {
    if (!deleteDocModal.doc) return;
    
    try {
      await deleteRow('empresa_documentos', 'id', deleteDocModal.doc.id);
      setDocumentos((prev) => prev.filter(d => d.id !== deleteDocModal.doc.id));
      setDeleteDocModal({ open: false, doc: null });
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      setFormError('Erro ao excluir documento.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p>Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Building2 size={24} className={styles.docIcon} />
          <h1>Configurações da Empresa</h1>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.saveBtn} 
            onClick={handleSaveEmpresa}
            disabled={saving}
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </header>

      <ErrorCard message={formError} onClose={() => setFormError('')} />

      <div className={styles.card}>
        <FormSectionHeader title="DADOS IDENTIFICADORES" />
        <div className={styles.grid}>
          <div className={styles.col6}>
            <Input 
              label="Razão Social *" 
              value={formData.razao_social} 
              onChange={(e) => handleFieldChange('razao_social', e.target.value)} 
              placeholder="Ex: Clínica Junar Darci LTDA"
              required 
            />
          </div>
          <div className={styles.col6}>
            <Input 
              label="Nome Fantasia" 
              value={formData.nome_fantasia} 
              onChange={(e) => handleFieldChange('nome_fantasia', e.target.value)} 
              placeholder="Ex: Junar Darci Estética"
            />
          </div>
          <div className={styles.col4}>
            <MaskInput 
              label="CNPJ" 
              mask="00.000.000/0000-00" 
              value={formData.cnpj} 
              onAccept={(v) => handleFieldChange('cnpj', v)}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className={styles.col4}>
            <Input 
              label="E-mail Corporativo" 
              type="email"
              value={formData.email} 
              onChange={(e) => handleFieldChange('email', e.target.value)} 
              placeholder="contato@empresa.com"
            />
          </div>
          <div className={styles.col2}>
            <MaskInput 
              label="Telefone Fix" 
              mask="(00) 0000-0000" 
              value={formData.telefone} 
              onAccept={(v) => handleFieldChange('telefone', v)}
              placeholder="(00) 0000-0000"
            />
          </div>
          <div className={styles.col2}>
            <MaskInput 
              label="Celular/WhatsApp" 
              mask="(00) 00000-0000" 
              value={formData.celular} 
              onAccept={(v) => handleFieldChange('celular', v)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <FormSectionHeader title="ENDEREÇO DA SEDE" spacing />
        <div className={styles.grid}>
          <div className={styles.col2}>
            <MaskInput 
              label={cepLoading ? 'Buscando...' : 'CEP'} 
              mask="00000-000" 
              value={formData.cep} 
              onAccept={(v) => {
                handleFieldChange('cep', v);
                if (v.replace(/\D/g, '').length === 8) buscarCep(v);
              }}
              placeholder="00000-000"
            />
          </div>
          <div className={styles.col5}>
            <Input 
              label="Logradouro" 
              value={formData.logradouro} 
              onChange={(e) => handleFieldChange('logradouro', e.target.value)} 
              placeholder="Rua, Avenida, etc."
            />
          </div>
          <div className={styles.col2}>
            <Input 
              label="Número" 
              value={formData.numero} 
              onChange={(e) => handleFieldChange('numero', e.target.value)} 
              placeholder="123"
            />
          </div>
          <div className={styles.col3}>
            <Input 
              label="Complemento" 
              value={formData.complemento} 
              onChange={(e) => handleFieldChange('complemento', e.target.value)} 
              placeholder="Bloco, Sala, etc."
            />
          </div>
          <div className={styles.col5}>
            <Input 
              label="Bairro" 
              value={formData.bairro} 
              onChange={(e) => handleFieldChange('bairro', e.target.value)} 
            />
          </div>
          <div className={styles.col5}>
            <Input 
              label="Cidade" 
              value={formData.cidade} 
              onChange={(e) => handleFieldChange('cidade', e.target.value)} 
            />
          </div>
          <div className={styles.col2}>
            <Input 
              label="UF" 
              value={formData.estado} 
              onChange={(e) => handleFieldChange('estado', e.target.value.toUpperCase())} 
              maxLength={2}
              placeholder="SP"
            />
          </div>
        </div>

        <FormSectionHeader title="DADOS DO RESPONSÁVEL" spacing />
        <div className={styles.grid}>
          <div className={styles.col6}>
            <Input 
              label="Nome do Responsável" 
              value={formData.responsavel_nome} 
              onChange={(e) => handleFieldChange('responsavel_nome', e.target.value)} 
              placeholder="Nome completo do responsável legal"
            />
          </div>
          <div className={styles.col3}>
            <MaskInput 
              label="CPF do Responsável" 
              mask="000.000.000-00" 
              value={formData.responsavel_cpf} 
              onAccept={(v) => handleFieldChange('responsavel_cpf', v)}
              placeholder="000.000.000-00"
            />
          </div>
          <div className={styles.col3}>
            <MaskInput 
              label="Celular do Responsável" 
              mask="(00) 00000-0000" 
              value={formData.responsavel_celular} 
              onAccept={(v) => handleFieldChange('responsavel_celular', v)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className={styles.documentSection}>
          <header className={styles.documentHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paperclip size={20} className={styles.docIcon} />
              <h3>Repositório de Documentos</h3>
            </div>
            {empresaId && (
              <label className={styles.uploadBtn}>
                <Upload size={16} />
                {uploading ? 'Enviando...' : 'Anexar Documento'}
                <input 
                  type="file" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </header>

          {!empresaId && (
            <div className={styles.notice}>
              <AlertCircle size={18} />
              <span>Salve os dados da empresa primeiro para habilitar o repositório de documentos.</span>
            </div>
          )}

          <div className={styles.documentList}>
            {documentos.length === 0 && empresaId && (
              <div className={styles.emptyDocs}>
                Nenhum documento anexado ainda.
              </div>
            )}
            
            {documentos.map((doc) => (
              <div key={doc.id} className={styles.documentCard}>
                <div className={styles.docInfo}>
                  <FileText size={24} className={styles.docIcon} />
                  <div className={styles.docText}>
                    <span className={styles.docName} title={doc.nome}>{doc.nome}</span>
                    <span className={styles.docMeta}>
                      {doc.tipo?.toUpperCase()} • {formatFileSize(doc.tamanho)}
                    </span>
                  </div>
                </div>
                <div className={styles.docActions}>
                  <button 
                    className={styles.docActionBtn} 
                    title="Baixar"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    className={`${styles.docActionBtn} ${styles.deleteBtn}`} 
                    title="Excluir"
                    onClick={() => setDeleteDocModal({ open: true, doc })}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={confirmOpen}
        title="Dados salvos!"
        onClose={handleStay}
        onConfirm={handleConfirm}
        confirmText="Ir para Gestão"
        cancelText="Continuar aqui"
        size="sm"
      >
        <p>Os dados da empresa foram atualizados com sucesso.</p>
      </Modal>

      <Modal
        isOpen={deleteDocModal.open}
        title="Excluir documento"
        onClose={() => setDeleteDocModal({ open: false, doc: null })}
        onConfirm={handleDeleteDoc}
        confirmText="Excluir"
        cancelText="Cancelar"
        size="sm"
      >
        <p>Deseja realmente excluir o documento <strong>{deleteDocModal.doc?.nome}</strong>?</p>
      </Modal>

      <Toast toasts={toasts} />
    </div>
  );
};

export default Empresa;
