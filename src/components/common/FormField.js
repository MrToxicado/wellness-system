import React from 'react';
import styles from './FormField.module.css';

export const FormField = ({ label, error, required, children, hint }) => (
  <div className={styles.field}>
    {label && (
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className={styles.hint}>{hint}</p>}
    {error && <p className={styles.errorMsg}>{error}</p>}
  </div>
);

export const Input = React.forwardRef(({ error, ...props }, ref) => (
  <input
    ref={ref}
    className={`${styles.input} ${error ? styles.inputError : ''}`}
    {...props}
  />
));

export const Select = React.forwardRef(({ error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={`${styles.input} ${styles.select} ${error ? styles.inputError : ''}`}
    {...props}
  >
    {children}
  </select>
));

export const Textarea = React.forwardRef(({ error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={`${styles.input} ${styles.textarea} ${error ? styles.inputError : ''}`}
    {...props}
  />
));

Input.displayName = 'Input';
Select.displayName = 'Select';
Textarea.displayName = 'Textarea';

export default FormField;
