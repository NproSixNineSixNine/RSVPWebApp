import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import Image from 'next/image';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <div style={styles.wrapper}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button 
          style={styles.menuButton}
          onClick={toggleMobileNav}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div style={{
        ...styles.sidebar,
        ...(isMobile ? styles.sidebarMobile : {}),
        ...(isCollapsed ? styles.sidebarCollapsed : {}),
        ...(isMobile && isNavOpen ? { transform: 'translateX(0)' } : {}),
      }}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoWrapper}>
            {!isCollapsed && <span style={styles.logoText}>RSVP</span>}
          </div>
          {!isMobile && (
            <button style={styles.collapseButton} onClick={toggleSidebar}>
              {isCollapsed ? '→' : '←'}
            </button>
          )}
        </div>
        <nav style={styles.nav}>
          <Link href="/admin" style={{
            ...styles.navLink,
            ...(isActive('/admin') ? styles.activeNavLink : {}),
          }}>
            <span style={styles.navIcon}>📅</span>
            {!isCollapsed && <span>Events</span>}
          </Link>
          <Link href="/admin/analytics" style={{
            ...styles.navLink,
            ...(isActive('/admin/analytics') ? styles.activeNavLink : {}),
          }}>
            <span style={styles.navIcon}>📊</span>
            {!isCollapsed && <span>Analytics</span>}
          </Link>
        </nav>
        <div style={styles.logoutContainer}>
          <button style={styles.logoutButton} onClick={handleLogout}>
            <span style={styles.navIcon}>🚪</span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
      <main style={{
        ...styles.main,
        ...(isMobile ? styles.mainMobile : {}),
        ...(isCollapsed ? styles.mainExpanded : {}),
      }}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    '@media (max-width: 768px)': {
      flexDirection: 'column' as const,
    },
  },
  menuButton: {
    position: 'fixed' as const,
    top: '12px',
    left: '12px',
    zIndex: 20,
    background: 'none',
    border: 'none',
    color: '#1E293B',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.05)',
    },
  },
  sidebar: {
    width: '220px',
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'all 0.3s ease',
    '@media (max-width: 768px)': {
      width: '50%',
      position: 'fixed' as const,
      top: 0,
      left: 0,
      bottom: 0,
      transform: 'translateX(-100%)',
      zIndex: 1000,
    },
  },
  sidebarMobile: {
    width: '50%',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    bottom: 0,
    transform: 'translateX(-100%)',
    zIndex: 1000,
  },
  sidebarCollapsed: {
    width: '60px',
    '@media (max-width: 768px)': {
      width: '50%',
    },
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    borderRadius: '50%',
  },
  logoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    textAlign: 'center' as const,
  },
  collapseButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '0.5rem',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.1)',
    },
  },
  activeNavLink: {
    background: 'rgba(255, 255, 255, 0.2)',
  },
  navIcon: {
    fontSize: '1.25rem',
  },
  logoutContainer: {
    marginTop: 'auto',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    color: 'white',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.1)',
    },
  },
  main: {
    flex: 1,
    padding: '2rem',
    background: '#f8fafc',
    transition: 'all 0.3s ease',
    '@media (max-width: 768px)': {
      padding: '1rem',
      marginTop: '60px',
    },
  },
  mainMobile: {
    padding: '1rem',
    marginTop: '60px',
  },
  mainExpanded: {
    marginLeft: '60px',
    '@media (max-width: 768px)': {
      marginLeft: 0,
    },
  },
} as const; 