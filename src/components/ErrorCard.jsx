import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import styles from './ErrorCard.module.css';

const ErrorCard = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className={styles.errorCard}>
      <div className={styles.errorContent}>
        <div className={styles.iconWrapper}>
          <AlertCircle size={24} className={styles.icon} />
        </div>
        <div className={styles.textWrapper}>
          <h3 className={styles.title}>Erro ao processar</h3>
          <p className={styles.message}>{message}</p>
        </div>
        {onClose && (
          <button 
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar aviso de erro"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorCard;
