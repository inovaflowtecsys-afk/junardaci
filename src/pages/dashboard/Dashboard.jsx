import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, ClipboardList, UserRound } from 'lucide-react';
import styles from './Dashboard.module.css';
import { fetchRows } from '../../lib/supabaseCrud';
import { useAuth } from '../../contexts/AuthContext';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const getDateValue = (item) => item.data_inicio || item.created_at || item.updated_at || null;

const getStatusLabel = (status) => {
  if (status === 'EM_ANDAMENTO') return 'Em andamento';
  if (status === 'FINALIZADO') return 'Finalizado';
  if (status === 'CANCELADO') return 'Cancelado';
  return 'Orçamento';
};

const getStatusClass = (status) => {
  if (status === 'EM_ANDAMENTO') return 'em_andamento';
  if (status === 'FINALIZADO') return 'finalizado';
  if (status === 'CANCELADO') return 'cancelado';
  return 'orcamento';
};

const STATUS_CONFIG = [
  { key: 'EM_ANDAMENTO', label: 'Em andamento', color: '#1c6f8d' },
  { key: 'FINALIZADO', label: 'Finalizado', color: '#2e7d32' },
  { key: 'ORCAMENTO', label: 'Orçamento', color: '#f57f17' },
  { key: 'CANCELADO', label: 'Cancelado', color: '#c62828' },
];

const formatDateTime = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rulesError, setRulesError] = useState('');
  const [clientes, setClientes] = useState([]);
  const [tratamentos, setTratamentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [atendimentos, setAtendimentos] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setRulesError('');

      try {
        const atendimentosOptions = { orderBy: 'created_at', ascending: false };
        if (user && !user.isAdmin && user.id) {
          atendimentosOptions.eq = { column: 'profissional_id', value: user.id };
        }

        const [
          clientesData,
          tratamentosData,
          profissionaisData,
          atendimentosData,
        ] = await Promise.all([
          fetchRows('clientes', { orderBy: 'nome' }),
          fetchRows('tratamentos', { orderBy: 'nome' }),
          fetchRows('profissionais', { orderBy: 'nome' }),
          fetchRows('atendimentos', atendimentosOptions),
        ]);

        if (!mounted) return;

        setClientes(clientesData || []);
        setTratamentos(tratamentosData || []);
        setProfissionais(profissionaisData || []);
        setAtendimentos(atendimentosData || []);
      } catch (err) {
        if (mounted) setRulesError(err?.message || 'Não foi possível carregar os dados do dashboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const yearlyChartData = useMemo(() => {
    const currentCounts = Array.from({ length: 12 }, () => 0);
    const previousCounts = Array.from({ length: 12 }, () => 0);

    atendimentos.forEach((item) => {
      const value = getDateValue(item);
      if (!value) return;

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = date.getMonth();

      if (year === currentYear) currentCounts[month] += 1;
      if (year === previousYear) previousCounts[month] += 1;
    });

    const maxValue = Math.max(...currentCounts, ...previousCounts, 1);

    return MONTHS.map((month, index) => ({
      month,
      currentYearValue: currentCounts[index],
      previousYearValue: previousCounts[index],
      currentYearHeight: `${(currentCounts[index] / maxValue) * 100}%`,
      previousYearHeight: `${(previousCounts[index] / maxValue) * 100}%`,
    }));
  }, [atendimentos, currentYear, previousYear]);

  const topProcedimentosResumo = useMemo(() => {
    const treatmentMap = new Map(tratamentos.map((item) => [item.id, item.nome]));
    const countMap = new Map();

    atendimentos
      .filter((item) => item.status !== 'ORCAMENTO')
      .forEach((item) => {
        if (!item.tratamento_id) return;
        countMap.set(item.tratamento_id, (countMap.get(item.tratamento_id) || 0) + 1);
      });

    const items = Array.from(countMap.entries())
      .map(([tratamentoId, quantidade]) => ({
        tratamentoId,
        nome: treatmentMap.get(tratamentoId) || 'Procedimento nao identificado',
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    const total = items.reduce((acc, item) => acc + item.quantidade, 0);
    const maxQuantidade = Math.max(...items.map((item) => item.quantidade), 1);

    return {
      items: items.map((item) => ({
        ...item,
        percentual: total > 0 ? (item.quantidade * 100) / total : 0,
        barra: `${(item.quantidade / maxQuantidade) * 100}%`,
      })),
      total,
    };
  }, [atendimentos, tratamentos]);

  const ultimosAtendimentos = useMemo(() => {
    const clientMap = new Map(clientes.map((item) => [item.id, item.nome]));
    const tratamentoMap = new Map(tratamentos.map((item) => [item.id, item.nome]));
    const profissionalMap = new Map(profissionais.map((item) => [item.id, item.nome]));

    return [...atendimentos]
      .sort((a, b) => {
        const dateA = new Date(getDateValue(a) || 0).getTime();
        const dateB = new Date(getDateValue(b) || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        cliente: clientMap.get(item.cliente_id) || 'Cliente nao identificado',
        tratamento: tratamentoMap.get(item.tratamento_id) || 'Tratamento nao identificado',
        profissional: profissionalMap.get(item.profissional_id) || 'Profissional nao identificado',
        status: item.status,
        dataHora: formatDateTime(getDateValue(item)),
      }));
  }, [atendimentos, clientes, profissionais, tratamentos]);

  const statusChart = useMemo(() => {
    const total = atendimentos.length;
    const countMap = atendimentos.reduce((acc, item) => {
      const key = item.status || 'ORCAMENTO';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const data = STATUS_CONFIG.map((item) => {
      const count = countMap[item.key] || 0;
      const percent = total > 0 ? (count * 100) / total : 0;
      return {
        ...item,
        count,
        percent,
      };
    });

    let offset = 0;
    const slices = data.map((item) => {
      const start = offset;
      const end = offset + item.percent;
      offset = end;
      return `${item.color} ${start}% ${end}%`;
    });

    return {
      data,
      total,
      gradient: `conic-gradient(${slices.join(', ')})`,
    };
  }, [atendimentos]);

  const stats = [
    {
      title: 'Atendimentos no ano atual',
      value: yearlyChartData.reduce((acc, item) => acc + item.currentYearValue, 0),
      icon: <CalendarCheck2 size={22} />,
      tone: 'primary',
    },
    {
      title: 'Procedimentos mapeados',
      value: topProcedimentosResumo.items.length,
      icon: <ClipboardList size={22} />,
      tone: 'gold',
    },
    {
      title: 'Atendimentos finalizados',
      value: atendimentos.filter((item) => item.status === 'FINALIZADO').length,
      icon: <CalendarCheck2 size={22} />,
      tone: 'secondary',
    },
    {
      title: 'Últimos atendimentos carregados',
      value: ultimosAtendimentos.length,
      icon: <UserRound size={22} />,
      tone: 'neutral',
    },
    {
      title: 'Clientes ativos',
      value: clientes.filter((item) => item.ativo).length,
      icon: <UserRound size={22} />,
      tone: 'gold',
    },
    {
      title: 'Atendimentos em andamento',
      value: atendimentos.filter((item) => item.status === 'EM_ANDAMENTO').length,
      icon: <CalendarCheck2 size={22} />,
      tone: 'primary',
    },
  ];

  return (
    <div className={styles.container}>
      {rulesError && <div className={styles.errorCard}>{rulesError}</div>}

      {loading ? (
        <div className={styles.loadingCard}>Carregando dashboard...</div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            {stats.map((stat) => (
              <div key={stat.title} className={`${styles.statCard} ${styles[stat.tone]}`}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={styles.statInfo}>
                  <h3>{stat.title}</h3>
                  <p>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.dashboardGrid}>
            <section className={`${styles.panel} ${styles.chartPanel}`}>
              <header className={styles.panelHeader}>
                <h2>Atendimentos: {currentYear} x {previousYear}</h2>
                <p>Comparativo mensal de quantidade de atendimentos.</p>
              </header>

              <div className={styles.legend}>
                <span><i className={styles.legendCurrent} /> {currentYear}</span>
                <span><i className={styles.legendPrevious} /> {previousYear}</span>
              </div>

              <div className={styles.barChart}>
                {yearlyChartData.map((item) => (
                  <div key={item.month} className={styles.monthGroup}>
                    <div className={styles.bars}>
                      <div className={styles.barWrap} title={`${currentYear}: ${item.currentYearValue}`}>
                        <div className={styles.barCurrent} style={{ height: item.currentYearHeight }} />
                      </div>
                      <div className={styles.barWrap} title={`${previousYear}: ${item.previousYearValue}`}>
                        <div className={styles.barPrevious} style={{ height: item.previousYearHeight }} />
                      </div>
                    </div>
                    <span>{item.month}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <header className={styles.panelHeader}>
                <h2>Top 10 Procedimentos</h2>
                <p>Ranking dos procedimentos mais realizados.</p>
              </header>

              <div className={styles.topProcedimentosBody}>
                {topProcedimentosResumo.items.length === 0 ? (
                  <p className={styles.emptyState}>Sem atendimentos suficientes para montar o ranking.</p>
                ) : (
                  <>
                  <div className={styles.topHeader}>
                    <span>Procedimento</span>
                    <span>Qtd</span>
                    <span>%</span>
                  </div>

                  <ol className={styles.topList}>
                    {topProcedimentosResumo.items.map((item) => (
                      <li key={item.tratamentoId} className={styles.topItem}>
                        <div className={styles.topMain}>
                          <span className={styles.topName}>{item.nome}</span>
                          <div className={styles.topBarTrack}>
                            <div className={styles.topBarFill} style={{ width: item.barra }} />
                          </div>
                        </div>
                        <span className={styles.topCount}>{item.quantidade}</span>
                        <span className={styles.topPercent}>{item.percentual.toFixed(1)}%</span>
                      </li>
                    ))}
                  </ol>

                  </>
                )}

                <div className={styles.topSummary}>
                  <strong>Total contabilizado:</strong> {topProcedimentosResumo.total}
                </div>
              </div>
            </section>

            <section className={styles.panel}>
              <header className={styles.panelHeader}>
                <h2>Status dos atendimentos</h2>
                <p>Distribuição percentual por status.</p>
              </header>

              <div className={styles.donutLayout}>
                <div className={styles.donutWrap}>
                  <div className={styles.donut} style={{ background: statusChart.gradient }}>
                    <div className={styles.donutInner}>
                      <strong>{statusChart.total}</strong>
                      <span>Total</span>
                    </div>
                  </div>
                </div>

                <ul className={styles.statusLegendList}>
                  {statusChart.data.map((item) => (
                    <li key={item.key} className={styles.statusLegendItem}>
                      <div className={styles.statusLegendInfo}>
                        <i style={{ backgroundColor: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      <div className={styles.statusLegendValue}>
                        <strong>{item.percent.toFixed(1)}%</strong>
                        <small>{item.count}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className={styles.panel}>
              <header className={styles.panelHeader}>
                <h2>Últimos atendimentos</h2>
                <p>Visão rápida dos atendimentos mais recentes.</p>
              </header>

              {ultimosAtendimentos.length === 0 ? (
                <p className={styles.emptyState}>Nenhum atendimento encontrado.</p>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Tratamento</th>
                        <th>Profissional</th>
                        <th>Status</th>
                        <th>Data/Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimosAtendimentos.map((item) => (
                        <tr key={item.id}>
                          <td>{item.cliente}</td>
                          <td>{item.tratamento}</td>
                          <td>{item.profissional}</td>
                          <td>
                            <span className={`${styles.badge} ${styles[getStatusClass(item.status)]}`}>
                              {getStatusLabel(item.status)}
                            </span>
                          </td>
                          <td>{item.dataHora}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
