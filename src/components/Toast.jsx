import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import styles from './Toast.module.css';

const Toast = ({ toasts }) => {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]} fade-in`}>
          <span className={styles.icon}>{icons[toast.type]}</span>
          <p className={styles.message}>{toast.message}</p>
        </div>
      ))}
    </div>
  );
};

export default Toast;
