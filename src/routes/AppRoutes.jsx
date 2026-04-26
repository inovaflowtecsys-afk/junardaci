const AlterarSenha = lazy(() => import('../pages/auth/AlterarSenha'));
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import MainLayout from '../layouts/MainLayout';
// import AuthLayout from '../layouts/AuthLayout';

// Pages
const Login = lazy(() => import('../pages/auth/Login'));
const EsqueciSenha = lazy(() => import('../pages/auth/EsqueciSenha'));
const RedefinirSenha = lazy(() => import('../pages/auth/RedefinirSenha'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const ListaClientes = lazy(() => import('../pages/clientes/ListaClientes'));
const FormCliente = lazy(() => import('../pages/clientes/FormCliente'));
const ListaTratamentos = lazy(() => import('../pages/tratamentos/ListaTratamentos'));
const FormTratamento = lazy(() => import('../pages/tratamentos/FormTratamento'));
const ListaProfissionais = lazy(() => import('../pages/profissionais/ListaProfissionais'));
const FormProfissional = lazy(() => import('../pages/profissionais/FormProfissional'));
const ListaFornecedores = lazy(() => import('../pages/fornecedores/ListaFornecedores'));
const FormFornecedor = lazy(() => import('../pages/fornecedores/FormFornecedor'));
const ListaProdutos = lazy(() => import('../pages/produtos/ListaProdutos'));
const FormProduto = lazy(() => import('../pages/produtos/FormProduto'));
const ListaEstoque = lazy(() => import('../pages/estoque/ListaEstoque'));
const FormMovimentacao = lazy(() => import('../pages/estoque/FormMovimentacao'));
const ListaAtendimentos = lazy(() => import('../pages/atendimentos/ListaAtendimentos'));
const FormAtendimento = lazy(() => import('../pages/atendimentos/FormAtendimento'));
const GestaoAuxiliares = lazy(() => import('../pages/gestao/GestaoAuxiliares'));
const Empresa = lazy(() => import('../pages/gestao/Empresa'));

const routeFallbackStyle = {
  minHeight: '40vh',
  display: 'grid',
  placeItems: 'center',
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '1rem',
  letterSpacing: '0.02em',
};

const authGateWrapStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: '24px',
  background: 'linear-gradient(135deg, #f7f1e6 0%, #efe5d3 100%)',
};

const authGateCardStyle = {
  width: '100%',
  maxWidth: '480px',
  background: 'rgba(255,255,255,0.88)',
  border: '1px solid rgba(220, 200, 161, 0.8)',
  borderRadius: '28px',
  boxShadow: '0 24px 60px rgba(92, 67, 31, 0.12)',
  padding: '40px 32px',
  textAlign: 'center',
};

const authGateSpinnerStyle = {
  width: '44px',
  height: '44px',
  margin: '0 auto 20px',
  borderRadius: '999px',
  border: '4px solid rgba(201, 168, 118, 0.22)',
  borderTopColor: '#c9a876',
  animation: 'authGateSpin 0.9s linear infinite',
};

const AuthGateScreen = ({ error }) => (
  <div style={authGateWrapStyle}>
    <style>
      {`@keyframes authGateSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
    </style>
    <div style={authGateCardStyle}>
      {!error ? <div style={authGateSpinnerStyle} /> : null}
      <h2 style={{ margin: '0 0 10px', color: '#3d3022' }}>{error ? 'Falha ao iniciar' : 'Conectando'}</h2>
      <p style={{ margin: 0, color: '#6f5a3d', lineHeight: 1.5 }}>
        {error || 'Autenticação em andamento. Aguarde enquanto a aplicação valida sua sessão no banco de dados.'}
      </p>
    </div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { signed, loading, authError } = useAuth();

  if (loading) return <AuthGateScreen />;
  if (authError && !signed) return <Navigate to="/login" replace />;
  if (!signed) return <Navigate to="/login" />;

  return children;
};

const AdminRoute = ({ children }) => {
  const { signed, loading, user, authError } = useAuth();

  if (loading) return <AuthGateScreen />;
  if (authError && !signed) return <Navigate to="/login" replace />;
  if (!signed) return <Navigate to="/login" />;
  if (!(user?.isAdmin || user?.role === 'admin')) return <Navigate to="/" />;

  return children;
};

const AppRoutes = () => {
  const { signed, loading } = useAuth();

  return (
    <Suspense fallback={<div style={routeFallbackStyle}>Carregando...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/alterar-senha" element={<AlterarSenha />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        {/* Redireciona para login se não autenticado ao acessar a raiz ou index */}
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={
            !signed && !loading ? <Navigate to="/login" replace /> : <Dashboard />
          } />
          <Route path="clientes" element={<ListaClientes />} />
          <Route path="clientes/novo" element={<FormCliente />} />
          <Route path="clientes/:id" element={<FormCliente />} />
          <Route path="tratamentos" element={<ListaTratamentos />} />
          <Route path="tratamentos/novo" element={<FormTratamento />} />
          <Route path="tratamentos/:id" element={<FormTratamento />} />
          <Route path="profissionais" element={<AdminRoute><ListaProfissionais /></AdminRoute>} />
          <Route path="profissionais/novo" element={<AdminRoute><FormProfissional /></AdminRoute>} />
          <Route path="profissionais/:id" element={<AdminRoute><FormProfissional /></AdminRoute>} />
          <Route path="fornecedores" element={<ListaFornecedores />} />
          <Route path="fornecedores/novo" element={<FormFornecedor />} />
          <Route path="fornecedores/:id" element={<FormFornecedor />} />
          <Route path="produtos" element={<ListaProdutos />} />
          <Route path="produtos/novo" element={<FormProduto />} />
          <Route path="produtos/:id" element={<FormProduto />} />
          <Route path="estoque" element={<ListaEstoque />} />
          <Route path="estoque/novo" element={<FormMovimentacao />} />
          <Route path="atendimentos" element={<ListaAtendimentos />} />
          <Route path="atendimentos/novo" element={<FormAtendimento />} />
          <Route path="atendimentos/:id" element={<FormAtendimento />} />
          <Route path="gestao" element={<AdminRoute><GestaoAuxiliares /></AdminRoute>} />
          <Route path="empresa" element={<AdminRoute><Empresa /></AdminRoute>} />
          {/* Add more private routes here */}
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
