/**
 * Admin Dashboard Page
 * 
 * This page provides the main interface for event management, including:
 * - Viewing upcoming and past events
 * - Creating new events
 * - Managing event details
 * - Viewing RSVP statistics
 * - Mobile-optimized layout with horizontal scrolling
 */

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { Session, User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import Image from 'next/image';

// Type definitions for the application
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

interface NewEvent {
  title: string;
  date_time: string;
  location: string;
  description: string;
  allow_plus_one: boolean;
}

const AdminPage = () => {
  // Router and refs
  const router = useRouter();
  const locationInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [sortBy, setSortBy] = useState<'time' | 'name'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: "",
    date_time: "",
    location: "",
    description: "",
    allow_plus_one: false,
  });
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dateTimeError, setDateTimeError] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 8;

  // Add mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Handles user logout
   * Signs out the user and redirects to home page
   */
  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (err) {
      console.error('Error in sign out:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Checks and maintains user session
   * Redirects to home if no valid session
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace('/');
          return;
        }

        setUser(session.user);
        await fetchEvents();
        await fetchRSVPs();
        setLoading(false);
      } catch (err) {
        console.error('Error checking session:', err);
        router.replace('/');
      }
    };

    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.replace('/');
        } else if (session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  /**
   * Fetches all events from the database
   */
  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("events").select("*");
    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  /**
   * Fetches all RSVPs from the database
   */
  const fetchRSVPs = async () => {
    const { data, error } = await supabase.from("rsvps").select("*");
    if (!error) {
      setRsvps(data || []);
    }
  };

  /**
   * Gets current date and time in ISO format
   * Used for date-time input validation
   */
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  /**
   * Handles form input changes
   * Includes validation for date-time inputs
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === 'date_time') {
      const selectedDateTime = new Date(value);
      const currentDateTime = new Date();

      if (selectedDateTime < currentDateTime) {
        setDateTimeError('Please select a future date and time');
        return;
      } else {
        setDateTimeError(null);
      }
    }

    setNewEvent((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /**
   * Handles new event form submission
   * Validates date and creates event in database
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedDateTime = new Date(newEvent.date_time);
    const currentDateTime = new Date();

    if (selectedDateTime < currentDateTime) {
      setDateTimeError('Please select a future date and time');
      return;
    }

    const { error } = await supabase.from("events").insert([newEvent]);
    if (error) {
      console.error("Error creating event:", error);
    } else {
      setNewEvent({
        title: "",
        date_time: "",
        location: "",
        description: "",
        allow_plus_one: false,
      });
      setShowSuccess(true);
      setShowCreateDialog(false);
      fetchEvents();
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  /**
   * Filters and sorts events based on current tab, search query, and sort parameters
   */
  const getFilteredEvents = () => {
    const now = new Date();
    let filtered = events.filter(event => {
      const eventDate = new Date(event.date_time);
      const matchesTab = activeTab === 'upcoming' 
        ? eventDate >= now 
        : eventDate < now;
      
      // Search functionality
      const matchesSearch = searchQuery === '' || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesTab && matchesSearch;
    });

    // Sort functionality
    filtered.sort((a, b) => {
      if (sortBy === 'time') {
        const dateA = new Date(a.date_time);
        const dateB = new Date(b.date_time);
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      } else {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
    });

    return filtered;
  };

  /**
   * Gets paginated events for current page
   */
  const getPaginatedEvents = () => {
    const filtered = getFilteredEvents();
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Pagination calculations
  const totalPages = Math.ceil(getFilteredEvents().length / eventsPerPage);
  const startItem = (currentPage - 1) * eventsPerPage + 1;
  const endItem = Math.min(currentPage * eventsPerPage, getFilteredEvents().length);

  /**
   * Refreshes events and RSVPs data
   */
  const refreshEvents = async () => {
    setEventsLoading(true);
    try {
      // Fetch events with ordering
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order('date_time', { ascending: true });
      
      // Fetch RSVPs
      const { data: rsvpsData, error: rsvpsError } = await supabase
        .from("rsvps")
        .select("*");
      
      if (eventsError || rsvpsError) {
        console.error('Error refreshing data:', eventsError || rsvpsError);
        return;
      }

      // Update state with new data
      setEvents(eventsData || []);
      setRsvps(rsvpsData || []);
      
      // Reset pagination to first page
      setCurrentPage(1);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error refreshing events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const truncateDescription = (description: string) => {
    const words = description.split(' ');
    if (words.length <= 3) return description;
    return `${words.slice(0, 3).join(' ')}...`;
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
          <span style={styles.loadingText}>Loading...</span>
        </div>
      </AdminLayout>
    );
  }

  // No user state
  if (!user) {
    return null;
  }

  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* Success Alert */}
        {showSuccess && (
          <div style={styles.successAlert}>
            <div style={styles.successContent}>
              <span style={styles.successIcon}>✓</span>
              <span style={styles.successText}>Event has been successfully created!</span>
            </div>
            <button
              style={styles.closeButton}
              onClick={() => setShowSuccess(false)}
            >
              ×
            </button>
          </div>
        )}

        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.titleContainer}>
              <h1 style={styles.title}>Event Management</h1>
              <p style={styles.subtitle}>Manage your events and RSVPs</p>
            </div>
            <div style={styles.headerStats}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Events</span>
                <span style={styles.statValue}>{events.length}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total RSVPs</span>
                <span style={styles.statValue}>{rsvps.length}</span>
              </div>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button
              style={styles.createButton}
              onClick={() => setShowCreateDialog(true)}
            >
              {isMobile ? 'New Event' : 'Create New Event'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'upcoming' && styles.activeTab)
            }}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Events
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'past' && styles.activeTab)
            }}
            onClick={() => setActiveTab('past')}
          >
            Past Events
          </button>
        </div>

        {/* Events List */}
        <div style={styles.eventsContainer}>
          <div style={styles.eventsHeader}>
            <h2 style={styles.sectionTitle}>
              {activeTab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
            </h2>
            <div style={styles.controls}>
              <div style={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
              <div style={styles.sortContainer}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'time' | 'name')}
                  style={styles.sortSelect}
                >
                  <option value="time">Sort by Time</option>
                  <option value="name">Sort by Name</option>
                </select>
                <button
                  style={styles.sortOrderButton}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
                <button
                  style={styles.refreshButton}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await fetchEvents();
                    } catch (error) {
                      console.error('Error refreshing events:', error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  title="Refresh events"
                >
                  <img 
                    src="/images/refresh.png" 
                    alt="Refresh" 
                    style={styles.refreshIcon}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div style={styles.tableWrapper}>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Event Title</th>
                  <th style={styles.th}>Date & Time</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>RSVPs</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedEvents().map((event) => (
                  <tr key={event.id} style={styles.tr}>
                    <td style={styles.td} data-label="Event Title">{event.title}</td>
                    <td style={styles.td} data-label="Date & Time">
                      {format(new Date(event.date_time), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td style={styles.td} data-label="Location">{event.location}</td>
                    <td style={styles.td} data-label="Description">
                      <div style={styles.descriptionCell}>
                        <span>{truncateDescription(event.description)}</span>
                        {event.description.split(' ').length > 3 && (
                          <button
                            style={styles.viewMoreButton}
                            onClick={() => {
                              setSelectedDescription(event.description);
                              setShowDescriptionDialog(true);
                            }}
                          >
                            View More
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={styles.td} data-label="RSVPs">
                      {rsvps.filter(r => r.event_id === event.id).length}
                    </td>
                    <td style={styles.td} data-label="Actions">
                      <button
                        style={styles.actionButton}
                        onClick={() => router.push(`/admin/events/${event.id}`)}
                      >
                        View RSVPs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div style={styles.paginationContainer}>
          <button
            style={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {Math.ceil(getFilteredEvents().length / eventsPerPage)}
          </span>
          <button
            style={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(getFilteredEvents().length / eventsPerPage)))}
            disabled={currentPage === Math.ceil(getFilteredEvents().length / eventsPerPage)}
          >
            Next
          </button>
        </div>

        {/* Create Event Dialog */}
        {showCreateDialog && (
          <div style={styles.dialogOverlay}>
            <div style={styles.dialog}>
              <div style={styles.dialogHeader}>
                <h2 style={styles.dialogTitle}>Create New Event</h2>
                <button
                  style={styles.closeButton}
                  onClick={() => setShowCreateDialog(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} style={styles.form}>
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  placeholder="Event Title"
                  required
                  style={styles.input}
                />
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date & Time</label>
                  <input
                    type="datetime-local"
                    name="date_time"
                    value={newEvent.date_time}
                    onChange={handleInputChange}
                    min={getCurrentDateTime()}
                    required
                    style={{
                      ...styles.input,
                      ...(dateTimeError ? styles.inputError : {}),
                    }}
                  />
                  {dateTimeError && (
                    <span style={styles.errorMessage}>{dateTimeError}</span>
                  )}
                </div>
                <input
                  type="text"
                  name="location"
                  value={newEvent.location}
                  onChange={handleInputChange}
                  placeholder="Event Location"
                  required
                  style={styles.input}
                />
                <input
                  type="text"
                  name="description"
                  value={newEvent.description}
                  onChange={handleInputChange}
                  placeholder="Event Description"
                  required
                  style={styles.input}
                />
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="allow_plus_one"
                    checked={newEvent.allow_plus_one}
                    onChange={handleInputChange}
                    style={styles.checkbox}
                  />
                  Allow +1
                </label>
                <div style={styles.dialogActions}>
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitButton}>
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Description Dialog */}
        {showDescriptionDialog && (
          <div style={styles.dialogOverlay}>
            <div style={styles.dialog}>
              <div style={styles.dialogHeader}>
                <h2 style={styles.dialogTitle}>Event Description</h2>
                <button
                  style={styles.closeButton}
                  onClick={() => setShowDescriptionDialog(false)}
                >
                  ×
                </button>
              </div>
              <div style={styles.dialogBody}>
                <p style={styles.descriptionText}>{selectedDescription}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

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
    '@media (min-width: 768px)': {
      padding: '2rem',
    },
  },

  // Header
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    marginBottom: '2.5rem',
    '@media (min-width: 768px)': {
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
  },
  headerContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    '@media (min-width: 768px)': {
      flexDirection: 'row' as const,
      alignItems: 'center',
      gap: '3rem',
    },
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#1E293B',
    margin: 0,
    marginBottom: '0.5rem',
    '@media (min-width: 768px)': {
      fontSize: '2rem',
    },
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748B',
    margin: 0,
  },
  headerStats: {
    display: 'flex',
    gap: '1.5rem',
    padding: '1rem',
    background: '#F1F5F9',
    borderRadius: '8px',
    '@media (max-width: 768px)': {
      justifyContent: 'space-between',
    },
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#64748B',
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1E293B',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      width: '100%',
    },
  },
  createButton: {
    padding: '0.75rem 1.5rem',
    background: '#764ba2',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap' as const,
    '@media (min-width: 768px)': {
      padding: '0.75rem 1.75rem',
      fontSize: '1rem',
    },
    '&:hover': {
      background: '#5f3a8a',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  },

  // Tab Navigation
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    overflowX: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
    paddingBottom: '0.5rem',
  },
  tabButton: {
    padding: '0.75rem 1.5rem',
    background: 'none',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#64748B',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    '&:hover': {
      background: '#F8FAFC',
    },
  },
  activeTab: {
    background: '#F1F5F9',
    color: '#1E293B',
    borderColor: '#CBD5E1',
  },

  // Events List
  eventsContainer: {
    marginBottom: '1.5rem',
  },
  eventsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1E293B',
    margin: 0,
  },
  controls: {
    display: 'flex',
    gap: '0.75rem',
    '@media (max-width: 768px)': {
      flexDirection: 'column' as const,
    },
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    '&:focus': {
      outline: 'none',
      borderColor: '#764ba2',
    },
  },
  sortContainer: {
    display: 'flex',
    gap: '0.5rem',
  },
  sortSelect: {
    padding: '0.75rem 1rem',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    background: 'white',
  },
  sortOrderButton: {
    padding: '0.75rem 1rem',
    background: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    '&:hover': {
      background: '#E2E8F0',
    },
  },
  refreshButton: {
    padding: '0.5rem',
    background: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      background: '#E2E8F0',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  },
  refreshIcon: {
    width: '16px',
    height: '16px',
    objectFit: 'contain',
  },

  // Table
  tableWrapper: {
    width: '100%',
    overflowX: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
    marginBottom: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    '@media (max-width: 768px)': {
      margin: '0 -1rem',
      width: 'calc(100% + 2rem)',
      borderRadius: '0',
      borderLeft: 'none',
      borderRight: 'none',
      position: 'relative' as const,
      left: '0',
      right: '0',
      overflowX: 'scroll' as const,
      overflowY: 'hidden' as const,
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
  tableContainer: {
    minWidth: '800px',
    '@media (max-width: 768px)': {
      minWidth: '100%',
      width: '100%',
      display: 'block' as const,
      overflowX: 'auto' as const,
    },
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    '@media (max-width: 768px)': {
      display: 'block' as const,
      width: '100%',
      overflowX: 'auto' as const,
    },
  },
  th: {
    padding: '1rem',
    textAlign: 'left' as const,
    background: '#F8FAFC',
    color: '#64748B',
    fontSize: '0.9rem',
    fontWeight: '600',
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap' as const,
    '@media (max-width: 768px)': {
      padding: '0.75rem',
      fontSize: '0.85rem',
      position: 'sticky' as const,
      top: 0,
      zIndex: 1,
    },
  },
  tr: {
    borderBottom: '1px solid #E2E8F0',
    '@media (max-width: 768px)': {
      display: 'table-row' as const,
      width: '100%',
    },
  },
  td: {
    padding: '1rem',
    color: '#1E293B',
    fontSize: '0.9rem',
    '@media (max-width: 768px)': {
      padding: '0.75rem',
      fontSize: '0.85rem',
      whiteSpace: 'nowrap' as const,
    },
  },
  descriptionCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  viewMoreButton: {
    background: 'none',
    border: 'none',
    color: '#764ba2',
    cursor: 'pointer',
    padding: 0,
    font: 'inherit',
    outline: 'inherit',
  },
  dialogOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    maxWidth: '400px',
    width: '100%',
  },
  dialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  dialogTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1E293B',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#64748B',
    cursor: 'pointer',
  },
  dialogBody: {
    marginBottom: '1.5rem',
  },
  descriptionText: {
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1E293B',
  },
  input: {
    padding: '0.75rem 1rem',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    '&:focus': {
      outline: 'none',
      borderColor: '#764ba2',
    },
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: '0.8rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkbox: {
    width: '1rem',
    height: '1rem',
  },
  dialogActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    background: '#F1F5F9',
    color: '#64748B',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: '#E2E8F0',
    },
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    background: '#764ba2',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: '#5f3a8a',
    },
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #764ba2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '1rem',
    color: '#64748B',
    fontSize: '0.9rem',
  },
  successAlert: {
    position: 'fixed' as const,
    top: '1rem',
    right: '1rem',
    background: '#10B981',
    color: 'white',
    padding: '1rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    zIndex: 1000,
  },
  successContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  successIcon: {
    fontSize: '1.25rem',
  },
  successText: {
    fontSize: '0.9rem',
  },
  actionButton: {
    padding: '0.5rem 1rem',
    background: '#764ba2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    '&:hover': {
      background: '#5f3a8a',
    },
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  paginationButton: {
    padding: '0.5rem 1rem',
    background: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    '&:hover': {
      background: '#E2E8F0',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  pageInfo: {
    color: '#64748B',
    fontSize: '0.9rem',
  },
} as const;

export default AdminPage; 