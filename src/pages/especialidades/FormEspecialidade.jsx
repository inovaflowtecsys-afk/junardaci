import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import styles from '../../styles/forms.module.css';
import Input from '../../components/Input';
import FormSectionHeader from '../../components/FormSectionHeader';
import { useSaveConfirm } from '../../hooks/useSaveConfirm';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

const FormEspecialidade = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ativa, setAtiva] = useState(true);
  const { handleSave, confirmOpen, handleConfirm, handleStay, toasts } = useSaveConfirm('/especialidades');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <button onClick={() => navigate('/especialidades')} className={styles.backBtn}>
            <ChevronLeft size={20} />
          </button>
          <h1>{id ? 'Editar Especialidade' : 'Nova Especialidade'}</h1>
        </div>
        <button className={styles.saveBtn} onClick={handleSave}>
          <Save size={16} />
          Salvar Especialidade
        </button>
      </header>

      <div className={styles.card}>
        <FormSectionHeader title="DADOS DA ESPECIALIDADE" />
        <div className={styles.grid}>
          <div className={styles.col8}>
            <Input
              label="Nome da Especialidade"
              placeholder="Ex: Estetica Avancada, Dermatologia..."
            />
          </div>
          <div className={`${styles.col12} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Status</label>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={ativa}
                  onChange={(e) => setAtiva(e.target.checked)}
                />
                Especialidade Ativa
              </label>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={confirmOpen}
        title="Salvo com sucesso!"
        onClose={handleStay}
        onConfirm={handleConfirm}
        confirmText="Ir para a lista"
        cancelText="Continuar editando"
        size="sm"
      >
        <p>O cadastro foi salvo. Deseja voltar a lista de especialidades?</p>
      </Modal>
      <Toast toasts={toasts} />
    </div>
  );
};

export default FormEspecialidade;
