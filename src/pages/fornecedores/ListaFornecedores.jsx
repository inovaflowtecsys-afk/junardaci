import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2 } from 'lucide-react';
import styles from './ListaFornecedores.module.css';
import ErrorCard from '../../components/ErrorCard';
import { fetchRows } from '../../lib/supabaseCrud';

const ListaFornecedores = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadFornecedores = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchRows('fornecedores', { orderBy: 'razao_social' });
        if (mounted) setFornecedores(data);
      } catch (err) {
        if (mounted) setError(err?.message || 'Nao foi possivel carregar os fornecedores.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadFornecedores();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => fornecedores.filter((f) => {
    const nomeFantasia = f.nome_fantasia || '';
    return (
      f.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }), [fornecedores, searchTerm]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>Fornecedores</h1>
          <p>Gestão de parceiros e fornecedores</p>
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/fornecedores/novo')}>
          <Plus size={20} />
          Novo Fornecedor
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por razão social ou nome fantasia..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ErrorCard message={error} onClose={() => setError('')} />

      <div className={styles.card}>
        {loading ? (
          <div style={{ padding: '16px' }}>Carregando fornecedores...</div>
        ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fornecedor</th>
              <th>CNPJ/CPF</th>
              <th>Contato</th>
              <th>Localização</th>
              <th>Status</th>
              <th className={styles.actionsHeader}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((forn) => (
              <tr key={forn.id}>
                <td>
                  <div className={styles.supplierInfo}>
                    <div className={styles.avatar}>{forn.razao_social.charAt(0)}</div>
                    <div className={styles.supplierNameWrap}>
                      <span className={styles.razao}>{forn.razao_social}</span>
                      <span className={styles.fantasia}>{forn.nome_fantasia}</span>
                    </div>
                  </div>
                </td>
                <td>{forn.cpf_cnpj}</td>
                <td>
                  <div className={styles.contato}>
                    <span className={styles.nomeCont}>{forn.contato}</span>
                    <span className={styles.telCont}>{forn.telefone}</span>
                  </div>
                </td>
                <td>{forn.cidade}/{forn.uf}</td>
                <td>
                  <span className={`${styles.badge} ${forn.ativo ? styles.active : styles.inactive}`}>
                    {forn.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className={styles.actionsTd}>
                  <div className={styles.actions}>
                    <button className={styles.iconBtn} title="Editar" onClick={() => navigate(`/fornecedores/${forn.id}`)}>
                      <Edit2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default ListaFornecedores;
