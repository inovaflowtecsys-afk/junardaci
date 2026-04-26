import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserRound, 
  Users, 
  Truck, 
  Package, 
  Sparkles, 
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Settings2,
  KeyRound,
  Building2
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../contexts/AuthContext';
import AlterarSenha from '../pages/auth/AlterarSenha';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || user?.role === 'admin';

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
    { path: '/clientes', icon: <Users size={22} />, label: 'Clientes' },
    { path: '/fornecedores', icon: <Truck size={22} />, label: 'Fornecedores' },
    { path: '/produtos', icon: <Package size={22} />, label: 'Produtos' },
    { path: '/tratamentos', icon: <Sparkles size={22} />, label: 'Tratamentos' },
    { path: '/atendimentos', icon: <ClipboardList size={22} />, label: 'Atendimentos' },
    { path: '/profissionais', icon: <UserRound size={22} />, label: 'Profissionais', adminOnly: true },
    { path: '/gestao', icon: <Settings2 size={22} />, label: 'Gestão', adminOnly: true },
    { path: '/empresa', icon: <Building2 size={22} />, label: 'Empresa', adminOnly: true },
    { path: '/alterar-senha', icon: <KeyRound size={22} />, label: 'Alterar Senha', adminOnly: false, bottom: true },
  ];

  const [senhaModalOpen, setSenhaModalOpen] = useState(false);

  const handleSenhaClick = (e) => {
    e.preventDefault();
    setSenhaModalOpen(true);
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logoShell}>
          <img
            src="https://www.inovaflowtec.com.br/svg/junadarci.png"
            alt="Logo"
            className={styles.logo}
          />
        </div>
        
        <button onClick={() => setCollapsed(!collapsed)} className={styles.toggleBtn}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className={styles.nav}>
        {menuItems.filter(item => !item.bottom).map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          return (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeItem : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!collapsed && <span className={styles.label}>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Item de menu fixo no rodapé do sidebar */}
      <div className={styles.sidebarBottomMenu}>
        {menuItems.filter(item => item.bottom).map((item) => (
          <a
            key={item.path}
            href="#"
            onClick={handleSenhaClick}
            className={`${styles.navItem} ${styles.leftAlign}`}
            style={{textDecoration: 'none'}}
          >
            <span className={styles.icon}>{item.icon}</span>
            {!collapsed && <span className={styles.label}>{item.label}</span>}
          </a>
        ))}
        <AlterarSenha isOpen={senhaModalOpen} onClose={() => setSenhaModalOpen(false)} />
      </div>
      <div className={styles.sidebarFooter}>
        Inovaflowtec - Versão 1.0.0 - 23/04/2026
      </div>
    </aside>
  );
};

export default Sidebar;
