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
    minHeight: '100vh',
    background: '#000506',
    padding: '2rem',
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
    background: '#FBFCFC',
    padding: '3rem 2.5rem',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '500px',
    textAlign: 'center' as const,
    position: 'relative' as const,
    zIndex: 2,
  },
  logo: {
    width: '100px',
    marginBottom: '2rem',
    borderRadius: '8px',
  },
  title: {
    marginBottom: '2rem',
    color: '#000506',
    fontSize: '2rem',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  input: {
    padding: '1rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #A1AEB1',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: '#FBFCFC',
    color: '#000506',
    outline: 'none',
    '&:focus': {
      borderColor: '#315358',
      boxShadow: '0 0 0 2px rgba(49, 83, 88, 0.1)',
    },
  },
  button: {
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#FBFCFC',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '600',
    marginTop: '1rem',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },
  error: {
    color: '#E12404',
    marginTop: '1rem',
    fontSize: '0.9rem',
  },
}; 