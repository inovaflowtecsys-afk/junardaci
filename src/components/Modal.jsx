import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

const Modal = ({ isOpen, title, onClose, onConfirm, children, size = 'md', confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'primary' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={`${styles.modal} ${styles[size]} fade-in`} 
        onClick={e => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </header>

        <div className={styles.body}>
          {children}
        </div>

        <footer className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            {cancelText}
          </button>
          {onConfirm && (
            <button 
              className={`${styles.confirmBtn} ${styles[type]}`} 
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default Modal;
