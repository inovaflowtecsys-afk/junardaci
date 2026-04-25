import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, UserRound, Edit2, Mail, Phone } from 'lucide-react';
import styles from './ListaProfissionais.module.css';
import ErrorCard from '../../components/ErrorCard';
import { fetchRows } from '../../lib/supabaseCrud';

const ListaProfissionais = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdminRole = (role) => ['admin', 'administrador'].includes(String(role || '').toLowerCase());

  useEffect(() => {
    let mounted = true;

    const loadProfissionais = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchRows('profissionais', {
          orderBy: 'nome',
          select: 'id,nome,email,telefone,role,ativo,avatar_url,cargos(nome),especialidades(nome)',
        });
        if (mounted) setProfissionais(data);
      } catch (err) {
        // Log detalhado no console
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar profissionais:', err);
        if (mounted) setError((err && err.message ? err.message : 'Nao foi possivel carregar os profissionais.') + (err && err.code ? ` [${err.code}]` : ''));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfissionais();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => profissionais.filter((p) => {
    const especialidade = p.especialidades?.nome || '';
    const cargo = p.cargos?.nome || '';
    return (
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      especialidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }), [profissionais, searchTerm]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>Profissionais</h1>
          <p>Equipe clínica e administrativa</p>
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/profissionais/novo')}>
          <Plus size={20} />
          Novo Profissional
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou especialidade..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ErrorCard message={error} onClose={() => setError('')} />

      {loading ? (
        <div style={{ padding: '16px' }}>Carregando profissionais...</div>
      ) : (
      <div className={styles.grid}>
        {filtered.map((prof) => (
          <div key={prof.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>
                {prof.avatar_url
                  ? <img src={prof.avatar_url} alt={prof.nome} className={styles.avatarImg} />
                  : prof.nome.charAt(0)}
              </div>
              <div className={`${styles.badge} ${isAdminRole(prof.role) ? styles.badgeAdmin : ''}`}>
                {isAdminRole(prof.role) ? 'Administrador' : 'Profissional'}
              </div>
            </div>

            <div className={styles.cardBody}>
              <h3>{prof.nome}</h3>
              <p className={styles.specialty}>
                {prof.especialidades?.nome || prof.cargos?.nome || '-'}
              </p>
              
              <div className={styles.contact}>
                <div className={styles.contactItem}>
                  <Mail size={14} />
                  <span>{prof.email}</span>
                </div>
                <div className={styles.contactItem}>
                  <Phone size={14} />
                  <span>{prof.telefone}</span>
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button className={styles.editBtn} onClick={() => navigate(`/profissionais/${prof.id}`)}>
                <Edit2 size={16} />
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default ListaProfissionais;
