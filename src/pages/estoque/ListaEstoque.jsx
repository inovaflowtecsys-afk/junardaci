import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpRight, ArrowDownLeft, Filter, History } from 'lucide-react';
import styles from './ListaEstoque.module.css';
import ErrorCard from '../../components/ErrorCard';
import { fetchRows } from '../../lib/supabaseCrud';

const ListaEstoque = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [movs, prods, pros] = await Promise.all([
          fetchRows('estoque_movimentacoes', { orderBy: 'data_movimentacao' }),
          fetchRows('produtos', { orderBy: 'nome' }),
          fetchRows('profissionais', { orderBy: 'nome' }),
        ]);

        if (mounted) {
          setMovimentacoes(movs);
          setProdutos(prods);
          setProfissionais(pros);
        }
      } catch (err) {
        if (mounted) setError(err?.message || 'Nao foi possivel carregar o estoque.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const productMap = useMemo(() => new Map(produtos.map((item) => [item.id, item])), [produtos]);
  const professionalMap = useMemo(() => new Map(profissionais.map((item) => [item.id, item])), [profissionais]);

  const filtered = useMemo(() => movimentacoes.filter((mov) => {
    const produto = productMap.get(mov.produto_id)?.nome || '';
    const profissional = professionalMap.get(mov.profissional_id)?.nome || '';
    return (
      produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profissional.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }), [movimentacoes, productMap, professionalMap, searchTerm]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>Estoque</h1>
          <p>Movimentacoes e historico de insumos</p>
        </div>
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.entryBtn}`} onClick={() => navigate('/estoque/novo')}>
            <ArrowUpRight size={20} />
            Entrada
          </button>
          <button className={`${styles.btn} ${styles.exitBtn}`} onClick={() => navigate('/estoque/novo')}>
            <ArrowDownLeft size={20} />
            Saída
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por produto ou profissional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className={styles.filterBtn}>
          <Filter size={18} />
          Filtrar
        </button>
      </div>

      <ErrorCard message={error} onClose={() => setError('')} />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <History size={20} />
          <h2>Historico Recente</h2>
        </div>
        {loading ? (
          <div style={{ padding: '16px' }}>Carregando movimentacoes...</div>
        ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Operacao</th>
              <th>Qtd.</th>
              <th>Valor Unit.</th>
              <th>Responsavel</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((mov) => {
              const produto = productMap.get(mov.produto_id);
              const profissional = professionalMap.get(mov.profissional_id);

              return (
                <tr key={mov.id}>
                  <td>{new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}</td>
                  <td>{produto?.nome || '-'}</td>
                  <td>
                    <span className={`${styles.badge} ${mov.tipo === 'ENTRADA' ? styles.entry : styles.exit}`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td>{mov.operacao}</td>
                  <td>{mov.quantidade}</td>
                  <td>
                    {mov.valor_unitario 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mov.valor_unitario)
                      : '-'}
                  </td>
                  <td>{profissional?.nome || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default ListaEstoque;
