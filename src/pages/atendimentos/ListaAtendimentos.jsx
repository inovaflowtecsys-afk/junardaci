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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const options = {
          orderBy: 'created_at',
          ascending: false,
          limit: 50,
          select: '*, clientes!inner(nome), tratamentos(nome), profissionais(nome)'
        };

        const term = searchTerm.trim();
        if (term) {
          // Quando pesquisar em tabela estrangeira, Supabase JS suporta ilike
          // Porem or() nas tabelas conectadas requer sintaxe especifica, entao
          // se o searchTerm bater, vamos buscar em clientes.nome
          options.ilike = { column: 'clientes.nome', value: `%${term}%` };
        }

        const data = await fetchRows('atendimentos', options);

        if (mounted) {
          setAtendimentos(data);
          // Nao precisamos mais carregar os maps locais gigantes
        }
      } catch (err) {
        if (mounted) setError(err?.message || 'Nao foi possivel carregar os atendimentos.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      loadData();
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(debounceTimer);
    };
  }, [searchTerm]);

  const filteredAttendances = useMemo(() => atendimentos.filter((item) => {
    const statusMatch = statusFilter === 'TODOS' || item.status === statusFilter;
    return statusMatch;
  }), [atendimentos, statusFilter]);

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
                  <td>{at.clientes?.nome || 'Cliente'}</td>
                  <td>{at.tratamentos?.nome || 'Tratamento'}</td>
                  <td>{at.profissionais?.nome || 'Profissional'}</td>
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
