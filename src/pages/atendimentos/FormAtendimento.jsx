import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Save, Play, CheckCircle, XCircle, Gift, TicketPercent, Plus, FileText, CreditCard, Package, Wallet, QrCode, Landmark, Pill, FlaskConical, Trash2 } from 'lucide-react';
import styles from '../../styles/forms.module.css';
import FormSectionHeader from '../../components/FormSectionHeader';
import { useSaveConfirm } from '../../hooks/useSaveConfirm';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { deleteRow, fetchRows, insertRow, updateRow } from '../../lib/supabaseCrud';

const FormAtendimento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const clienteIdFromQuery = searchParams.get('clienteId') || '';
  const atendimentoDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const currentResponsibleName = user?.nome || 'Usuário logado';
  const [clients, setClients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [products, setProducts] = useState([]);
  const [formasPagamentoPadrao, setFormasPagamentoPadrao] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [savedAtendimentoId, setSavedAtendimentoId] = useState(id || '');

  const [status, setStatus] = useState('ORCAMENTO');
  const { handleSave, confirmOpen, handleConfirm, handleStay, toasts, addToast } = useSaveConfirm('/atendimentos');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lineDeleteModal, setLineDeleteModal] = useState({ open: false, type: '', id: '' });
  const [activeTab, setActiveTab] = useState('PRONTUARIO');

  const [formData, setFormData] = useState({
    clienteId: '',
    tratamentoId: '',
    profissionalId: '',
  });
  const [observacoes, setObservacoes] = useState('');

  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountData, setDiscountData] = useState({ motivo: '', responsavel: currentResponsibleName, valor: '' });
  const [discountValue, setDiscountValue] = useState(0);

  const [courtesyModalOpen, setCourtesyModalOpen] = useState(false);
  const [courtesyData, setCourtesyData] = useState({ login: '', senha: '' });
  const [isCourtesy, setIsCourtesy] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelData, setCancelData] = useState({ motivo: '', responsavel: currentResponsibleName });

  const [prontuarioModalOpen, setProntuarioModalOpen] = useState(false);
  const [prontuarioForm, setProntuarioForm] = useState({ tipo: 'RECOMENDACAO', descricao: '', responsavel: currentResponsibleName });
  const [prontuarios, setProntuarios] = useState([]);

  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [pagamentoForm, setPagamentoForm] = useState({ formaPagamentoId: '', valor: '' });
  const [pagamentos, setPagamentos] = useState([]);

  const [produtoModalOpen, setProdutoModalOpen] = useState(false);
  const [produtoForm, setProdutoForm] = useState({ produtoId: '', quantidade: '', responsavel: currentResponsibleName });
  const [produtosLancados, setProdutosLancados] = useState([]);

  const [rulesError, setRulesError] = useState('');
  const currentAtendimentoId = id || savedAtendimentoId;

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoadingData(true);

      try {
        const [clientesData, tratamentosData, profissionaisData, produtosData, formasData, estoqueData, atendimentosData, prontuariosData, pagamentosData, atendimentoProdutosData] = await Promise.all([
          fetchRows('clientes', { orderBy: 'nome' }),
          fetchRows('tratamentos', { orderBy: 'nome' }),
          fetchRows('profissionais', { orderBy: 'nome' }),
          fetchRows('produtos', { orderBy: 'nome' }),
          fetchRows('formas_pagamento', { orderBy: 'nome' }),
          fetchRows('estoque_movimentacoes', { orderBy: 'data_movimentacao' }),
          fetchRows('atendimentos', { orderBy: 'created_at', ascending: false }),
          fetchRows('prontuarios', { orderBy: 'data_registro', ascending: true }),
          fetchRows('pagamentos', { orderBy: 'data_pagamento', ascending: true }),
          fetchRows('atendimento_produtos', { orderBy: 'created_at', ascending: true }),
        ]);

        if (!mounted) return;

        setClients(clientesData);
        setTreatments(tratamentosData);
        setProfessionals(profissionaisData);
        setProducts(produtosData);
        setFormasPagamentoPadrao(formasData);
        setStockMovements(estoqueData);

        const professionalMap = new Map(profissionaisData.map((item) => [item.id, item.nome]));
        const paymentMap = new Map(formasData.map((item) => [item.id, item.nome]));

        if (id) {
          const atendimento = atendimentosData.find((item) => item.id === id);

          if (atendimento) {
            setSavedAtendimentoId(atendimento.id);
            setFormData({
              clienteId: atendimento.cliente_id,
              tratamentoId: atendimento.tratamento_id,
              profissionalId: atendimento.profissional_id,
            });
            setStatus(atendimento.status || 'ORCAMENTO');
            setObservacoes(atendimento.observacoes || '');
            setDiscountValue(Number(atendimento.desconto_valor || 0));
            setIsCourtesy(Number(atendimento.desconto_valor || 0) >= Number(atendimento.valor_tratamento || 0) && Number(atendimento.valor_tratamento || 0) > 0);
            setDiscountData({
              motivo: atendimento.desconto_motivo || '',
              responsavel: atendimento.desconto_responsavel || currentResponsibleName,
              valor: String(atendimento.desconto_valor || ''),
            });
            setCancelData({
              motivo: atendimento.cancelamento_motivo || '',
              responsavel: atendimento.cancelamento_responsavel || currentResponsibleName,
            });
          }

          setProntuarios(prontuariosData.filter((item) => item.atendimento_id === id).map((item) => ({
            id: item.id,
            tipo: item.tipo,
            descricao: item.descricao,
            responsavel: professionalMap.get(item.responsavel_id) || currentResponsibleName,
          })));

          setPagamentos(pagamentosData.filter((item) => item.atendimento_id === id).map((item) => ({
            id: item.id,
            formaPagamento: paymentMap.get(item.forma_pagamento_id) || '-',
            valor: Number(item.valor || 0),
            tipoLancamento: 'RECEITA',
          })));

          setProdutosLancados(atendimentoProdutosData.filter((item) => item.atendimento_id === id).map((item) => ({
            id: item.id,
            produtoId: item.produto_id,
            quantidade: Number(item.quantidade || 0),
            valorMedio: Number(item.valor_unitario || 0),
            clienteId: atendimento?.cliente_id || '',
            atendimentoId: id,
            responsavel: professionalMap.get(item.responsavel_id) || currentResponsibleName,
            movimentacao: 'VENDA',
            estoqueMovimentacaoId: item.estoque_movimentacao_id,
          })));
        } else {
          const defaultClientId = clienteIdFromQuery || clientesData.find((item) => item.ativo)?.id || clientesData[0]?.id || '';
          setFormData((prev) => ({ ...prev, clienteId: prev.clienteId || defaultClientId }));
        }
      } catch (err) {
        if (mounted) setRulesError(err?.message || 'Nao foi possivel carregar os dados do atendimento.');
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [clienteIdFromQuery, currentResponsibleName, id]);

  const selectedTreatment = useMemo(
    () => treatments.find((item) => item.id === formData.tratamentoId),
    [formData.tratamentoId],
  );

  const selectedClient = useMemo(
    () => clients.find((item) => item.id === formData.clienteId),
    [formData.clienteId],
  );

  const currentProfessionalId = useMemo(
    () => professionals.find((item) => item.id === user?.id || item.auth_user_id === user?.id)?.id || '',
    [professionals, user?.id],
  );

  const treatmentValue = selectedTreatment?.valor || 0;
  const maxDiscountPercent = selectedTreatment?.perc_max_desconto || 0;
  const maxDiscountValue = (treatmentValue * maxDiscountPercent) / 100;
  const discountApplied = isCourtesy ? treatmentValue : discountValue;
  const totalValue = Math.max(0, treatmentValue - discountApplied);
  const totalPaid = pagamentos.reduce((acc, item) => acc + item.valor, 0);
  const pendingValue = Math.max(0, totalValue - totalPaid);

  const isLocked = status === 'CANCELADO' || status === 'FINALIZADO';
  const canEditTreatment = status === 'ORCAMENTO' || status === 'EM_ANDAMENTO';

  const getProductAvgValue = (productId) => {
    const entries = stockMovements.filter((item) => item.produto_id === productId && item.tipo === 'ENTRADA');
    const totalQty = entries.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
    const totalValue = entries.reduce((acc, item) => acc + (Number(item.quantidade || 0) * Number(item.valor_unitario || 0)), 0);
    return totalQty > 0 ? totalValue / totalQty : 0;
  };
  const getProductName = (productId) => products.find((item) => item.id === productId)?.nome || '-';
  const getProductBrand = (productId) => products.find((item) => item.id === productId)?.marca || '-';

  const getProductStock = (productId) => stockMovements.reduce((acc, item) => {
    if (item.produto_id !== productId) return acc;
    const quantity = Number(item.quantidade || 0);
    return item.tipo === 'ENTRADA' ? acc + quantity : acc - quantity;
  }, 0);

  const resolveProfessionalId = (responsavelNome) => {
    const exactMatch = professionals.find((item) => item.nome === responsavelNome)?.id;
    return exactMatch || currentProfessionalId;
  };

  const buildAtendimentoPayload = (nextStatus = status) => {
    if (!formData.clienteId || !formData.tratamentoId || !formData.profissionalId) {
      throw new Error('Selecione cliente, tratamento e profissional para salvar o atendimento.');
    }

    return {
      cliente_id: formData.clienteId,
      tratamento_id: formData.tratamentoId,
      profissional_id: formData.profissionalId,
      valor_tratamento: treatmentValue,
      desconto_valor: discountApplied,
      desconto_responsavel: discountApplied > 0 ? (isCourtesy ? currentResponsibleName : discountData.responsavel.trim() || currentResponsibleName) : null,
      desconto_motivo: discountApplied > 0 ? (isCourtesy ? 'Cortesia autorizada' : discountData.motivo.trim() || null) : null,
      status: nextStatus,
      cancelamento_responsavel: nextStatus === 'CANCELADO' ? cancelData.responsavel.trim() || currentResponsibleName : null,
      cancelamento_motivo: nextStatus === 'CANCELADO' ? cancelData.motivo.trim() || null : null,
      observacoes: observacoes.trim() || null,
    };
  };

  const persistAtendimento = async (nextStatus = status) => {
    const payload = buildAtendimentoPayload(nextStatus);

    if (currentAtendimentoId) {
      return updateRow('atendimentos', 'id', currentAtendimentoId, payload);
    }

    const inserted = await insertRow('atendimentos', payload);
    setSavedAtendimentoId(inserted.id);
    return inserted;
  };

  const handleStayAtendimento = () => {
    handleStay();

    if (!id && savedAtendimentoId) {
      navigate(`/atendimentos/${savedAtendimentoId}`, { replace: true });
    }
  };

  const getPaymentIcon = (paymentName) => {
    const normalized = String(paymentName || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.includes('pix')) return <QrCode size={14} />;
    if (normalized.includes('debito')) return <Landmark size={14} />;
    if (normalized.includes('cartao') || normalized.includes('credito')) return <CreditCard size={14} />;
    if (normalized.includes('dinheiro')) return <Wallet size={14} />;
    return <CreditCard size={14} />;
  };

  const getProntuarioIcon = (type) => {
    if (type === 'MEDICAMENTO') return <Pill size={14} />;
    if (type === 'EXAME') return <FlaskConical size={14} />;
    return <FileText size={14} />;
  };

  const applyStatusTransition = (nextStatus) => {
    setRulesError('');
    setStatus(nextStatus);
  };

  const handleStartTreatment = async () => {
    if (!formData.tratamentoId || !formData.profissionalId || !formData.clienteId) {
      setRulesError('Selecione cliente, tratamento e profissional para iniciar o atendimento.');
      return;
    }

    try {
      const atendimento = await persistAtendimento('EM_ANDAMENTO');
      setStatus(atendimento.status || 'EM_ANDAMENTO');
      setRulesError('');

      if (!id && atendimento?.id) {
        navigate(`/atendimentos/${atendimento.id}`, { replace: true });
      }
    } catch (err) {
      setRulesError(err?.message || 'Nao foi possivel iniciar o atendimento.');
    }
  };

  const handleOpenDiscount = () => {
    if (!selectedTreatment) {
      setRulesError('Selecione um tratamento para aplicar desconto.');
      return;
    }

    setDiscountData({ motivo: '', responsavel: currentResponsibleName, valor: '' });
    setRulesError('');
    setDiscountModalOpen(true);
  };

  const handleApplyDiscount = () => {
    const value = Number(discountData.valor || 0);

    if (!discountData.motivo.trim() || !discountData.responsavel.trim()) {
      setRulesError('Informe descricao e responsavel do desconto.');
      return;
    }

    if (value <= 0) {
      setRulesError('Informe um valor de desconto válido.');
      return;
    }

    if (value > maxDiscountValue) {
      setRulesError('Desconto acima do limite permitido pelo tratamento.');
      return;
    }

    setIsCourtesy(false);
    setDiscountValue(value);
    setDiscountModalOpen(false);
    setDiscountData({ motivo: '', responsavel: currentResponsibleName, valor: '' });
    setRulesError('');
  };

  const handleApplyCourtesy = () => {
    if (!courtesyData.login.trim() || !courtesyData.senha.trim()) {
      setRulesError('Informe login e senha para autorizar a cortesia.');
      return;
    }

    // Fluxo mock de autorização: credenciais preenchidas autorizam cortesia.
    setIsCourtesy(true);
    setDiscountValue(0);
    setCourtesyModalOpen(false);
    setCourtesyData({ login: '', senha: '' });
    setRulesError('');
  };

  const handleOpenCancel = () => {
    if (status === 'FINALIZADO') {
      setRulesError('Atendimento finalizado não pode ser cancelado.');
      return;
    }

    setCancelData({ motivo: '', responsavel: currentResponsibleName });
    setRulesError('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelData.motivo.trim() || !cancelData.responsavel.trim()) {
      setRulesError('Motivo e responsável são obrigatórios para cancelar.');
      return;
    }

    if (!currentAtendimentoId) {
      setRulesError('Salve o atendimento antes de cancelar.');
      return;
    }

    try {
      const atendimento = await persistAtendimento('CANCELADO');
      setStatus(atendimento.status || 'CANCELADO');
      setPagamentos([]);
      setCancelModalOpen(false);
      setRulesError('');
    } catch (err) {
      setRulesError(err?.message || 'Nao foi possivel cancelar o atendimento.');
    }
  };

  const openProntuarioModal = () => {
    if (isLocked) return;

    setProntuarioForm({ tipo: 'RECOMENDACAO', descricao: '', responsavel: currentResponsibleName });
    setRulesError('');
    setProntuarioModalOpen(true);
  };

  const handleFinalize = async () => {
    if (pendingValue > 0) {
      setRulesError('Não é possível finalizar com pagamento pendente.');
      return;
    }

    if (prontuarios.length === 0) {
      setRulesError('Não é possível finalizar sem pelo menos 1 item no prontuário.');
      return;
    }

    if (!currentAtendimentoId) {
      setRulesError('Salve o atendimento antes de finalizar.');
      return;
    }

    try {
      const atendimento = await persistAtendimento('FINALIZADO');
      setStatus(atendimento.status || 'FINALIZADO');
      setRulesError('');
    } catch (err) {
      setRulesError(err?.message || 'Nao foi possivel finalizar o atendimento.');
    }
  };

  const addProntuario = async () => {
    if (!prontuarioForm.tipo || !prontuarioForm.descricao.trim() || !prontuarioForm.responsavel.trim()) {
      setRulesError('Tipo, descrição e responsável são obrigatórios no prontuário.');
      return;
    }

    if (!currentAtendimentoId) {
      setRulesError('Salve e inicie o atendimento antes de adicionar prontuário.');
      return;
    }

    const responsavelId = resolveProfessionalId(prontuarioForm.responsavel.trim());

    if (!responsavelId) {
      setRulesError('Nao foi possivel identificar o profissional responsavel do prontuario.');
      return;
    }

    try {
      const inserted = await insertRow('prontuarios', {
        atendimento_id: currentAtendimentoId,
        responsavel_id: responsavelId,
        tipo: prontuarioForm.tipo,
        descricao: prontuarioForm.descricao.trim(),
      });

      setProntuarios((prev) => ([
        ...prev,
        {
          id: inserted.id,
          tipo: inserted.tipo,
          descricao: inserted.descricao,
          responsavel: prontuarioForm.responsavel.trim(),
        },
      ]));
      setProntuarioModalOpen(false);
      setProntuarioForm({ tipo: 'RECOMENDACAO', descricao: '', responsavel: currentResponsibleName });
      setRulesError('');
    } catch (err) {
      setRulesError(err?.message || 'Nao foi possivel adicionar o prontuario.');
    }
  };

  const openPagamentoModal = () => {
    if (isLocked) return;

    if (!selectedTreatment) {
      setRulesError('Selecione um tratamento antes de lançar pagamento.');
      return;
    }

    if (pendingValue <= 0) {
      setRulesError('Não há valor pendente para pagamento neste atendimento.');
      return;
    }

    setPagamentoForm({ formaPagamentoId: '', valor: '' });
    setRulesError('');
    setPagamentoModalOpen(true);
  };

  const addPagamento = async () => {
    const valor = Number(pagamentoForm.valor || 0);
    if (!pagamentoForm.formaPagamentoId || valor <= 0) {
      setRulesError('Informe forma de pagamento e valor válido.');
      return;
    }

    if (valor > pendingValue) {
      setRulesError('Valor informado é maior que o pendente.');
      return;
    }

    if (!currentAtendimentoId) {
      setRulesError('Salve o atendimento antes de adicionar pagamento.');
      return;
    }

    const paymentName = formasPagamentoPadrao.find((item) => item.id === pagamentoForm.formaPagamentoId)?.nome || '-';

    try {
      const inserted = await insertRow('pagamentos', {
        atendimento_id: currentAtendimentoId,
        forma_pagamento_id: pagamentoForm.formaPagamentoId,
        valor,
      });

      setPagamentos((prev) => ([
        ...prev,
        {
          id: inserted.id,
          formaPagamento: paymentName,
          valor: Number(inserted.valor || 0),
          tipoLancamento: 'RECEITA',
        },
      ]));
      setPagamentoModalOpen(false);
      setPagamentoForm({ formaPagamentoId: '', valor: '' });
      setRulesError('');
    } catch (err) {
      setRulesError(err?.message || 'Nao foi possivel adicionar o pagamento.');
    }
  };

  const openProdutoModal = () => {
    if (isLocked) return;

    setProdutoForm({ produtoId: '', quantidade: '', responsavel: currentResponsibleName });
    setRulesError('');
    setProdutoModalOpen(true);
  };

  const addProduto = async () => {
    const quantidade = Number(produtoForm.quantidade || 0);
    const stock = getProductStock(produtoForm.produtoId);

    if (!produtoForm.produtoId || quantidade <= 0 || !produtoForm.responsavel.trim()) {
      setRulesError('Informe produto, quantidade e responsável.');
      return;
    }

    if (quantidade > stock) {
      setRulesError('Quantidade maior que o estoque disponível.');
      return;
    }

    if (!currentAtendimentoId) {
      setRulesError('Salve e inicie o atendimento antes de adicionar produtos.');
      return;
    }

    const responsavelId = resolveProfessionalId(produtoForm.responsavel.trim());

    if (!responsavelId) {
      setRulesError('Nao foi possivel identificar o profissional responsavel do produto.');
      return;
    }

    try {
      const inserted = await insertRow('atendimento_produtos', {
        atendimento_id: currentAtendimentoId,
        produto_id: produtoForm.produtoId,
        quantidade,
        valor_unitario: getProductAvgValue(produtoForm.produtoId),
        responsavel_id: responsavelId,
      });

      setProdutosLancados((prev) => ([
        ...prev,
        {
          id: inserted.id,
          produtoId: inserted.produto_id,
          quantidade: Number(inserted.quantidade || 0),
          valorMedio: Number(inserted.valor_unitario || 0),
          clienteId: formData.clienteId,
          atendimentoId: currentAtendimentoId,
          responsavel: produtoForm.responsavel.trim(),
          movimentacao: 'VENDA',
          estoqueMovimentacaoId: inserted.estoque_movimentacao_id,
        },
      ]));
      setStockMovements((prev) => ([
        ...prev,
        {
          id: inserted.estoque_movimentacao_id,
          produto_id: inserted.produto_id,
          tipo: 'SAIDA',
          quantidade: inserted.quantidade,
          valor_unitario: inserted.valor_unitario,
        },
      ]));

      setProdutoModalOpen(false);
      setProdutoForm({ produtoId: '', quantidade: '', responsavel: currentResponsibleName });
      setRulesError('');
    } catch (err) {
      setRulesError(err?.message || 'Nao foi possivel adicionar o produto no atendimento.');
    }
  };

  const canDeleteLine = status !== 'FINALIZADO' && status !== 'CANCELADO';

  const getLineDeleteMessage = () => {
    if (lineDeleteModal.type === 'PRONTUARIO') return 'Deseja excluir este registro de prontuario?';
    if (lineDeleteModal.type === 'PAGAMENTO') return 'Deseja excluir este pagamento?';
    if (lineDeleteModal.type === 'PRODUTO') return 'Deseja excluir este produto do atendimento?';
    return 'Deseja excluir este item?';
  };

  const openLineDeleteModal = (type, rowId) => {
    if (!canDeleteLine) {
      addToast('Atendimento finalizado ou cancelado nao permite exclusao.', 'error');
      return;
    }
    setLineDeleteModal({ open: true, type, id: rowId });
  };

  const handleConfirmLineDelete = async () => {
    try {
      if (lineDeleteModal.type === 'PRONTUARIO') {
        await deleteRow('prontuarios', 'id', lineDeleteModal.id);
        setProntuarios((prev) => prev.filter((item) => item.id !== lineDeleteModal.id));
      }

      if (lineDeleteModal.type === 'PAGAMENTO') {
        await deleteRow('pagamentos', 'id', lineDeleteModal.id);
        setPagamentos((prev) => prev.filter((item) => item.id !== lineDeleteModal.id));
      }

      if (lineDeleteModal.type === 'PRODUTO') {
        const productRow = produtosLancados.find((item) => item.id === lineDeleteModal.id);
        await deleteRow('atendimento_produtos', 'id', lineDeleteModal.id);

        if (productRow) {
          // Cria ESTORNO no estoque para reverter a saída
          const estorno = await insertRow('estoque_movimentacoes', {
            produto_id: productRow.produtoId,
            tipo: 'ENTRADA',
            operacao: 'ESTORNO',
            quantidade: productRow.quantidade,
            valor_unitario: productRow.valorMedio,
            atendimento_id: productRow.atendimentoId,
            observacoes: 'Estorno por remoção de produto do atendimento',
          });
          setStockMovements((prev) => ([
            ...prev,
            {
              id: estorno.id,
              produto_id: productRow.produtoId,
              tipo: 'ENTRADA',
              quantidade: productRow.quantidade,
              valor_unitario: productRow.valorMedio,
            },
          ]));
        }

        setProdutosLancados((prev) => prev.filter((item) => item.id !== lineDeleteModal.id));
      }

      setLineDeleteModal({ open: false, type: '', id: '' });
      setRulesError('');
    } catch (err) {
      setRulesError(err?.message || 'Nao foi possivel excluir o item.');
    }
  };

  const removeProntuario = (rowId) => {
    openLineDeleteModal('PRONTUARIO', rowId);
  };

  const removePagamento = (rowId) => {
    openLineDeleteModal('PAGAMENTO', rowId);
  };

  const removeProduto = (rowId) => {
    openLineDeleteModal('PRODUTO', rowId);
  };

  const handleDeleteAtendimento = async () => {
    try {
      if (currentAtendimentoId) {
        await deleteRow('atendimentos', 'id', currentAtendimentoId);
      }
      setDeleteOpen(false);
      navigate('/atendimentos');
    } catch (err) {
      setDeleteOpen(false);
      setRulesError(err?.message || 'Nao foi possivel excluir o atendimento.');
    }
  };

  const lockedMessage = status === 'FINALIZADO'
    ? 'Este atendimento já foi finalizado e não pode ser alterado.'
    : status === 'CANCELADO'
    ? 'Este atendimento foi cancelado e não pode ser alterado.'
    : null;

  const statusLabelMap = {
    ORCAMENTO: 'Orcamento',
    EM_ANDAMENTO: 'Em andamento',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado',
  };

  const statusClassMap = {
    ORCAMENTO: styles.statusBudget,
    EM_ANDAMENTO: styles.statusProgress,
    FINALIZADO: styles.statusDone,
    CANCELADO: styles.statusCanceled,
  };

  const handleSaveAtendimento = async () => {
    if (lockedMessage) { addToast(lockedMessage, 'error'); return; }
    try {
      await persistAtendimento(status);
      setRulesError('');
      handleSave();
    } catch (err) {
      setRulesError(err?.message || 'Nao foi possivel salvar o atendimento.');
    }
  };

  const tabActionConfig = {
    PRONTUARIO: {
      label: 'Novo Registro',
      onClick: () => { if (lockedMessage) { addToast(lockedMessage, 'error'); return; } openProntuarioModal(); },
      disabled: false,
    },
    PAGAMENTO: {
      label: 'Novo Pagamento',
      onClick: () => { if (lockedMessage) { addToast(lockedMessage, 'error'); return; } openPagamentoModal(); },
      disabled: false,
    },
    PRODUTOS: {
      label: 'Novo Produto',
      onClick: () => { if (lockedMessage) { addToast(lockedMessage, 'error'); return; } openProdutoModal(); },
      disabled: false,
    },
  }[activeTab];

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <button onClick={() => navigate('/atendimentos')} className={styles.backBtn}>
              <ChevronLeft size={20} />
            </button>
            <h1>{id ? 'Editar Atendimento' : 'Novo Atendimento'}</h1>
          </div>

          <div className={styles.actions}>
            {status === 'ORCAMENTO' && (
              <button className={styles.startBtn} onClick={handleStartTreatment}>
                <Play size={16} />
                Iniciar
              </button>
            )}

            {(status === 'ORCAMENTO' || status === 'EM_ANDAMENTO') && (
              <>
                <button className={styles.cancelBtn} onClick={handleOpenCancel}>
                  <XCircle size={16} />
                  Cancelar
                </button>
                <button className={styles.finishBtn} onClick={handleFinalize}>
                  <CheckCircle size={16} />
                  Finalizar
                </button>
              </>
            )}

            {status !== 'FINALIZADO' && (
              <>
                <button className={styles.cancelBtn} onClick={handleOpenDiscount} disabled={!canEditTreatment || status === 'CANCELADO'}>
                  <TicketPercent size={16} />
                  Desconto
                </button>
                <button className={styles.finishBtn} onClick={() => setCourtesyModalOpen(true)} disabled={!canEditTreatment || status === 'CANCELADO'}>
                  <Gift size={16} />
                  Cortesia
                </button>

                <button className={styles.saveBtn} onClick={handleSaveAtendimento} disabled={isLocked}>
                  <Save size={16} />
                  Salvar
                </button>
              </>
            )}
          </div>
        </header>

        <div className={styles.card}>
          <FormSectionHeader title="DADOS DO ATENDIMENTO" />
          <div className={styles.grid}>
            <div className={`${styles.col4} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Cliente</label>
              <input
                className={styles.fieldSelect}
                value={selectedClient?.nome || 'Cliente não selecionado'}
                readOnly
                disabled
              />
            </div>
            <div className={`${styles.col8} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Tratamento</label>
              <select
                className={styles.fieldSelect}
                value={formData.tratamentoId}
                onChange={(e) => setFormData((prev) => ({ ...prev, tratamentoId: e.target.value }))}
                disabled={!canEditTreatment || isLocked}
              >
                <option value="">Selecione um tratamento...</option>
                {treatments.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            <div className={`${styles.col4} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Profissional Responsável</label>
              <select
                className={styles.fieldSelect}
                value={formData.profissionalId}
                onChange={(e) => setFormData((prev) => ({ ...prev, profissionalId: e.target.value }))}
                disabled={!canEditTreatment || isLocked}
              >
                <option value="">Selecione um profissional...</option>
                {professionals.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <div className={`${styles.col4} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Status</label>
              <div className={`${styles.tableBadge} ${styles.statusFieldBadge} ${statusClassMap[status] || styles.statusBudget}`}>
                {statusLabelMap[status] || status.replace('_', ' ')}
              </div>
            </div>
            <div className={styles.col4}>
              <label className={styles.fieldLabel}>Data do Atendimento</label>
              <input className={styles.fieldSelect} type="date" value={atendimentoDate} disabled />
            </div>
            <div className={`${styles.col12} ${styles.fieldGroup}`}>
              <label className={styles.fieldLabel}>Observações</label>
              <textarea
                className={styles.fieldTextarea}
                placeholder="Observações gerais do atendimento"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                disabled={isLocked}
              />
            </div>

            <div className={styles.priceSummary}>
              <div className={styles.priceRow}>
                <span>Valor do Tratamento</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(treatmentValue)}</span>
              </div>
              <div className={styles.priceRow}>
                <span>Desconto</span>
                <span className={styles.discount}>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountApplied)}</span>
              </div>
              <div className={styles.priceRow}>
                <span>Valor Pago</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaid)}</span>
              </div>
              <div className={`${styles.priceRow} ${styles.total}`}>
                <span>Valor Pendente</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingValue)}</span>
              </div>
            </div>
          </div>

          <FormSectionHeader title="REGISTROS DO ATENDIMENTO" spacing />
          <div className={styles.tabBarRow}>
            <div className={styles.tipoSwitch}>
              <button className={`${styles.switchBtn} ${activeTab === 'PRONTUARIO' ? styles.activeSwitch : ''}`} onClick={() => setActiveTab('PRONTUARIO')}>
                Prontuário
              </button>
              <button className={`${styles.switchBtn} ${activeTab === 'PAGAMENTO' ? styles.activeSwitch : ''}`} onClick={() => setActiveTab('PAGAMENTO')}>
                Pagamento
              </button>
              <button className={`${styles.switchBtn} ${activeTab === 'PRODUTOS' ? styles.activeSwitch : ''}`} onClick={() => setActiveTab('PRODUTOS')}>
                Produtos
              </button>
            </div>
            <div className={styles.tabActions}>
              <button className={styles.startBtn} onClick={tabActionConfig.onClick} disabled={tabActionConfig.disabled}>
                <Plus size={16} />
                {tabActionConfig.label}
              </button>
            </div>
          </div>

          {activeTab === 'PRONTUARIO' && (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.formTable}>
                  <thead>
                    <tr>
                      <th>
                        <span className={styles.tableHeadWithIcon}>
                          <FileText size={14} />
                          Tipo
                        </span>
                      </th>
                      <th>Descrição</th>
                      <th>Responsável</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prontuarios.length === 0 && (
                      <tr><td colSpan={4}>Nenhum registro no prontuário.</td></tr>
                    )}
                    {prontuarios.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className={styles.tableCellWithIcon}>
                            {getProntuarioIcon(item.tipo)}
                            {item.tipo}
                          </span>
                        </td>
                        <td>{item.descricao}</td>
                        <td>{item.responsavel}</td>
                        <td className={styles.tableActionsCell}>
                          {canDeleteLine && (
                            <button type="button" className={styles.tableActionBtn} onClick={() => removeProntuario(item.id)} title="Excluir linha">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'PAGAMENTO' && (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.formTable}>
                  <thead>
                    <tr>
                      <th>
                        <span className={styles.tableHeadWithIcon}>
                          <CreditCard size={14} />
                          Forma de Pagamento
                        </span>
                      </th>
                      <th>Valor</th>
                      <th>Tipo</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.length === 0 && (
                      <tr><td colSpan={4}>Nenhum pagamento registrado.</td></tr>
                    )}
                    {pagamentos.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className={styles.tableCellWithIcon}>
                            {getPaymentIcon(item.formaPagamento)}
                            {item.formaPagamento}
                          </span>
                        </td>
                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}</td>
                        <td>{item.tipoLancamento}</td>
                        <td className={styles.tableActionsCell}>
                          {canDeleteLine && (
                            <button type="button" className={styles.tableActionBtn} onClick={() => removePagamento(item.id)} title="Excluir linha">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'PRODUTOS' && (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.formTable}>
                  <thead>
                    <tr>
                      <th>
                        <span className={styles.tableHeadWithIcon}>
                          <Package size={14} />
                          Produto
                        </span>
                      </th>
                      <th>Marca</th>
                      <th>Qtd.</th>
                      <th>Valor Médio</th>
                      <th>Cliente</th>
                      <th>Movimentação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosLancados.length === 0 && (
                      <tr><td colSpan={8}>Nenhum produto registrado.</td></tr>
                    )}
                    {produtosLancados.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className={styles.tableCellWithIcon}>
                            <Package size={14} />
                            {getProductName(item.produtoId)}
                          </span>
                        </td>
                        <td>{getProductBrand(item.produtoId)}</td>
                        <td>{item.quantidade}</td>
                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorMedio)}</td>
                        <td>{selectedClient?.nome || '-'}</td>
                        <td>{item.movimentacao}</td>
                        <td className={styles.tableActionsCell}>
                          {canDeleteLine && (
                            <button type="button" className={styles.tableActionBtn} onClick={() => removeProduto(item.id)} title="Excluir linha">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {rulesError && <p className={styles.formError}>{rulesError}</p>}
        </div>
      </div>

      <Modal
        isOpen={confirmOpen}
        title="Salvo com sucesso!"
        onClose={handleConfirm}
        onConfirm={handleStayAtendimento}
        confirmText="Sim, manter neste atendimento"
        cancelText="Nao, voltar para a lista"
        size="sm"
      >
        <p>O atendimento foi salvo. Deseja manter neste atendimento atual?</p>
      </Modal>

      <Modal
        isOpen={deleteOpen}
        title="Confirmar exclusão"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAtendimento}
        confirmText="Excluir"
        cancelText="Cancelar"
        size="sm"
      >
        <p>Deseja realmente excluir este atendimento?</p>
      </Modal>

      <Modal
        isOpen={lineDeleteModal.open}
        title="Confirmar exclusao"
        onClose={() => setLineDeleteModal({ open: false, type: '', id: '' })}
        onConfirm={handleConfirmLineDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
        size="sm"
      >
        <p>{getLineDeleteMessage()}</p>
      </Modal>

      <Modal
        isOpen={discountModalOpen}
        title={status === 'FINALIZADO' ? 'Desconto Aplicado' : 'Registrar Desconto'}
        onClose={() => {
          setDiscountModalOpen(false);
          setDiscountData({ motivo: '', responsavel: currentResponsibleName, valor: '' });
        }}
        onConfirm={status === 'FINALIZADO' ? undefined : handleApplyDiscount}
        confirmText="Aplicar"
        cancelText={status === 'FINALIZADO' ? 'Fechar' : 'Cancelar'}
      >
        <div className={styles.grid}>
          <div className={styles.col12}>
            <div className={styles.movementInfoBox}>
              <p><strong>Limite de desconto:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(maxDiscountValue)}</p>
            </div>
          </div>
          <div className={`${styles.col12} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Descricao do desconto *</label>
            <textarea
              className={styles.fieldTextarea}
              rows={6}
              required
              value={discountData.motivo}
              onChange={(e) => setDiscountData((prev) => ({ ...prev, motivo: e.target.value }))}
            />
          </div>
          <div className={`${styles.col4} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Valor do desconto *</label>
            <input
              className={styles.fieldSelect}
              type="number"
              required
              value={discountData.valor}
              onChange={(e) => setDiscountData((prev) => ({ ...prev, valor: e.target.value }))}
            />
          </div>
          <div className={`${styles.col8} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Responsavel *</label>
            <input
              className={styles.fieldSelect}
              required
              value={discountData.responsavel}
              onChange={(e) => setDiscountData((prev) => ({ ...prev, responsavel: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={courtesyModalOpen}
        title={status === 'FINALIZADO' ? 'Cortesia Concedida' : 'Autorizar Cortesia'}
        onClose={() => setCourtesyModalOpen(false)}
        onConfirm={status === 'FINALIZADO' ? undefined : handleApplyCourtesy}
        confirmText="Autorizar"
        cancelText={status === 'FINALIZADO' ? 'Fechar' : 'Cancelar'}
        size="sm"
      >
        <div className={styles.grid}>
          <div className={styles.col12}>
            <p>{status === 'FINALIZADO' ? 'Este atendimento foi concedido como cortesia (desconto total aplicado).' : 'Esta ação define o atendimento como cortesia e aplica desconto total.'}</p>
          </div>
          {status !== 'FINALIZADO' && (
            <>
              <div className={styles.col12}>
                <input
                  className={styles.fieldSelect}
                  placeholder="Login de autorização"
                  value={courtesyData.login}
                  onChange={(e) => setCourtesyData((prev) => ({ ...prev, login: e.target.value }))}
                />
              </div>
              <div className={styles.col12}>
                <input
                  className={styles.fieldSelect}
                  placeholder="Senha"
                  type="password"
                  value={courtesyData.senha}
                  onChange={(e) => setCourtesyData((prev) => ({ ...prev, senha: e.target.value }))}
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={cancelModalOpen}
        title="Cancelar Atendimento"
        onClose={() => {
          setCancelModalOpen(false);
          setCancelData({ motivo: '', responsavel: currentResponsibleName });
        }}
        onConfirm={handleConfirmCancel}
        confirmText="Confirmar cancelamento"
        cancelText="Voltar"
      >
        <div className={styles.grid}>
          <div className={styles.col6}>
            <input
              className={styles.fieldSelect}
              placeholder="Motivo do cancelamento"
              value={cancelData.motivo}
              onChange={(e) => setCancelData((prev) => ({ ...prev, motivo: e.target.value }))}
            />
          </div>
          <div className={styles.col6}>
            <input
              className={styles.fieldSelect}
              placeholder="Responsável"
              value={cancelData.responsavel}
              onChange={(e) => setCancelData((prev) => ({ ...prev, responsavel: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={prontuarioModalOpen}
        title="Novo Registro de Prontuário"
        onClose={() => {
          setProntuarioModalOpen(false);
          setProntuarioForm({ tipo: 'RECOMENDACAO', descricao: '', responsavel: currentResponsibleName });
        }}
        onConfirm={addProntuario}
        confirmText="Adicionar"
        cancelText="Cancelar"
      >
        <div className={styles.grid}>
          <div className={`${styles.col4} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Tipo</label>
            <select
              className={styles.fieldSelect}
              value={prontuarioForm.tipo}
              onChange={(e) => setProntuarioForm((prev) => ({ ...prev, tipo: e.target.value }))}
            >
              <option value="RECOMENDACAO">Recomendação</option>
              <option value="MEDICAMENTO">Medicamento</option>
              <option value="EXAME">Exame</option>
            </select>
          </div>
          <div className={`${styles.col8} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Responsável</label>
            <input
              className={styles.fieldSelect}
              value={prontuarioForm.responsavel}
              onChange={(e) => setProntuarioForm((prev) => ({ ...prev, responsavel: e.target.value }))}
            />
          </div>
          <div className={`${styles.col12} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Descrição</label>
            <textarea
              className={styles.fieldTextarea}
              rows={7}
              value={prontuarioForm.descricao}
              onChange={(e) => setProntuarioForm((prev) => ({ ...prev, descricao: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={pagamentoModalOpen}
        title="Novo Pagamento"
        onClose={() => setPagamentoModalOpen(false)}
        onConfirm={addPagamento}
        confirmText="Adicionar"
        cancelText="Cancelar"
      >
        <div className={styles.grid}>
          <div className={styles.col12}>
            <div className={styles.movementInfoBox}>
              <p><strong>Tipo:</strong> Receita</p>
              <p><strong>Valor do tratamento:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(treatmentValue)}</p>
              <p><strong>Valor pendente:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingValue)}</p>
            </div>
          </div>
          <div className={`${styles.col8} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Forma de Pagamento</label>
            <select
              className={styles.fieldSelect}
              value={pagamentoForm.formaPagamentoId}
              onChange={(e) => setPagamentoForm((prev) => ({ ...prev, formaPagamentoId: e.target.value }))}
            >
              <option value="">Selecione...</option>
              {formasPagamentoPadrao.map((item) => (
                <option key={item.id} value={item.id}>{item.nome}</option>
              ))}
            </select>
          </div>
          <div className={`${styles.col4} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Valor (R$)</label>
            <input
              className={styles.fieldSelect}
              type="number"
              placeholder="0,00"
              value={pagamentoForm.valor}
              onChange={(e) => setPagamentoForm((prev) => ({ ...prev, valor: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={produtoModalOpen}
        title="Novo Produto no Atendimento"
        onClose={() => {
          setProdutoModalOpen(false);
          setProdutoForm({ produtoId: '', quantidade: '', responsavel: currentResponsibleName });
        }}
        onConfirm={addProduto}
        confirmText="Adicionar"
        cancelText="Cancelar"
      >
        <div className={styles.grid}>
          <div className={`${styles.col12} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Produto</label>
            <select
              className={styles.fieldSelect}
              value={produtoForm.produtoId}
              onChange={(e) => setProdutoForm((prev) => ({ ...prev, produtoId: e.target.value }))}
            >
              <option value="">Selecione...</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>{item.nome} — {item.marca}</option>
              ))}
            </select>
          </div>
          <div className={`${styles.col3} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Quantidade</label>
            <input
              className={styles.fieldSelect}
              type="number"
              placeholder="0"
              value={produtoForm.quantidade}
              onChange={(e) => setProdutoForm((prev) => ({ ...prev, quantidade: e.target.value }))}
            />
          </div>
          <div className={`${styles.col9} ${styles.fieldGroup}`}>
            <label className={styles.fieldLabel}>Responsável</label>
            <input
              className={styles.fieldSelect}
              value={produtoForm.responsavel}
              onChange={(e) => setProdutoForm((prev) => ({ ...prev, responsavel: e.target.value }))}
            />
          </div>
          {produtoForm.produtoId && (
            <div className={styles.col12}>
              <div className={styles.movementInfoBox}>
                <p><strong>Tipo:</strong> Venda</p>
                <p><strong>Estoque atual:</strong> {getProductStock(produtoForm.produtoId)}</p>
                <p><strong>Valor médio atual:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getProductAvgValue(produtoForm.produtoId))}</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Toast toasts={toasts} />
    </>
  );
};

export default FormAtendimento;
