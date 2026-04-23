import React from 'react';
import { IMaskInput } from 'react-imask';
import styles from './Input.module.css';

const MaskInput = ({ label, error, ...props }) => {
  return (
    <div className={styles.group}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={`${styles.wrapper} ${error ? styles.errorWrapper : ''}`}>
        <IMaskInput
          className={`${styles.input} ${error ? styles.errorInput : ''}`}
          {...props}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default MaskInput;
