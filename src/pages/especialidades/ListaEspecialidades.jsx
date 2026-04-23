import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import styles from './ListaEspecialidades.module.css';
import ErrorCard from '../../components/ErrorCard';
import { deleteRow, fetchRows } from '../../lib/supabaseCrud';

const ListaEspecialidades = () => {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadEspecialidades = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchRows('especialidades', { orderBy: 'nome' });
        if (mounted) setLista(data);
      } catch (err) {
        if (mounted) setError(err?.message || 'Nao foi possivel carregar as especialidades.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEspecialidades();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteRow('especialidades', 'id', id);
      setLista((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err?.message || 'Nao foi possivel excluir a especialidade.');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>Especialidades</h1>
          <p>Gerencie as especialidades disponíveis para profissionais</p>
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/especialidades/novo')}>
          <Plus size={20} />
          Nova Especialidade
        </button>
      </header>

      <div className={styles.tableCard}>
        <ErrorCard message={error} onClose={() => setError('')} />
        {loading ? (
          <div style={{ padding: '16px' }}>Carregando especialidades...</div>
        ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Especialidade</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((esp) => (
              <tr key={esp.id}>
                <td>
                  <div className={styles.nameCell}>
                    <div className={styles.iconCircle}>
                      <Stethoscope size={16} />
                    </div>
                    <span>{esp.nome}</span>
                  </div>
                </td>
                <td>
                  <span className={`${styles.badge} ${esp.ativa ? styles.badgeAtivo : styles.badgeInativo}`}>
                    {esp.ativa ? <CheckCircle size={13} /> : <XCircle size={13} />}
                    {esp.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => navigate(`/especialidades/${esp.id}`)}
                    >
                      <Edit2 size={15} />
                      Editar
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(esp.id)}>
                      <Trash2 size={15} />
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

export default ListaEspecialidades;
