/**
 * Login Page Component
 * 
 * This page handles user authentication and session management.
 * Features:
 * - Email and password login
 * - Session persistence check
 * - Password visibility toggle
 * - Loading states
 * - Error handling
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

// Type definitions for better type safety
interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  // Router instance for navigation
  const router = useRouter();

  // State management
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Handles session check and auth state changes
   * Redirects to admin page if user is already logged in
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          router.replace('/admin');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Error checking session:', err);
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          router.replace('/admin');
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  /**
   * Handles form input changes
   * @param e - React change event
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handles form submission
   * Authenticates user with Supabase
   * @param e - React form event
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.background} />
        <div style={styles.card}>
          <div style={styles.loaderContainer}>
            <div style={styles.loader} />
            <span>Initializing your secure session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.background} />
      <div style={styles.card}>
        {/* Logo */}
        <img
          src="https://placehold.co/120x120/764ba2/ffffff?text=RSVP&font=montserrat"
          alt="RSVP Logo"
          style={styles.logo}
        />
        
        {/* Title */}
        <h2 style={styles.title}>Admin Login</h2>
        
        {/* Login Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          {/* Email Input */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
          
          {/* Password Input with Toggle */}
          <div style={styles.passwordContainer}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={styles.passwordInput}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5ZM12 17.5C9.24 17.5 7 15.26 7 12.5C7 9.74 9.24 7.5 12 7.5C14.76 7.5 17 9.74 17 12.5C17 15.26 14.76 17.5 12 17.5ZM12 9.5C10.34 9.5 9 10.84 9 12.5C9 14.16 10.34 15.5 12 15.5C13.66 15.5 15 14.16 15 12.5C15 10.84 13.66 9.5 12 9.5Z" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5ZM12 17.5C9.24 17.5 7 15.26 7 12.5C7 9.74 9.24 7.5 12 7.5C14.76 7.5 17 9.74 17 12.5C17 15.26 14.76 17.5 12 17.5ZM12 9.5C10.34 9.5 9 10.84 9 12.5C9 14.16 10.34 15.5 12 15.5C13.66 15.5 15 14.16 15 12.5C15 10.84 13.66 9.5 12 9.5Z" fill="currentColor"/>
                  <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
          
          {/* Submit Button */}
          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(loading ? styles.buttonLoading : {}),
            }}
            disabled={loading}
          >
            {loading ? (
              <div style={styles.loaderContainer}>
                <div style={styles.loader} />
                <span>Logging in...</span>
              </div>
            ) : (
              'Login'
            )}
          </button>
          
          {/* Error Message */}
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

/**
 * Component Styles
 * Organized by component sections for better maintainability
 */
const styles = {
  // Layout
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

  // Logo and Title
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

  // Form Elements
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
  passwordContainer: {
    position: 'relative' as const,
    width: '100%',
  },
  passwordInput: {
    width: '100%',
    padding: '1rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #A1AEB1',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: '#FBFCFC',
    color: '#000506',
    outline: 'none',
    paddingRight: '2.5rem',
    '&:focus': {
      borderColor: '#315358',
      boxShadow: '0 0 0 2px rgba(49, 83, 88, 0.1)',
    },
  },
  eyeButton: {
    position: 'absolute' as const,
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748B',
    padding: '0.25rem',
    '&:hover': {
      color: '#315358',
    },
  },

  // Button Styles
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
  buttonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },

  // Error Message
  error: {
    color: '#E12404',
    marginTop: '1rem',
    fontSize: '0.9rem',
  },

  // Loading States
  loaderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  loader: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #FBFCFC',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
}; 