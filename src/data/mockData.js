export const especialidades = [
  { id: 'e1', nome: 'Estética Avançada', ativa: true },
  { id: 'e2', nome: 'Dermatologia', ativa: true },
  { id: 'e3', nome: 'Biomedicina Estética', ativa: true },
  { id: 'e4', nome: 'Micropigmentação', ativa: true },
  { id: 'e5', nome: 'Podologia', ativa: true },
];

export const setores = [
  { id: 's1', nome: 'Clínico', ativo: true },
  { id: 's2', nome: 'Estético', ativo: true },
  { id: 's3', nome: 'Comercial', ativo: true },
  { id: 's4', nome: 'Administrativo', ativo: true },
];

export const cargos = [
  { id: 'cg1', nome: 'Médico', ativo: true },
  { id: 'cg2', nome: 'Biomédico', ativo: true },
  { id: 'cg3', nome: 'Fisioterapeuta', ativo: true },
  { id: 'cg4', nome: 'Recepcionista', ativo: true },
  { id: 'cg5', nome: 'Gerente', ativo: true },
];

export const formasPagamentoPadrao = [
  { id: 'fp-1', nome: 'Dinheiro' },
  { id: 'fp-2', nome: 'PIX' },
  { id: 'fp-3', nome: 'Cartão de Crédito' },
  { id: 'fp-4', nome: 'Débito' },
  { id: 'fp-5', nome: 'Outros' },
];

export const unidadesMedidaPadrao = [
  { id: 'um-1', nome: 'UN' },
  { id: 'um-2', nome: 'ML' },
  { id: 'um-3', nome: 'LT' },
  { id: 'um-4', nome: 'MG' },
  { id: 'um-5', nome: 'KG' },
];

export const professionals = [
  {
    id: 'p1',
    nome: 'Dra. Juliana Nardaci',
    cpf: '111.222.333-44',
    email: 'juliana@clinica.com',
    role: 'admin',
    setor: 'Clínico',
    cargo: 'Médico',
    especialidade: 'Estética Avançada',
    telefone: '(11) 98888-7777',
    ativo: true,
  },
  {
    id: 'p2',
    nome: 'Dra. Maria Silva',
    cpf: '222.333.444-55',
    email: 'maria@clinica.com',
    role: 'profissional',
    setor: 'Estético',
    cargo: 'Biomédico',
    especialidade: 'Dermatologia',
    telefone: '(11) 97777-6666',
    ativo: true,
  }
];

export const clients = [
  {
    id: 'c1',
    nome: 'Ana Oliveira',
    cpf: '123.456.789-00',
    email: 'ana.oliveira@email.com',
    telefone: '(11) 91234-5678',
    cidade: 'São Paulo',
    uf: 'SP',
    ativo: true,
    data_nascimento: '1990-05-15',
  },
  {
    id: 'c2',
    nome: 'Roberto Santos',
    cpf: '987.654.321-11',
    email: 'roberto.santos@email.com',
    telefone: '(11) 98765-4321',
    cidade: 'Campinas',
    uf: 'SP',
    ativo: true,
    data_nascimento: '1985-10-20',
  }
];

export const products = [
  {
    id: 'pr1',
    nome: 'Toxina Botulínica 100UI',
    marca: 'Allergan',
    unidade: 'un',
    total_entradas: 18,
    total_saidas: 6,
    qtd_minima: 5,
    saldo_estoque: 12,
    valor_medio: 850.00,
    ativo: true,
  },
  {
    id: 'pr2',
    nome: 'Preenchedor Ácido Hialurônico',
    marca: 'Restylane',
    unidade: 'ml',
    total_entradas: 14,
    total_saidas: 6,
    qtd_minima: 10,
    saldo_estoque: 8,
    valor_medio: 450.00,
    ativo: true,
  }
];

export const treatments = [
  {
    id: 't1',
    nome: 'Limpeza de Pele Profunda',
    valor: 250.00,
    perc_max_desconto: 10,
    duracao_estimada: 90,
    ativo: true,
  },
  {
    id: 't2',
    nome: 'Aplicação de Botox',
    valor: 1200.00,
    perc_max_desconto: 15,
    duracao_estimada: 30,
    ativo: true,
  }
];

export const attendances = [
  {
    id: 'a1',
    cliente_id: 'c1',
    tratamento_id: 't2',
    profissional_id: 'p1',
    status: 'FINALIZADO',
    valor_tratamento: 1200.00,
    valor_final: 1100.00,
    data_inicio: '2024-03-20T14:00:00Z',
    data_fim: '2024-03-20T14:30:00Z',
  },
  {
    id: 'a2',
    cliente_id: 'c2',
    tratamento_id: 't1',
    profissional_id: 'p2',
    status: 'EM_ANDAMENTO',
    valor_tratamento: 250.00,
    valor_final: 250.00,
    data_inicio: '2024-03-21T10:00:00Z',
  }
];

export const suppliers = [
  {
    id: 'f1',
    razao_social: 'Pharma Estética LTDA',
    nome_fantasia: 'Pharma Center',
    cpf_cnpj: '12.345.678/0001-90',
    contato: 'Carlos Medeiros',
    telefone: '(11) 3333-4444',
    cidade: 'São Paulo',
    uf: 'SP',
    ativo: true
  },
  {
    id: 'f2',
    razao_social: 'Equipamentos Beleza S.A',
    nome_fantasia: 'Beleza Tech',
    cpf_cnpj: '98.765.432/0001-10',
    contato: 'Fernanda Lima',
    telefone: '(11) 4444-5555',
    cidade: 'São Bernardo',
    uf: 'SP',
    ativo: true
  }
];

export const supplierPurchases = [
  {
    id: 'cp-1',
    supplier_id: 'f1',
    product_name: 'Toxina Botulínica 100UI',
    brand: 'Allergan',
    quantity: 6,
    unit_price: 850.00,
    purchase_date: '2024-04-15T10:30:00Z',
  },
  {
    id: 'cp-2',
    supplier_id: 'f1',
    product_name: 'Preenchedor Ácido Hialurônico',
    brand: 'Restylane',
    quantity: 10,
    unit_price: 450.00,
    purchase_date: '2024-03-28T14:00:00Z',
  },
  {
    id: 'cp-3',
    supplier_id: 'f2',
    product_name: 'Caneta Pressurizada',
    brand: 'Beleza Tech',
    quantity: 2,
    unit_price: 1290.00,
    purchase_date: '2024-04-08T09:15:00Z',
  },
];

export const mockAuthUser = {
  email: 'admin@clinica.com',
  nome: 'Administrador',
  role: 'admin'
};
