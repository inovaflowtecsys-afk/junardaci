import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Edit2 } from 'lucide-react';
import styles from './ListaAtendimentos.module.css';
import ErrorCard from '../../components/ErrorCard';
import { fetchRows } from '../../lib/supabaseCrud';

const STATUS_FILTERS = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'ORCAMENTO', label: 'Orcamento' },
  { key: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { key: 'FINALIZADO', label: 'Finalizado' },
  { key: 'CANCELADO', label: 'Cancelado' },
];

const ListaAtendimentos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [atendimentos, setAtendimentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tratamentos, setTratamentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [atendimentosData, clientesData, tratamentosData, profissionaisData] = await Promise.all([
          fetchRows('atendimentos', { orderBy: 'created_at' }),
          fetchRows('clientes', { orderBy: 'nome' }),
          fetchRows('tratamentos', { orderBy: 'nome' }),
          fetchRows('profissionais', { orderBy: 'nome' }),
        ]);

        if (mounted) {
          setAtendimentos(atendimentosData);
          setClientes(clientesData);
          setTratamentos(tratamentosData);
          setProfissionais(profissionaisData);
        }
      } catch (err) {
        if (mounted) setError(err?.message || 'Nao foi possivel carregar os atendimentos.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const clientMap = useMemo(() => new Map(clientes.map((item) => [item.id, item])), [clientes]);
  const treatmentMap = useMemo(() => new Map(tratamentos.map((item) => [item.id, item])), [tratamentos]);
  const professionalMap = useMemo(() => new Map(profissionais.map((item) => [item.id, item])), [profissionais]);

  const filteredAttendances = useMemo(() => atendimentos.filter((item) => {
    const statusMatch = statusFilter === 'TODOS' || item.status === statusFilter;
    const clientName = (clientMap.get(item.cliente_id)?.nome || '').toLowerCase();
    const treatmentName = (treatmentMap.get(item.tratamento_id)?.nome || '').toLowerCase();
    const professionalName = (professionalMap.get(item.profissional_id)?.nome || '').toLowerCase();

    return (
      statusMatch && (
        clientName.includes(searchTerm.toLowerCase()) ||
        treatmentName.includes(searchTerm.toLowerCase()) ||
        professionalName.includes(searchTerm.toLowerCase()) ||
        item.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }), [atendimentos, clientMap, treatmentMap, professionalMap, searchTerm, statusFilter]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>Atendimentos</h1>
          <p>Gestao de orcamentos e procedimentos clinicos</p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente, tratamento, profissional ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.statusFilters}>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`${styles.filterBtn} ${statusFilter === filter.key ? styles.activeFilterBtn : ''}`}
              onClick={() => setStatusFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorCard message={error} onClose={() => setError('')} />

      <div className={styles.card}>
        {loading ? (
          <div style={{ padding: '16px' }}>Carregando atendimentos...</div>
        ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Tratamento</th>
                <th>Profissional</th>
                <th>Status</th>
                <th>Valor Final</th>
                <th className={styles.actionsHeader}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendances.map((at) => (
                <tr key={at.id}>
                  <td>{at.data_inicio ? new Date(at.data_inicio).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>{clientMap.get(at.cliente_id)?.nome || 'Cliente'}</td>
                  <td>{treatmentMap.get(at.tratamento_id)?.nome || 'Tratamento'}</td>
                  <td>{professionalMap.get(at.profissional_id)?.nome || 'Profissional'}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[at.status.toLowerCase()] || ''}`}>
                      {at.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(at.valor_final)}
                  </td>
                  <td className={styles.actionsTd}>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} title="Editar" onClick={() => navigate(`/atendimentos/${at.id}`)}>
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default ListaAtendimentos;
