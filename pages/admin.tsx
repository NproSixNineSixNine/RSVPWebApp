import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { Session, User } from '@supabase/supabase-js';

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
  will_bring_plus_one: boolean;
  response: string;
  event_id: string;
}

interface NewEvent {
  title: string;
  date_time: string;
  location: string;
  description: string;
  allow_plus_one: boolean;
}

const AdminPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
      } else {
        setUser(session.user);
        fetchEvents();
        fetchRSVPs();
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const fetchRSVPs = async () => {
    const { data, error } = await supabase.from("rsvps").select("*");
    if (!error) setRsvps(data || []);
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

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
      fetchEvents();
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const getFilteredEvents = () => {
    const now = new Date();
    return events
      .filter(event => {
        const eventDate = new Date(event.date_time);
        return activeTab === 'upcoming' 
          ? eventDate >= now 
          : eventDate < now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date_time);
        const dateB = new Date(b.date_time);
        return activeTab === 'upcoming'
          ? dateA.getTime() - dateB.getTime() // Ascending for upcoming
          : dateB.getTime() - dateA.getTime(); // Descending for past
      });
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.background} />
      <div style={styles.container}>
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
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.welcome}>Welcome, {user?.email}</p>
        </div>
        
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Create New Event</h2>
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
            <button type="submit" style={styles.button}>Create Event</button>
          </form>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>All Events</h2>
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'upcoming' ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Events
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'past' ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab('past')}
            >
              Past Events
            </button>
          </div>
          <div style={styles.eventsList}>
            {getFilteredEvents().map((event) => (
              <div key={event.id} style={styles.eventItem}>
                <h3 style={styles.eventTitle}>{event.title}</h3>
                <p style={styles.eventDetail}>
                  <strong>Date & Time:</strong> {new Date(event.date_time).toLocaleString()}
                </p>
                <p style={styles.eventDetail}><strong>Location:</strong> {event.location}</p>
                <p style={styles.eventDetail}><strong>Description:</strong> {event.description}</p>
                <p style={styles.eventDetail}><strong>+1 Allowed:</strong> {event.allow_plus_one ? "Yes" : "No"}</p>
                <h4 style={styles.rsvpTitle}>
                  RSVPs ({rsvps.filter(rsvp => rsvp.event_id === event.id).length})
                </h4>
                <div style={styles.rsvpList}>
                  {rsvps
                    .filter((rsvp) => rsvp.event_id === event.id)
                    .map((rsvp) => (
                      <div key={rsvp.id} style={styles.rsvpItem}>
                        <p style={styles.rsvpDetail}><strong>{rsvp.name}</strong> ({rsvp.email})</p>
                        <p style={styles.rsvpDetail}>Response: {rsvp.response}</p>
                        <p style={styles.rsvpDetail}>+1: {rsvp.will_bring_plus_one ? 'Yes' : 'No'}</p>
                        <p style={styles.rsvpDetail}>Dietary: {rsvp.dietary_preferences}</p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {getFilteredEvents().length === 0 && (
              <p style={styles.noEvents}>
                No {activeTab} events found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '100vh',
    width: '100vw',
    position: 'relative' as const,
    overflow: 'auto', // <-- this is the fix
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
  container: {
    position: 'relative' as const,
    zIndex: 2,
    width: '100%',
    maxWidth: '1200px',
    padding: '2rem',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  title: {
    color: '#ffffff',
    fontSize: '2.5rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  welcome: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '1.1rem',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    marginBottom: '2rem',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: '1.75rem',
    marginBottom: '1.5rem',
    fontWeight: '600',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    fontSize: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    backdropFilter: 'blur(5px)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#ffffff',
    marginBottom: '1rem',
  },
  checkbox: {
    width: '1.2rem',
    height: '1.2rem',
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
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2rem',
    width: '100%',
  },
  eventItem: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '2rem',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    minHeight: '300px',
    width: '100%',
    marginBottom: '2rem',
  },
  eventTitle: {
    color: '#ffffff',
    fontSize: '1.75rem',
    marginBottom: '1rem',
    fontWeight: '600',
    gridColumn: '1 / -1',
  },
  eventDetail: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '0.5rem',
    fontSize: '1.1rem',
  },
  rsvpTitle: {
    color: '#ffffff',
    fontSize: '1.3rem',
    margin: '1rem 0',
    gridColumn: '1 / -1',
  },
  rsvpList: {
    display: 'grid',
    gap: '1rem',
    maxHeight: '300px',
    overflowY: 'auto' as const,
    paddingRight: '1rem',
  },
  rsvpItem: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1rem',
    borderRadius: '8px',
    borderLeft: '4px solid #667eea',
  },
  rsvpDetail: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '0.25rem',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    color: '#ffffff',
    fontSize: '1.2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  successAlert: {
    position: 'fixed' as const,
    top: '20px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    animation: 'slideIn 0.3s ease-out',
    zIndex: 1000,
  },
  successContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  successIcon: {
    color: '#10B981',
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  successText: {
    color: '#1F2937',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#6B7280',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    ':hover': {
      color: '#1F2937',
      background: 'rgba(0, 0, 0, 0.05)',
    },
  },
  '@keyframes slideIn': {
    from: {
      transform: 'translateX(100%)',
      opacity: 0,
    },
    to: {
      transform: 'translateX(0)',
      opacity: 1,
    },
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  label: {
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: '0.8rem',
    marginTop: '0.25rem',
  },
  tabs: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    paddingBottom: '0.5rem',
  },
  tabButton: {
    padding: '0.5rem 1rem',
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: '4px',
    ':hover': {
      color: '#ffffff',
      background: 'rgba(255, 255, 255, 0.1)',
    },
  },
  activeTab: {
    color: '#ffffff',
    background: 'rgba(255, 255, 255, 0.1)',
    fontWeight: '600',
  },
  noEvents: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center' as const,
    padding: '2rem',
    fontSize: '1.1rem',
  },
};

export default AdminPage; 