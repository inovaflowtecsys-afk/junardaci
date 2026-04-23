import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, XCircle, ArrowUpRight, ArrowDownLeft, Undo2 } from 'lucide-react';
import styles from '../../styles/forms.module.css';
import Input from '../../components/Input';
import FormSectionHeader from '../../components/FormSectionHeader';
import ErrorCard from '../../components/ErrorCard';
import { useSaveConfirm } from '../../hooks/useSaveConfirm';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { deleteRow, fetchRows, insertRow, updateRow } from '../../lib/supabaseCrud';

const MOVEMENT_TYPES = {
  ENTRADA_COMPRA: { tipo: 'ENTRADA', operacao: 'COMPRA', title: 'Entrada por Compra' },
  SAIDA_MANUAL: { tipo: 'SAÍDA', operacao: 'SAÍDA MANUAL', title: 'Saída Manual' },
  ENTRADA_DEVOLUCAO: { tipo: 'ENTRADA', operacao: 'DEVOLUÇÃO', title: 'Entrada por Devolução' },
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseMovementMeta = (observacoes) => {
  const text = String(observacoes || '');
  const notaMatch = text.match(/NF:\s*([^|]+)/i);
  const formaMatch = text.match(/Forma:\s*([^|]+)/i);

  return {
    notaFiscal: notaMatch?.[1]?.trim() || '-',
    formaPagamento: formaMatch?.[1]?.trim() || '-',
  };
};

const calculateStockMetrics = (movements) => {
  let totalQty = 0;
  let totalValue = 0;
  let totalEntries = 0;
  let totalExits = 0;

  movements.forEach((movement) => {
    const qty = Math.max(0, toNumber(movement.quantidade));

    if (movement.tipo === 'ENTRADA') {
      const unitValue = Math.max(0, toNumber(movement.valorUnitario));
      totalEntries += qty;
      totalQty += qty;
      totalValue += qty * unitValue;
      return;
    }

    totalExits += qty;
    const average = totalQty > 0 ? totalValue / totalQty : 0;
    totalQty = Math.max(0, totalQty - qty);
    totalValue = Math.max(0, totalValue - qty * average);
  });

  const averageCost = totalQty > 0 ? totalValue / totalQty : 0;

  return {
    totalEntries,
    totalExits,
    stockBalance: totalQty,
    averageCost,
    totalValue,
  };
};

const FormProduto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleSave, confirmOpen, handleConfirm, handleStay, toasts } = useSaveConfirm('/produtos');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [unidadesMedidaPadrao, setUnidadesMedidaPadrao] = useState([]);
  const [formasPagamentoPadrao, setFormasPagamentoPadrao] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');

  const [produtoData, setProdutoData] = useState({
    nome: '',
    marca: '',
    unidade: '',
    sku: '',
    quantidadeMinima: '',
    quantidadeMaxima: '',
  });

  const [movements, setMovements] = useState([]);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementMode, setMovementMode] = useState('ENTRADA_COMPRA');
  const [movementError, setMovementError] = useState('');
  const [movementForm, setMovementForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    notaFiscal: '',
    valorCompra: '',
    formaPagamento: '',
    fornecedorId: '',
    quantidade: '',
  });

  const currentProduct = useMemo(() => products.find((item) => item.id === id), [id, products]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setFormError('');

      try {
        const [produtosData, unidadesData, formasData, movimentosData, profissionaisData, fornecedoresData] = await Promise.all([
          fetchRows('produtos', { orderBy: 'nome' }),
          fetchRows('unidades_medida', { orderBy: 'nome' }),
          fetchRows('formas_pagamento', { orderBy: 'nome' }),
          fetchRows('estoque_movimentacoes', { orderBy: 'data_movimentacao', ascending: false }),
          fetchRows('profissionais', { orderBy: 'nome' }),
          fetchRows('fornecedores', { orderBy: 'razao_social' }),
        ]);

        if (!mounted) return;

        setProducts(produtosData);
        setUnidadesMedidaPadrao(unidadesData);
        setFormasPagamentoPadrao(formasData);
        setProfessionals(profissionaisData);
        setFornecedores(fornecedoresData);

        const professionalMap = new Map(profissionaisData.map((item) => [item.id, item.nome]));
        const filteredMovements = id
          ? movimentosData
            .filter((item) => item.produto_id === id)
            .map((item) => {
              const meta = parseMovementMeta(item.observacoes);
              return {
                id: item.id,
                data: item.data_movimentacao,
                tipo: item.tipo,
                operacao: item.operacao,
                notaFiscal: meta.notaFiscal,
                formaPagamento: meta.formaPagamento,
                quantidade: item.quantidade,
                valorUnitario: item.valor_unitario,
                responsavel: professionalMap.get(item.profissional_id) || 'Sistema',
              };
            })
          : [];

        setMovements(filteredMovements.reverse());
      } catch (err) {
        if (mounted) setFormError(err?.message || 'Nao foi possivel carregar os dados do produto.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!currentProduct) return;

    setProdutoData({
      nome: currentProduct.nome || '',
      marca: currentProduct.marca || '',
      unidade: currentProduct.unidade?.toUpperCase() || '',
      sku: currentProduct ? `SKU-${currentProduct.id.toUpperCase()}` : '',
      quantidadeMinima: currentProduct.qtd_minima || '',
      quantidadeMaxima: currentProduct.qtd_maxima || '',
    });
  }, [currentProduct]);

  const stockMetrics = useMemo(() => calculateStockMetrics(movements), [movements]);

  const movementMeta = MOVEMENT_TYPES[movementMode];
  const isEntradaCompra = movementMode === 'ENTRADA_COMPRA';
  const isEntradaDevolucao = movementMode === 'ENTRADA_DEVOLUCAO';
  const isSaidaManual = movementMode === 'SAIDA_MANUAL';

  const openMovementDialog = (mode) => {
    setMovementMode(mode);
    setMovementError('');
    setMovementForm({
      data: new Date().toISOString().slice(0, 10),
      notaFiscal: '',
      valorCompra: '',
      formaPagamento: '',
      fornecedorId: '',
      quantidade: '',
    });
    setMovementDialogOpen(true);
  };

  const closeMovementDialog = () => {
    setMovementDialogOpen(false);
    setMovementError('');
  };

  const handleMovementField = (field, value) => {
    setMovementForm((prev) => ({ ...prev, [field]: value }));
    if (movementError) setMovementError('');
  };

  const handleRegisterMovement = async () => {
    const quantidade = toNumber(movementForm.quantidade);
    const devolucaoValue = isEntradaDevolucao ? 0 : toNumber(movementForm.valorCompra);

    if (!id) {
      setMovementError('Salve o produto antes de registrar movimentacoes.');
      return;
    }

    if (quantidade <= 0) {
      setMovementError('Informe uma quantidade válida.');
      return;
    }

    if (isEntradaCompra && !movementForm.formaPagamento) {
      setMovementError('Selecione a forma de pagamento.');
      return;
    }

    if (isEntradaCompra && !movementForm.fornecedorId) {
      setMovementError('Selecione o fornecedor.');
      return;
    }

    if (isEntradaCompra && !movementForm.notaFiscal.trim()) {
      setMovementError('Informe a nota fiscal.');
      return;
    }

    if (isEntradaCompra && toNumber(movementForm.valorCompra) <= 0) {
      setMovementError('Informe o valor da compra.');
      return;
    }

    if (isSaidaManual && quantidade > stockMetrics.stockBalance) {
      setMovementError('A quantidade de saída não pode ser maior que o saldo em estoque.');
      return;
    }

    const entryValue = isSaidaManual ? stockMetrics.averageCost : devolucaoValue;
    const paymentName = formasPagamentoPadrao.find((item) => item.id === movementForm.formaPagamento)?.nome || '-';
    const responsavelId = professionals.find((item) => item.auth_user_id === user?.id)?.id || null;

    if (!responsavelId) {
      setMovementError('Nao foi possivel identificar o profissional responsavel logado.');
      return;
    }

    try {
      const observacoes = isEntradaCompra
        ? `NF: ${movementForm.notaFiscal} | Forma: ${paymentName}`
        : `${movementMeta.operacao} registrada pelo formulario de produto`;

      const inserted = await insertRow('estoque_movimentacoes', {
        produto_id: id,
        tipo: movementMeta.tipo === 'SAÍDA' ? 'SAIDA' : movementMeta.tipo,
        operacao: movementMeta.operacao === 'SAÍDA MANUAL' ? 'SAIDA_MANUAL' : movementMeta.operacao === 'DEVOLUÇÃO' ? 'DEVOLUCAO' : movementMeta.operacao,
        quantidade,
        valor_unitario: entryValue,
        fornecedor_id: isEntradaCompra ? (movementForm.fornecedorId || null) : null,
        profissional_id: responsavelId,
        observacoes,
      });

      setMovements((prev) => ([
        ...prev,
        {
          id: inserted.id,
          data: inserted.data_movimentacao,
          tipo: inserted.tipo,
          operacao: inserted.operacao,
          notaFiscal: isEntradaCompra ? movementForm.notaFiscal || '-' : '-',
          formaPagamento: isEntradaCompra ? paymentName : '-',
          quantidade: inserted.quantidade,
          valorUnitario: inserted.valor_unitario,
          responsavel: user?.nome || 'Usuário logado',
        },
      ]));
      closeMovementDialog();
    } catch (err) {
      setMovementError(err?.message || 'Nao foi possivel registrar a movimentacao.');
    }
  };

  const handleSaveProduto = async () => {
    if (!produtoData.nome.trim() || !produtoData.unidade) {
      setFormError('Informe nome e unidade do produto.');
      return;
    }

    try {
      setFormError('');
      const payload = {
        nome: produtoData.nome,
        marca: produtoData.marca || null,
        unidade: produtoData.unidade,
        qtd_minima: toNumber(produtoData.quantidadeMinima),
        qtd_maxima: produtoData.quantidadeMaxima === '' ? null : toNumber(produtoData.quantidadeMaxima),
      };

      if (id) {
        await updateRow('produtos', 'id', id, payload);
      } else {
        await insertRow('produtos', payload);
      }

      handleSave();
    } catch (err) {
      setFormError(err?.message || 'Nao foi possivel salvar o produto.');
    }
  };

  const handleDeleteProduto = () => {
    if (!id) {
      setDeleteOpen(false);
      navigate('/produtos');
      return;
    }

    deleteRow('produtos', 'id', id)
      .then(() => {
        setDeleteOpen(false);
        navigate('/produtos');
      })
      .catch((err) => {
        setDeleteOpen(false);
        setFormError(err?.message || 'Nao foi possivel excluir o produto.');
      });
  };

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <button onClick={() => navigate('/produtos')} className={styles.backBtn}>
              <ChevronLeft size={20} />
            </button>
            <h1>{id ? 'Editar Produto' : 'Novo Produto'}</h1>
          </div>
          <div className={styles.actions}>
            {id && (
              <button className={styles.cancelBtn} onClick={() => setDeleteOpen(true)}>
                <XCircle size={16} />
                Excluir
              </button>
            )}
            <button className={styles.saveBtn} onClick={handleSaveProduto}>
              <Save size={16} />
              Salvar Produto
            </button>
          </div>
        </header>

        <div className={styles.card}>
          <ErrorCard message={formError} onClose={() => setFormError('')} />
          {loading && <div style={{ paddingBottom: '16px' }}>Carregando dados do produto...</div>}
          <FormSectionHeader title="DADOS DO PRODUTO" />
          <div className={styles.grid}>
            <div className={styles.col7}>
              <Input
                label="Nome do Produto"
                placeholder="Ex: Toxina Botulínica"
                value={produtoData.nome}
                onChange={(e) => setProdutoData((prev) => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className={styles.col5}>
              <Input
                label="Marca / Fabricante"
                placeholder="Ex: Allergan"
                value={produtoData.marca}
                onChange={(e) => setProdutoData((prev) => ({ ...prev, marca: e.target.value }))}
              />
            </div>

            <div className={`${styles.col4} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Unidade de Medida</label>
              <select
                className={styles.fieldSelect}
                value={produtoData.unidade}
                onChange={(e) => setProdutoData((prev) => ({ ...prev, unidade: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {unidadesMedidaPadrao.map((item) => (
                  <option key={item.id} value={item.nome}>{item.nome}</option>
                ))}
              </select>
            </div>
            <div className={styles.col4}>
              <Input
                label="SKU"
                placeholder="Ex: TOX-100-ALL"
                value={produtoData.sku}
                onChange={(e) => setProdutoData((prev) => ({ ...prev, sku: e.target.value }))}
              />
            </div>
            <div className={styles.col2}>
              <Input
                label="Qtd. Mínima"
                type="number"
                placeholder="0"
                value={produtoData.quantidadeMinima}
                onChange={(e) => setProdutoData((prev) => ({ ...prev, quantidadeMinima: e.target.value }))}
              />
            </div>
            <div className={styles.col2}>
              <Input
                label="Qtd. Máxima"
                type="number"
                placeholder="0"
                value={produtoData.quantidadeMaxima}
                onChange={(e) => setProdutoData((prev) => ({ ...prev, quantidadeMaxima: e.target.value }))}
              />
            </div>
          </div>

          <FormSectionHeader title="RESUMO DE ESTOQUE" spacing />
          <div className={styles.stockSummaryGrid}>
            <div className={styles.stockSummaryCard}>
              <span className={styles.stockSummaryLabel}>Total de Entradas</span>
              <strong className={styles.stockSummaryValue}>
                {stockMetrics.totalEntries.toLocaleString('pt-BR')} {produtoData.unidade || 'UN'}
              </strong>
            </div>
            <div className={styles.stockSummaryCard}>
              <span className={styles.stockSummaryLabel}>Total de Saídas</span>
              <strong className={styles.stockSummaryValue}>
                {stockMetrics.totalExits.toLocaleString('pt-BR')} {produtoData.unidade || 'UN'}
              </strong>
            </div>
            <div className={styles.stockSummaryCard}>
              <span className={styles.stockSummaryLabel}>Saldo em Estoque</span>
              <strong className={styles.stockSummaryValue}>
                {stockMetrics.stockBalance.toLocaleString('pt-BR')} {produtoData.unidade || 'UN'}
              </strong>
            </div>
            <div className={styles.stockSummaryCard}>
              <span className={styles.stockSummaryLabel}>Valor Médio do Produto</span>
              <strong className={styles.stockSummaryValue}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(stockMetrics.averageCost || 0)}
              </strong>
            </div>
          </div>

          <FormSectionHeader title="MOVIMENTAÇÕES DE ESTOQUE" spacing />
          <div className={styles.movementActions}>
            <button className={styles.startBtn} onClick={() => openMovementDialog('ENTRADA_COMPRA')}>
              <ArrowUpRight size={16} />
              Entrada (Compra)
            </button>
            <button className={styles.cancelBtn} onClick={() => openMovementDialog('SAIDA_MANUAL')}>
              <ArrowDownLeft size={16} />
              Saída Manual
            </button>
            <button className={styles.finishBtn} onClick={() => openMovementDialog('ENTRADA_DEVOLUCAO')}>
              <Undo2 size={16} />
              Devolução
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.formTable}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Operação</th>
                  <th>Nota Fiscal</th>
                  <th>Forma de Pagamento</th>
                  <th>Quantidade</th>
                  <th>Valor Unitário</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={8}>Nenhuma movimentação registrada.</td>
                  </tr>
                )}
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{new Date(movement.data).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span className={`${styles.tableBadge} ${movement.tipo === 'ENTRADA' ? styles.entryBadge : styles.exitBadge}`}>
                        {movement.tipo === 'ENTRADA' ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                        {movement.tipo}
                      </span>
                    </td>
                    <td>{movement.operacao}</td>
                    <td>{movement.notaFiscal}</td>
                    <td>{movement.formaPagamento}</td>
                    <td>{movement.quantidade}</td>
                    <td>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(movement.valorUnitario || 0)}
                    </td>
                    <td>{movement.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={confirmOpen}
        title="Salvo com sucesso!"
        onClose={handleStay}
        onConfirm={handleConfirm}
        confirmText="Ir para a lista"
        cancelText="Continuar editando"
        size="sm"
      >
        <p>O cadastro foi salvo. Deseja voltar à lista de produtos?</p>
      </Modal>

      <Modal
        isOpen={deleteOpen}
        title="Confirmar exclusão"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteProduto}
        confirmText="Excluir"
        cancelText="Cancelar"
        size="sm"
      >
        <p>Deseja realmente excluir este produto?</p>
      </Modal>

      <Modal
        isOpen={movementDialogOpen}
        title={movementMeta.title}
        onClose={closeMovementDialog}
        onConfirm={handleRegisterMovement}
        confirmText="Registrar"
        cancelText="Cancelar"
      >
        <div className={styles.movementInfoBox}>
          <p><strong>Produto:</strong> {produtoData.nome || 'Não informado'}</p>
          <p><strong>Marca:</strong> {produtoData.marca || 'Não informada'}</p>
          <p><strong>Tipo:</strong> {movementMeta.tipo}</p>
          <p><strong>Operação:</strong> {movementMeta.operacao}</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.col6}>
            <Input label="Data" type="date" value={movementForm.data} disabled />
          </div>
          <div className={styles.col6}>
            <Input label="Responsável" value={user?.nome || 'Usuário logado'} disabled />
          </div>

          {isEntradaCompra && (
            <>
              <div className={`${styles.col12} ${styles.fieldGroup}`}>
                <label className={styles.fieldLabel}>Fornecedor</label>
                <select
                  className={styles.fieldSelect}
                  value={movementForm.fornecedorId}
                  onChange={(e) => handleMovementField('fornecedorId', e.target.value)}
                >
                  <option value="">Selecione o fornecedor...</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>{f.razao_social}</option>
                  ))}
                </select>
              </div>
              <div className={styles.col6}>
                <Input
                  label="Nota Fiscal"
                  placeholder="NF-e"
                  value={movementForm.notaFiscal}
                  onChange={(e) => handleMovementField('notaFiscal', e.target.value)}
                />
              </div>
              <div className={`${styles.col6} ${styles.fieldGroup}`}>
                <label className={styles.fieldLabel}>Forma de Pagamento</label>
                <select
                  className={styles.fieldSelect}
                  value={movementForm.formaPagamento}
                  onChange={(e) => handleMovementField('formaPagamento', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {formasPagamentoPadrao.map((item) => (
                    <option key={item.id} value={item.id}>{item.nome}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {isEntradaCompra && (
            <div className={styles.col6}>
              <Input
                label="Valor da Compra (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={movementForm.valorCompra}
                onChange={(e) => handleMovementField('valorCompra', e.target.value)}
              />
            </div>
          )}

          <div className={styles.col6}>
            <Input
              label="Quantidade"
              type="number"
              placeholder="0"
              value={movementForm.quantidade}
              onChange={(e) => handleMovementField('quantidade', e.target.value)}
            />
          </div>
        </div>

        {movementError && <p className={styles.formError}>{movementError}</p>}
      </Modal>

      <Toast toasts={toasts} />
    </>
  );
};

export default FormProduto;
