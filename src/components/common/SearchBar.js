import React, { useRef } from 'react';
import styles from './SearchBar.module.css';

const SearchBar = ({ value, onChange, placeholder = 'Search bookings...', onClear }) => {
  const timerRef = useRef(null);
  const handleChange = (val) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(val), 300);
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.icon}>🔍</span>
      <input
        type="text"
        defaultValue={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
      {value && (
        <button onClick={onClear} className={styles.clearBtn}>×</button>
      )}
    </div>
  );
};

export default SearchBar;
