import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Clock, Tag, Search } from 'lucide-react';
import styles from './ListaTratamentos.module.css';
import ErrorCard from '../../components/ErrorCard';
import { fetchRows } from '../../lib/supabaseCrud';

const ListaTratamentos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [tratamentos, setTratamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadTratamentos = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchRows('tratamentos', { orderBy: 'nome' });
        if (mounted) setTratamentos(data);
      } catch (err) {
        if (mounted) setError(err?.message || 'Nao foi possivel carregar os tratamentos.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTratamentos();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => tratamentos.filter((item) => {
    const descricao = item.descricao || '';
    return (
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }), [tratamentos, searchTerm]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>Tratamentos</h1>
          <p>Catalogo de procedimentos e precos</p>
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/tratamentos/novo')}>
          <Plus size={20} />
          Novo Tratamento
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ErrorCard message={error} onClose={() => setError('')} />

      {loading ? (
        <div style={{ padding: '16px' }}>Carregando tratamentos...</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((treatment) => (
            <div key={treatment.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.icon}>
                  <Sparkles size={24} />
                </div>
                <span className={styles.status}>{treatment.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>
              
              <div className={styles.cardBody}>
                <h3>{treatment.nome}</h3>
                <p className={styles.price}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(treatment.valor)}
                </p>
                
                <div className={styles.details}>
                  <div className={styles.detailItem}>
                    <Clock size={16} />
                    <span>{treatment.duracao_estimada} min</span>
                  </div>
                  <div className={styles.detailItem}>
                    <Tag size={16} />
                    <span>Até {treatment.perc_max_desconto}% desc.</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.cardFooter}>
                <button className={styles.editBtn} onClick={() => navigate(`/tratamentos/${treatment.id}`)}>
                  Editar Procedimento
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaTratamentos;
