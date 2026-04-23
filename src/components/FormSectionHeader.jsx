import React from 'react';
import styles from './FormSectionHeader.module.css';

const FormSectionHeader = ({ title, spacing = false }) => {
  return (
    <div className={`${styles.wrapper} ${spacing ? styles.spacing : ''}`}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.line} />
    </div>
  );
};

export default FormSectionHeader;
