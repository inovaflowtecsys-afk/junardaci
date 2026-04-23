import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2 } from 'lucide-react';
import styles from './ListaClientes.module.css';
import { fetchRows } from '../../lib/supabaseCrud';

const ListaClientes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadClientes = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchRows('clientes', { orderBy: 'nome' });
        if (mounted) setClientes(data);
      } catch (err) {
        if (mounted) setError(err?.message || 'Nao foi possivel carregar os clientes.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadClientes();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredClients = useMemo(() => clientes.filter((client) =>
    client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm)
  ), [clientes, searchTerm]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>Clientes</h1>
          <p>Gerencie o cadastro de seus pacientes</p>
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/clientes/novo')}>
          <Plus size={20} />
          Novo Cliente
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.card}>
        {error && <div className={styles.error || ''}>{error}</div>}
        {loading ? (
          <div style={{ padding: '16px' }}>Carregando clientes...</div>
        ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Status</th>
              <th className={styles.actionsHeader}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <div className={styles.clientInfo}>
                    <div className={styles.avatar}>
                      {client.nome.charAt(0)}
                    </div>
                    <span>{client.nome}</span>
                  </div>
                </td>
                <td>{client.cpf}</td>
                <td>{client.telefone}</td>
                <td>{client.cidade}/{client.uf}</td>
                <td>
                  <span className={`${styles.badge} ${client.ativo ? styles.active : styles.inactive}`}>
                    {client.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className={styles.actionsTd}>
                  <div className={styles.actions}>
                    <button className={styles.iconBtn} title="Editar" onClick={() => navigate(`/clientes/${client.id}`)}>
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

export default ListaClientes;
