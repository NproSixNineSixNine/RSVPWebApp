import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.background} />
      <div style={styles.card}>
        <img
          src="https://placehold.co/120x120/764ba2/ffffff?text=RSVP&font=montserrat"
          alt="RSVP Logo"
          style={styles.logo}
        />
        <h2 style={styles.title}>Admin Login</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Login</button>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    margin: 0,
    padding: 0,
  },
  background: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    opacity: 0.95,
    zIndex: 1,
    margin: 0,
    padding: 0,
  },
  card: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '2.5rem',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center' as const,
    position: 'relative' as const,
    zIndex: 2,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    margin: '0 auto',
  },
  logo: {
    width: '120px',
    marginBottom: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    marginBottom: '1.5rem',
    color: '#ffffff',
    fontSize: '1.75rem',
    fontWeight: '600',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  input: {
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    backdropFilter: 'blur(5px)',
  },
  button: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '600',
    marginTop: '0.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  error: {
    color: '#ff6b6b',
    marginTop: '1rem',
    fontSize: '0.9rem',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
}; 