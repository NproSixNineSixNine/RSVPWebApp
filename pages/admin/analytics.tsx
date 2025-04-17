import AdminLayout from '@/components/AdminLayout';

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div style={styles.container}>
        <h1 style={styles.title}>Analytics</h1>
        <div style={styles.placeholder}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.icon}>
            <path d="M3 3V21H21" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 15L12 9L8 13L6 11" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 style={styles.placeholderTitle}>Analytics Coming Soon</h2>
          <p style={styles.placeholderText}>
            We're working on bringing you detailed insights about your events and RSVPs.
            Check back soon for updates!
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  container: {
    padding: '2rem',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: '2rem',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    background: '#F8FAFC',
    borderRadius: '12px',
    border: '1px dashed #E2E8F0',
    textAlign: 'center' as const,
  },
  icon: {
    marginBottom: '1.5rem',
  },
  placeholderTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: '0.5rem',
  },
  placeholderText: {
    fontSize: '1rem',
    color: '#64748B',
    maxWidth: '400px',
    lineHeight: '1.5',
  },
}; 