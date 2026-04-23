import React from 'react';
import styles from './Input.module.css';

const Input = ({ label, error, icon: Icon, ...props }) => {
  return (
    <div className={styles.group}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={`${styles.wrapper} ${error ? styles.errorWrapper : ''}`}>
        {Icon && <Icon size={18} className={styles.icon} />}
        <input className={styles.input} {...props} />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default Input;
