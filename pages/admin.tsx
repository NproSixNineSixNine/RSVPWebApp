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
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: "",
    date_time: "",
    location: "",
    description: "",
    allow_plus_one: false,
  });
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewEvent((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      fetchEvents();
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.background} />
      <div style={styles.container}>
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
            <input
              type="datetime-local"
              name="date_time"
              value={newEvent.date_time}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
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
          <div style={styles.eventsList}>
            {events.map((event) => (
              <div key={event.id} style={styles.eventItem}>
                <h3 style={styles.eventTitle}>{event.title}</h3>
                <p style={styles.eventDetail}><strong>Date & Time:</strong> {new Date(event.date_time).toLocaleString()}</p>
                <p style={styles.eventDetail}><strong>Location:</strong> {event.location}</p>
                <p style={styles.eventDetail}><strong>Description:</strong> {event.description}</p>
                <p style={styles.eventDetail}><strong>+1 Allowed:</strong> {event.allow_plus_one ? "Yes" : "No"}</p>
                <h4 style={styles.rsvpTitle}>RSVPs:</h4>
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
    display: 'grid',
    gap: '1.5rem',
  },
  eventItem: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  eventTitle: {
    color: '#ffffff',
    fontSize: '1.5rem',
    marginBottom: '1rem',
    fontWeight: '600',
  },
  eventDetail: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '0.5rem',
  },
  rsvpTitle: {
    color: '#ffffff',
    fontSize: '1.2rem',
    margin: '1rem 0',
  },
  rsvpList: {
    display: 'grid',
    gap: '1rem',
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
};

export default AdminPage; 