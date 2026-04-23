import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2 } from 'lucide-react';
import styles from './ListaProdutos.module.css';
import ErrorCard from '../../components/ErrorCard';
import { fetchRows } from '../../lib/supabaseCrud';

const ListaProdutos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [productsData, movementsData] = await Promise.all([
          fetchRows('produtos', { orderBy: 'nome' }),
          fetchRows('estoque_movimentacoes', { orderBy: 'data_movimentacao' }),
        ]);

        if (mounted) {
          setProducts(productsData);
          setMovements(movementsData);
        }
      } catch (err) {
        if (mounted) setError(err?.message || 'Nao foi possivel carregar os produtos.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const stockByProduct = useMemo(() => {
    return movements.reduce((acc, movement) => {
      const current = acc[movement.produto_id] || {
        entradas: 0,
        saidas: 0,
        custoTotalEntradas: 0,
        qtdTotalEntradas: 0,
      };

      const quantity = Number(movement.quantidade || 0);
      const value = Number(movement.valor_unitario || 0);

      if (movement.tipo === 'ENTRADA') {
        current.entradas += quantity;
        current.custoTotalEntradas += quantity * value;
        current.qtdTotalEntradas += quantity;
      } else {
        current.saidas += quantity;
      }

      acc[movement.produto_id] = current;
      return acc;
    }, {});
  }, [movements]);

  const filtered = useMemo(() => products.filter((p) => {
    const marca = p.marca || '';
    return (
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      marca.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }), [products, searchTerm]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>Produtos</h1>
          <p>Catalogo de produtos e insumos</p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/produtos/novo')}>
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <ErrorCard message={error} onClose={() => setError('')} />

      <div className={styles.card}>
        {loading ? (
          <div style={{ padding: '16px' }}>Carregando produtos...</div>
        ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Marca</th>
                <th>Entradas</th>
                <th>Saídas</th>
                <th>Saldo</th>
                <th>Mínimo</th>
                <th>Status</th>
                <th>Custo Médio</th>
                <th className={styles.actionsHeader}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prod) => {
                const currentStock = stockByProduct[prod.id] || {
                  entradas: 0,
                  saidas: 0,
                  custoTotalEntradas: 0,
                  qtdTotalEntradas: 0,
                };

                const totalEntries = Number(currentStock.entradas || 0);
                const totalExits = Number(currentStock.saidas || 0);
                const stockBalance = Math.max(0, totalEntries - totalExits);
                const isLowStock = stockBalance <= Number(prod.qtd_minima || 0);
                const avgCost = currentStock.qtdTotalEntradas > 0
                  ? currentStock.custoTotalEntradas / currentStock.qtdTotalEntradas
                  : 0;

                return (
                  <tr key={prod.id}>
                    <td>{prod.nome}</td>
                    <td>{prod.marca}</td>
                    <td>{totalEntries} {prod.unidade}</td>
                    <td>{totalExits} {prod.unidade}</td>
                    <td>{stockBalance} {prod.unidade}</td>
                    <td>{prod.qtd_minima} {prod.unidade}</td>
                    <td>
                      <span className={`${styles.badge} ${isLowStock ? styles.lowStock : styles.normalStock}`}>
                        {prod.ativo ? (isLowStock ? 'Baixo' : 'Normal') : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgCost)}
                    </td>
                    <td className={styles.actions}>
                      <button className={styles.iconBtn} title="Editar" onClick={() => navigate(`/produtos/${prod.id}`)}>
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default ListaProdutos;
