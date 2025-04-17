/**
 * Admin Event Details Page Component
 * 
 * This page displays detailed information about a specific event and its RSVPs.
 * Features:
 * - Event information display
 * - RSVP list with status tracking
 * - Plus one information
 * - Dietary preferences
 * - Loading and error states
 * - Responsive design optimized for mobile
 * - Touch-friendly interactions
 * - Mobile-optimized table view
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../../lib/supabaseClient";
import AdminLayout from '@/components/AdminLayout';

// Type definitions for better type safety
interface Event {
  id: string;
  title: string;
  date_time: string;
  location: string;
  description: string;
  allow_plus_one: boolean;
}

interface RSVP {
  id: string;
  name: string;
  email: string;
  dietary_preferences: string;
  plus_one: boolean;
  event_id: string;
  response: string;
}

export default function EventDetailsPage() {
  // Router instance for navigation and query parameters
  const router = useRouter();
  const { eventId } = router.query;

  // State management
  const [event, setEvent] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add mobile-specific state
  const [isMobile, setIsMobile] = useState(false);

  /**
   * Fetches event details and RSVPs from the database
   * Handles loading states and error cases
   */
  const fetchEventAndRSVPs = async () => {
    try {
      setLoading(true);
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) {
        console.error("Error fetching event:", eventError);
        setError("Error loading event details. Please try again later.");
        return;
      }
      setEvent(eventData);

      // Fetch RSVPs for this event
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select("*")
        .eq("event_id", eventId);

      if (rsvpError) {
        console.error("Error fetching RSVPs:", rsvpError);
        setError("Error loading RSVPs. Please try again later.");
        return;
      }
      setRsvps(rsvpData || []);
      setError(null);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;
    fetchEventAndRSVPs();
  }, [eventId]);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
          <span style={styles.loadingText}>Loading event details...</span>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Error</h2>
          <p style={styles.errorText}>{error}</p>
          <button
            style={styles.backButton}
            onClick={() => router.push('/admin')}
          >
            Back to Events
          </button>
        </div>
      </AdminLayout>
    );
  }

  // No event found state
  if (!event) {
    return (
      <AdminLayout>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Event Not Found</h2>
          <p style={styles.errorText}>The event you're looking for doesn't exist or has been removed.</p>
          <button
            style={styles.backButton}
            onClick={() => router.push('/admin')}
          >
            Back to Events
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>{event.title}</h1>
            <p style={styles.subtitle}>
              {new Date(event.date_time).toLocaleString()} • {event.location}
            </p>
          </div>
          <button
            style={styles.backButton}
            onClick={() => router.push('/admin')}
            aria-label="Back to events list"
          >
            {isMobile ? '← Back' : 'Back to Events'}
          </button>
        </div>

        {/* Event Description Section */}
        <div style={styles.descriptionContainer}>
          <h2 style={styles.sectionTitle}>Event Description</h2>
          <p style={styles.description}>{event.description}</p>
        </div>

        {/* RSVPs Section */}
        <div style={styles.rsvpContainer}>
          <div style={styles.rsvpHeader}>
            <h2 style={styles.sectionTitle}>RSVPs ({rsvps.length})</h2>
            {isMobile && (
              <div style={styles.mobileFilters}>
                <button style={styles.filterButton} onClick={() => {/* Add filter logic */}}>
                  Filter
                </button>
                <button style={styles.sortButton} onClick={() => {/* Add sort logic */}}>
                  Sort
                </button>
              </div>
            )}
          </div>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Guest Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Plus One</th>
                  <th style={styles.th}>Dietary</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((rsvp) => (
                  <tr 
                    key={rsvp.id} 
                    style={styles.tr}
                    onClick={() => isMobile && {/* Add mobile row click handler */}}
                  >
                    <td style={styles.td} data-label="Guest Name">{rsvp.name}</td>
                    <td style={styles.td} data-label="Email">{rsvp.email}</td>
                    <td style={styles.td} data-label="Status">
                      <span style={{
                        ...styles.statusBadge,
                        ...(rsvp.response === 'yes' ? styles.statusYes : styles.statusNo)
                      }}>
                        {rsvp.response === 'yes' ? 'Attending' : 'Not Attending'}
                      </span>
                    </td>
                    <td style={styles.td} data-label="Plus One">
                      {rsvp.response === 'yes' ? (rsvp.plus_one ? 'Yes' : 'No') : '-'}
                    </td>
                    <td style={styles.td} data-label="Dietary">
                      {rsvp.dietary_preferences || 'None'}
                    </td>
                  </tr>
                ))}
                {rsvps.length === 0 && (
                  <tr>
                    <td colSpan={5} style={styles.noRsvps}>
                      No RSVPs yet for this event
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/**
 * Component Styles
 * Organized by component sections for better maintainability
 */
const styles = {
  // Layout
  container: {
    padding: '1rem',
    maxWidth: '1200px',
    margin: '0 auto',
    WebkitTapHighlightColor: 'transparent',
    '@media (min-width: 640px)': {
      padding: '2rem',
    },
  },

  // Header
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    marginBottom: '2rem',
    position: 'relative' as const,
    '@media (min-width: 640px)': {
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1E293B',
    margin: 0,
    '@media (min-width: 640px)': {
      fontSize: '1.5rem',
    },
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#64748B',
    margin: '0.5rem 0 0',
    '@media (min-width: 640px)': {
      fontSize: '1rem',
    },
  },
  backButton: {
    padding: '0.75rem 1.5rem',
    background: 'none',
    border: '1px solid #E2E8F0',
    color: '#64748B',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    WebkitAppearance: 'none' as const,
    '@media (min-width: 640px)': {
      width: 'auto',
    },
    '&:hover': {
      background: '#F8FAFC',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  },

  // Description Section
  descriptionContainer: {
    background: '#ffffff',
    padding: '1rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E2E8F0',
    marginBottom: '2rem',
    '@media (min-width: 640px)': {
      padding: '1.5rem',
    },
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1E293B',
    margin: '0 0 1rem',
    '@media (min-width: 640px)': {
      fontSize: '1.25rem',
    },
  },
  description: {
    fontSize: '0.9rem',
    color: '#475569',
    lineHeight: '1.5',
    margin: 0,
    '@media (min-width: 640px)': {
      fontSize: '1rem',
    },
  },

  // RSVPs Section
  rsvpContainer: {
    background: '#ffffff',
    padding: '1rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E2E8F0',
    '@media (min-width: 640px)': {
      padding: '1.5rem',
    },
  },
  rsvpHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  tableContainer: {
    overflowX: 'auto' as const,
    marginTop: '1rem',
    WebkitOverflowScrolling: 'touch' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    '@media (max-width: 640px)': {
      display: 'block',
    },
  },
  th: {
    padding: '0.75rem',
    textAlign: 'left' as const,
    color: '#64748B',
    fontSize: '0.85rem',
    fontWeight: '600',
    borderBottom: '1px solid #E2E8F0',
    '@media (max-width: 640px)': {
      display: 'none',
    },
    '@media (min-width: 640px)': {
      padding: '1rem',
      fontSize: '0.9rem',
    },
  },
  tr: {
    borderBottom: '1px solid #E2E8F0',
    '@media (max-width: 640px)': {
      display: 'block',
      padding: '0.75rem',
      marginBottom: '1rem',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      '&:active': {
        background: '#F8FAFC',
      },
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  td: {
    padding: '0.75rem',
    color: '#1E293B',
    fontSize: '0.9rem',
    '@media (max-width: 640px)': {
      display: 'block',
      padding: '0.5rem',
      textAlign: 'right' as const,
      position: 'relative' as const,
      paddingLeft: '50%',
      '&::before': {
        content: 'attr(data-label)',
        position: 'absolute' as const,
        left: 0,
        width: '45%',
        paddingRight: '0.5rem',
        textAlign: 'left' as const,
        fontWeight: '600',
        color: '#64748B',
      },
    },
    '@media (min-width: 640px)': {
      padding: '1rem',
      fontSize: '0.95rem',
    },
  },
  noRsvps: {
    padding: '1.5rem',
    textAlign: 'center' as const,
    color: '#64748B',
    fontSize: '0.9rem',
    '@media (min-width: 640px)': {
      padding: '2rem',
      fontSize: '0.95rem',
    },
  },

  // Status Badges
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.8rem',
    fontWeight: '500',
    display: 'inline-block',
    '@media (min-width: 640px)': {
      fontSize: '0.85rem',
    },
  },
  statusYes: {
    background: '#D1FAE5',
    color: '#065F46',
  },
  statusNo: {
    background: '#FEE2E2',
    color: '#991B1B',
  },

  // Loading and Error States
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    gap: '1rem',
    padding: '1rem',
    '@media (min-width: 640px)': {
      padding: '2rem',
    },
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(30, 41, 59, 0.1)',
    borderTop: '3px solid #1E293B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    '@media (min-width: 640px)': {
      width: '40px',
      height: '40px',
      borderWidth: '4px',
    },
  },
  loadingText: {
    color: '#64748B',
    fontSize: '0.9rem',
    '@media (min-width: 640px)': {
      fontSize: '1rem',
    },
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    padding: '1rem',
    textAlign: 'center' as const,
    '@media (min-width: 640px)': {
      padding: '2rem',
    },
  },
  errorTitle: {
    color: '#1E293B',
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    '@media (min-width: 640px)': {
      fontSize: '1.5rem',
    },
  },
  errorText: {
    color: '#64748B',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
    '@media (min-width: 640px)': {
      fontSize: '1rem',
    },
  },

  // Mobile-specific styles
  mobileFilters: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  filterButton: {
    padding: '0.5rem 1rem',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#64748B',
    cursor: 'pointer',
    flex: 1,
  },
  sortButton: {
    padding: '0.5rem 1rem',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#64748B',
    cursor: 'pointer',
    flex: 1,
  },
}; 