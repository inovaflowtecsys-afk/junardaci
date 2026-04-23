import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Weather from '../components/Weather';
import styles from './MainLayout.module.css';
import { Bell, LogOut, LayoutDashboard, UserRound, Users, Truck, Package, Sparkles, ClipboardList, Settings2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MODULE_MAP = [
  { match: (p) => p === '/',              icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
  { match: (p) => p.startsWith('/profissionais'), icon: <UserRound size={22} />,       label: 'Profissionais' },
  { match: (p) => p.startsWith('/clientes'),      icon: <Users size={22} />,           label: 'Clientes' },
  { match: (p) => p.startsWith('/fornecedores'),  icon: <Truck size={22} />,           label: 'Fornecedores' },
  { match: (p) => p.startsWith('/produtos'),      icon: <Package size={22} />,         label: 'Produtos' },
  { match: (p) => p.startsWith('/estoque'),       icon: <Package size={22} />,         label: 'Produtos' },
  { match: (p) => p.startsWith('/tratamentos'),   icon: <Sparkles size={22} />,        label: 'Tratamentos' },
  { match: (p) => p.startsWith('/atendimentos'),  icon: <ClipboardList size={22} />,   label: 'Atendimentos' },
  { match: (p) => p.startsWith('/gestao'),         icon: <Settings2 size={22} />,       label: 'Gestão' },
];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const userName = user?.nome || 'Usuário';
  const userRoleLabel = user?.setor || (user?.isAdmin ? 'Administrador' : 'Profissional');

  const currentModule = MODULE_MAP.find((m) => m.match(location.pathname)) || MODULE_MAP[0];

  return (
    <div className={styles.layout}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.left}>
            <div className={styles.moduleTitle}>
              <span className={styles.moduleIcon}>{currentModule.icon}</span>
              <span className={styles.moduleLabel}>{currentModule.label}</span>
            </div>
          </div>
          
          <div className={styles.right}>
            <Weather />
            
            <div className={styles.divider} />
            
            <div className={styles.userProfile}>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{userName}</span>
                <span className={styles.userRole}>{userRoleLabel}</span>
              </div>
              <div className={styles.userAvatar}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={userName} className={styles.userAvatarImage} />
                ) : (
                  userName.charAt(0)
                )}
              </div>
            </div>

            <button className={styles.logoutBtn} onClick={logout} title="Sair do Sistema">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
        {/* Rodapé de versão removido daqui, mantido apenas no Sidebar */}
      </div>
    </div>
  );
};

export default MainLayout;
