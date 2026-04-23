import React from 'react';
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
  Settings2
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../contexts/AuthContext';

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
  ];

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
        {menuItems.map((item) => {
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
    </aside>
  );
};

export default Sidebar;
