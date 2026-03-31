import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import Button from '../common/Button';
import { FormField, Input } from '../common/FormField';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [email, setEmail] = useState('react@hipster-inc.com');
  const [password, setPassword] = useState('React@123');
  const [errors, setErrors] = useState({});

  const login = useAuthStore(s => s.login);
  const isLoading = useAuthStore(s => s.isLoading);
  const authError = useAuthStore(s => s.error);
  const clearError = useAuthStore(s => s.clearError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    if (!password.trim()) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    clearError();
    await login(email, password);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            W
          </div>
          <h1 className={styles.appName}>
            Wellness System
          </h1>
          <p className={styles.appSubtitle}>
            Spa & Wellness Booking Management
          </p>
        </div>

        {authError && (
          <div className={styles.errorBox}>
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField label="Email Address" required error={errors.email}>
            <Input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email: undefined})); }}
              placeholder="you@example.com"
              error={errors.email}
            />
          </FormField>

          <FormField label="Password" required error={errors.password}>
            <Input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password: undefined})); }}
              placeholder="••••••••"
              error={errors.password}
            />
          </FormField>

          <div className={styles.submitBtn}>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </form>

        <p className={styles.footer}>
          Secured by Hipster Wellness Platform
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
