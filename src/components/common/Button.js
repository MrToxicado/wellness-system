import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  fullWidth = false,
  style: extraStyle,
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    onClick={onClick}
    className={[
      styles.btn,
      styles[variant] || styles.primary,
      styles[size] || styles.md,
      fullWidth ? styles.fullWidth : '',
    ].join(' ')}
    style={extraStyle}
  >
    {loading && <span className={styles.spinner} />}
    {children}
  </button>
);

export default Button;
