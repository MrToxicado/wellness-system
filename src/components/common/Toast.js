import React from 'react';
import useUIStore from '../../store/uiStore';
import styles from './Toast.module.css';

const TOAST_STYLES = {
  success: { bg: '#D1FAE5', border: '#10B981', icon: '✓', text: '#065F46' },
  error: { bg: '#FEE2E2', border: '#EF4444', icon: '✕', text: '#991B1B' },
  info: { bg: '#DBEAFE', border: '#3B82F6', icon: 'ℹ', text: '#1E40AF' },
  warning: { bg: '#FEF3C7', border: '#F59E0B', icon: '⚠', text: '#92400E' },
};

const Toast = ({ toast }) => {
  const removeToast = useUIStore(s => s.removeToast);
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  return (
    <div
      className={styles.toast}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      <span className={styles.icon} style={{ color: style.border }}>
        {style.icon}
      </span>
      <span className={styles.message} style={{ color: style.text }}>
        {toast.message}
      </span>
      <button
        onClick={() => removeToast(toast.id)}
        className={styles.closeBtn}
        style={{ color: style.text }}
      >
        ×
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const toasts = useUIStore(s => s.toasts);

  if (!toasts.length) return null;

  return (
    <div className={styles.container}>
      {toasts.map(t => <Toast key={t.id} toast={t} />)}
    </div>
  );
};

export default ToastContainer;
