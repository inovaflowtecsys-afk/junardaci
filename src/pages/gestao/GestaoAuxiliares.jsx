import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Settings2, Trash2, PencilLine, RotateCcw } from 'lucide-react';
import styles from './GestaoAuxiliares.module.css';
import Modal from '../../components/Modal';
import { deleteRow, fetchRows, insertRow, updateRow } from '../../lib/supabaseCrud';

const SECTION_OPTIONS = [
  { key: 'setores', label: 'Setores', singularLabel: 'Setor', subtitle: 'Organizacao por areas de atuacao' },
  { key: 'cargos', label: 'Cargos', singularLabel: 'Cargo', subtitle: 'Funcoes dos colaboradores' },
  { key: 'especialidades', label: 'Especialidades', singularLabel: 'Especialidade', subtitle: 'Especialidades clinicas' },
  { key: 'formasPagamento', label: 'Formas de Pagamento', singularLabel: 'Forma de Pagamento', subtitle: 'Metodos aceitos no caixa' },
  { key: 'unidadesMedida', label: 'Unidades de Medida', singularLabel: 'Unidade de Medida', subtitle: 'UN, ML, LT e outras' },
];

const SECTION_CONFIG = {
  setores: {
    table: 'setores',
    displayField: 'nome',
    activeField: 'ativo',
    createPayload: (nome) => ({ nome, ativo: true }),
    updatePayload: (nome) => ({ nome }),
  },
  cargos: {
    table: 'cargos',
    displayField: 'nome',
    activeField: 'ativo',
    createPayload: (nome) => ({ nome, ativo: true }),
    updatePayload: (nome) => ({ nome }),
  },
  especialidades: {
    table: 'especialidades',
    displayField: 'nome',
    activeField: 'ativa',
    createPayload: (nome) => ({ nome, ativa: true }),
    updatePayload: (nome) => ({ nome }),
  },
  formasPagamento: {
    table: 'formas_pagamento',
    displayField: 'nome',
    activeField: 'ativo',
    createPayload: (nome) => ({
      nome,
      codigo: nome
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, ''),
      ativo: true,
    }),
    updatePayload: (nome) => ({
      nome,
      codigo: nome
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, ''),
    }),
  },
  unidadesMedida: {
    table: 'unidades_medida',
    displayField: 'nome',
    activeField: 'ativo',
    createPayload: (nome) => ({ nome, ativo: true }),
    updatePayload: (nome) => ({ nome }),
  },
};

const initialEditState = { section: '', itemId: '', value: '' };

const GestaoAuxiliares = () => {
  const [activeSection, setActiveSection] = useState('setores');
  const [setoresList, setSetoresList] = useState([]);
  const [cargosList, setCargosList] = useState([]);
  const [especialidadesList, setEspecialidadesList] = useState([]);
  const [formasPagamentoList, setFormasPagamentoList] = useState([]);
  const [unidadesMedidaList, setUnidadesMedidaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [novoSetor, setNovoSetor] = useState('');
  const [novoCargo, setNovoCargo] = useState('');
  const [novaEspecialidade, setNovaEspecialidade] = useState('');
  const [novaFormaPagamento, setNovaFormaPagamento] = useState('');
  const [novaUnidadeMedida, setNovaUnidadeMedida] = useState('');
  const [editing, setEditing] = useState(initialEditState);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    section: '',
    itemId: '',
    itemNome: '',
  });

  const loadAll = async () => {
    setLoading(true);
    setError('');

    try {
      const [setoresData, cargosData, especialidadesData, formasPagamentoData, unidadesMedidaData] = await Promise.all([
        fetchRows('setores', { orderBy: 'nome' }),
        fetchRows('cargos', { orderBy: 'nome' }),
        fetchRows('especialidades', { orderBy: 'nome' }),
        fetchRows('formas_pagamento', { orderBy: 'nome' }),
        fetchRows('unidades_medida', { orderBy: 'nome' }),
      ]);

      setSetoresList(setoresData);
      setCargosList(cargosData);
      setEspecialidadesList(especialidadesData);
      setFormasPagamentoList(formasPagamentoData);
      setUnidadesMedidaList(unidadesMedidaData);
    } catch (err) {
      setError(err?.message || 'Nao foi possivel carregar as tabelas auxiliares.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const sectionState = useMemo(() => ({
    setores: { list: setoresList, setList: setSetoresList, value: novoSetor, setValue: setNovoSetor },
    cargos: { list: cargosList, setList: setCargosList, value: novoCargo, setValue: setNovoCargo },
    especialidades: { list: especialidadesList, setList: setEspecialidadesList, value: novaEspecialidade, setValue: setNovaEspecialidade },
    formasPagamento: { list: formasPagamentoList, setList: setFormasPagamentoList, value: novaFormaPagamento, setValue: setNovaFormaPagamento },
    unidadesMedida: { list: unidadesMedidaList, setList: setUnidadesMedidaList, value: novaUnidadeMedida, setValue: setNovaUnidadeMedida },
  }), [
    setoresList,
    cargosList,
    especialidadesList,
    formasPagamentoList,
    unidadesMedidaList,
    novoSetor,
    novoCargo,
    novaEspecialidade,
    novaFormaPagamento,
    novaUnidadeMedida,
  ]);

  const sectionMeta = SECTION_OPTIONS.find((item) => item.key === activeSection) || SECTION_OPTIONS[0];
  const activeState = sectionState[activeSection];
  const activeConfig = SECTION_CONFIG[activeSection];

  const slugifyCode = (value) => value
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const resetEditing = () => {
    setEditing(initialEditState);
    activeState.setValue('');
  };

  const syncInput = (value) => {
    activeState.setValue(value);
    setEditing((prev) => ({ ...prev, value }));
  };

  const handleSave = async () => {
    const nome = activeState.value.trim();
    if (!nome || !activeConfig) return;

    setSaving(true);
    setError('');

    try {
      if (editing.section === activeSection && editing.itemId) {
        const updated = await updateRow(activeConfig.table, 'id', editing.itemId, activeConfig.updatePayload(nome));
        activeState.setList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
      } else {
        const created = await insertRow(activeConfig.table, activeConfig.createPayload(nome));
        activeState.setList((prev) => [...prev, created].sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
      }

      resetEditing();
    } catch (err) {
      setError(err?.message || 'Nao foi possivel salvar este registro.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditing({
      section: activeSection,
      itemId: item.id,
      value: item[activeConfig.displayField] || '',
    });
    activeState.setValue(item[activeConfig.displayField] || '');
  };

  const handleDelete = async () => {
    const selectedConfig = SECTION_CONFIG[deleteDialog.section];
    const selectedState = sectionState[deleteDialog.section];

    if (!selectedConfig || !selectedState) return;

    setSaving(true);
    setError('');

    try {
      await deleteRow(selectedConfig.table, 'id', deleteDialog.itemId);
      selectedState.setList((prev) => prev.filter((item) => item.id !== deleteDialog.itemId));
      setDeleteDialog({ isOpen: false, section: '', itemId: '', itemNome: '' });
    } catch (err) {
      setError(err?.message || 'Nao foi possivel excluir este registro.');
      setDeleteDialog({ isOpen: false, section: '', itemId: '', itemNome: '' });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (item) => {
    setDeleteDialog({
      isOpen: true,
      section: activeSection,
      itemId: item.id,
      itemNome: item[activeConfig.displayField] || '',
    });
  };

  const activeInputPlaceholder = editing.section === activeSection && editing.itemId
    ? `Editar ${sectionMeta.singularLabel}`
    : `Incluir ${sectionMeta.singularLabel}`;

  const currentValue = activeState.value;

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleWrap}>
          <Settings2 size={24} />
          <div>
            <h1>Gestao de Tabelas Auxiliares</h1>
            <p>Selecione abaixo qual lista deseja alterar.</p>
          </div>
        </div>
      </header>

      <div className={styles.switcher}>
        {SECTION_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`${styles.switchBtn} ${activeSection === option.key ? styles.activeSwitchBtn : ''}`}
            onClick={() => {
              setActiveSection(option.key);
              setEditing(initialEditState);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h2>{sectionMeta.label}</h2>
          <p>{sectionMeta.subtitle}</p>
        </header>

        {error && (
          <div className={styles.notice}>
            <span>{error}</span>
            <button type="button" onClick={loadAll}>
              <RotateCcw size={14} />
              Tentar novamente
            </button>
          </div>
        )}

        <div className={styles.addRow}>
          <input
            type="text"
            value={currentValue}
            onChange={(e) => syncInput(e.target.value)}
            placeholder={activeInputPlaceholder}
            disabled={loading || saving}
          />
          <button type="button" onClick={handleSave} disabled={loading || saving}>
            <Plus size={16} />
            {editing.section === activeSection && editing.itemId ? 'Salvar' : 'Incluir'}
          </button>
          {editing.section === activeSection && editing.itemId && (
            <button type="button" className={styles.cancelBtn} onClick={resetEditing} disabled={loading || saving}>
              Cancelar
            </button>
          )}
          <button type="button" className={styles.refreshBtn} onClick={loadAll} disabled={loading || saving}>
            <RotateCcw size={16} />
            Recarregar
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th className={styles.actionCol}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {!loading && activeState.list.length === 0 && (
                <tr>
                  <td colSpan={3}>Nenhum registro encontrado.</td>
                </tr>
              )}
              {activeState.list.map((item) => {
                const isActive = item[activeConfig.activeField] ?? true;

                return (
                  <tr key={item.id}>
                    <td>{item[activeConfig.displayField]}</td>
                    <td>
                      <span className={`${styles.badge} ${isActive ? styles.active : styles.inactive}`}>
                        {isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => handleEdit(item)}
                        disabled={saving}
                      >
                        <PencilLine size={15} />
                        Editar
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => openDeleteDialog(item)}
                        disabled={saving}
                      >
                        <Trash2 size={15} />
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={deleteDialog.isOpen}
        title="Confirmar exclusao"
        onClose={() => setDeleteDialog({ isOpen: false, section: '', itemId: '', itemNome: '' })}
        onConfirm={handleDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
        size="sm"
      >
        <p>Deseja realmente excluir o item "{deleteDialog.itemNome}"?</p>
      </Modal>
    </div>
  );
};

export default GestaoAuxiliares;
