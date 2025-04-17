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

  useEffect(() => {
    document.body.style.overflow = isNavOpen && isMobile ? 'hidden' : 'auto';
  }, [isNavOpen, isMobile]);

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

  const handleLinkClick = () => {
    if (isMobile) setIsNavOpen(false);
  };

  return (
    <div style={styles.wrapper}>
      {isMobile && (
        <button style={styles.menuButton} onClick={toggleMobileNav}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      )}

      {isMobile && isNavOpen && (
        <div style={styles.backdrop} onClick={toggleMobileNav} />
      )}

      <div style={{
        ...styles.sidebar,
        ...(isMobile ? styles.sidebarMobile : {}),
        ...(isCollapsed ? styles.sidebarCollapsed : {}),
        ...(isMobile && isNavOpen ? styles.sidebarOpen : {}),
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
          <Link href="/admin" onClick={handleLinkClick} style={{
            ...styles.navLink,
            ...(isActive('/admin') ? styles.activeNavLink : {}),
          }}>
            <Image src="/images/calendar.png" alt="Events" width={24} height={24} style={styles.navIcon} />
            {!isCollapsed && <span>Events</span>}
          </Link>
          <Link href="/admin/analytics" onClick={handleLinkClick} style={{
            ...styles.navLink,
            ...(isActive('/admin/analytics') ? styles.activeNavLink : {}),
          }}>
            <Image src="/images/data-analytics.png" alt="Analytics" width={24} height={24} style={styles.navIcon} />
            {!isCollapsed && <span>Analytics</span>}
          </Link>
        </nav>
        <div style={styles.logoutContainer}>
          <button style={styles.logoutButton} onClick={handleLogout}>
            <Image src="/images/logout.png" alt="Logout" width={24} height={24} style={styles.navIcon} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      <main style={{
        ...styles.main,
        ...(isMobile ? styles.mainMobile : {}),
        ...(isCollapsed && !isMobile ? styles.mainExpanded : {}),
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
    position: 'relative' as const,
  },
  menuButton: {
    position: 'fixed' as const,
    top: '1rem',
    left: '1rem',
    zIndex: 1001,
    background: 'white',
    border: '1px solid #E2E8F0',
    padding: '0.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  backdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  sidebar: {
    width: '220px',
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'all 0.3s ease',
    zIndex: 1001,
  },
  sidebarMobile: {
    position: 'fixed' as const,
    top: 0,
    bottom: 0,
    left: 0,
    width: '70%',
    transform: 'translateX(-100%)',
  },
  sidebarOpen: {
    transform: 'translateX(0)',
  },
  sidebarCollapsed: {
    width: '60px',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  collapseButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1.25rem',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
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
  },
  activeNavLink: {
    background: 'rgba(255, 255, 255, 0.2)',
  },
  navIcon: {
    width: '24px',
    height: '24px',
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
  },
  main: {
    flex: 1,
    padding: '2rem',
    background: '#f8fafc',
    transition: 'all 0.3s ease',
  },
  mainMobile: {
    marginTop: '60px',
    padding: '1rem',
  },
  mainExpanded: {
    marginLeft: '60px',
  },
} as const; 