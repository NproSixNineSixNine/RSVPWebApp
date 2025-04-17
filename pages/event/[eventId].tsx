/**
 * Event Page Component
 * 
 * This page displays event details and handles RSVP submissions.
 * Features:
 * - Event information display
 * - RSVP form with validation
 * - Plus one option handling
 * - Loading and error states
 * - Responsive design
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

// Type definitions for better type safety
interface Event {
  id: string;
  title: string;
  date_time: string;
  location: string;
  description: string;
  allow_plus_one: boolean;
}

interface RSVPForm {
  name: string;
  email: string;
  response: string;
  plus_one: boolean;
  dietary_preferences: string;
}

export default function EventPage() {
  // Router instance for navigation and query parameters
  const router = useRouter();
  const { eventId } = router.query;

  // State management
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRsvp, setNewRsvp] = useState<RSVPForm>({
    name: "",
    email: "",
    response: "",
    plus_one: false,
    dietary_preferences: "",
  });

  /**
   * Fetches event details from the database
   * Handles loading states and error cases
   */
  useEffect(() => {
    if (!router.isReady || !eventId) return;

    const fetchEvent = async () => {
      try {
        // First check if events table is accessible
        const { data: allEvents, error: allEventsError } = await supabase
          .from("events")
          .select("*")
          .limit(1);

        if (allEventsError) {
          console.error("Error accessing events table:", allEventsError);
          setError("Error accessing events. Please try again later.");
          return;
        }

        // Fetch specific event details
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching event:", error);
          if (error.code === 'PGRST116') {
            setError("Event not found. Please check the event link and try again.");
          } else {
            setError("An error occurred while loading the event. Please try again later.");
          }
        } else if (!data) {
          setError("Event not found. Please check the event link and try again.");
        } else {
          setEvent(data);
          // Reset plus_one if event doesn't allow it
          if (!data.allow_plus_one) {
            setNewRsvp(prev => ({ ...prev, plus_one: false }));
          }
          setError(null);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, router.isReady]);

  /**
   * Handles form input changes
   * @param e - React change event
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    setNewRsvp((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? target.checked : value,
    }));
  };

  /**
   * Handles form submission
   * Validates form and submits RSVP to database
   * @param e - React form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newRsvp.response === "") {
      alert("Please select whether you will be attending");
      return;
    }

    try {
      const { error } = await supabase.from("rsvps").insert([
        {
          ...newRsvp,
          event_id: eventId,
        },
      ]);

      if (error) {
        alert("Error submitting RSVP. Please try again.");
        console.error("RSVP submission error:", error);
      } else {
        router.push(`/thank-you?response=${newRsvp.response}`);
      }
    } catch (err) {
      console.error("Unexpected error during RSVP submission:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader} />
        <span>Loading event details...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorTitle}>Error</h2>
        <p style={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  // No event found state
  if (!event) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorTitle}>Event Not Found</h2>
        <p style={styles.errorMessage}>The requested event could not be found.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Background with decorative pattern */}
      <div style={styles.background} />
      
      {/* Main content container */}
      <div style={styles.content}>
        {/* Event Information Section */}
        <div style={styles.eventInfo}>
          <div style={styles.eventInfoTopRight} />
          <div style={styles.eventInfoBottomLeft} />
          <h1 style={styles.title}>{event.title}</h1>
          <div style={styles.details}>
            <p style={styles.detailItem}>
              <span style={styles.detailLabel}>Date & Time:</span>
              {new Date(event.date_time).toLocaleString()}
            </p>
            <p style={styles.detailItem}>
              <span style={styles.detailLabel}>Location:</span>
              {event.location}
            </p>
            <p style={styles.detailItem}>
              <span style={styles.detailLabel}>Description:</span>
              {event.description}
            </p>
          </div>
        </div>

        {/* RSVP Form Section */}
        <div style={styles.formContainer}>
          <div style={styles.formTopLeft} />
          <div style={styles.formTopRight} />
          <h2 style={styles.formTitle}>RSVP</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Name Input */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                name="name"
                value={newRsvp.name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            {/* Email Input */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={newRsvp.email}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            {/* Attendance Selection */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Will you be attending?</label>
              <select
                name="response"
                value={newRsvp.response}
                onChange={(e) => {
                  const newResponse = e.target.value;
                  setNewRsvp(prev => ({
                    ...prev,
                    response: newResponse,
                    plus_one: newResponse === 'no' ? false : prev.plus_one
                  }));
                }}
                style={styles.select}
                required
              >
                <option value="">Please select an option</option>
                <option value="yes">Yes, I'll be there</option>
                <option value="no">No, I won't be able to make it</option>
              </select>
            </div>

            {/* Plus One Toggle (only shown if event allows plus ones and user is attending) */}
            {event?.allow_plus_one && newRsvp.response === 'yes' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Will you be bringing a plus one?</label>
                <div style={styles.toggleContainer}>
                  <button
                    type="button"
                    onClick={() => setNewRsvp(prev => ({ ...prev, plus_one: true }))}
                    style={{
                      ...styles.toggleButton,
                      ...(newRsvp.plus_one ? styles.toggleButtonActive : {})
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRsvp(prev => ({ ...prev, plus_one: false }))}
                    style={{
                      ...styles.toggleButton,
                      ...(!newRsvp.plus_one ? styles.toggleButtonActive : {})
                    }}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Plus One Toggle (disabled state when not attending) */}
            {event?.allow_plus_one && newRsvp.response === 'no' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Will you be bringing a plus one?</label>
                <div style={styles.toggleContainer}>
                  <button
                    type="button"
                    disabled
                    style={{
                      ...styles.toggleButton,
                      ...styles.toggleButtonDisabled
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    disabled
                    style={{
                      ...styles.toggleButton,
                      ...styles.toggleButtonDisabled
                    }}
                  >
                    No
                  </button>
                </div>
                <p style={styles.disabledMessage}>
                  Plus one option is not available when not attending
                </p>
              </div>
            )}

            {/* Dietary Preferences */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Dietary Preferences</label>
              <textarea
                name="dietary_preferences"
                value={newRsvp.dietary_preferences}
                onChange={handleChange}
                placeholder="Any dietary restrictions or preferences?"
                style={styles.textarea}
              />
            </div>

            {/* Submit Button */}
            <button type="submit" style={styles.submitButton}>
              Submit RSVP
            </button>
          </form>
        </div>
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
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1rem',
    position: 'relative' as const,
    zIndex: 1,
  },

  // Background
  background: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#faf6f2',
    zIndex: 1,
  },

  // Content
  content: {
    position: 'relative' as const,
    zIndex: 2,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '1rem',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '2rem',
    '@media (min-width: 768px)': {
      gridTemplateColumns: '1fr 1fr',
      padding: '2rem',
    },
  },

  // Event Information
  eventInfo: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(232, 224, 215, 0.5)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  eventInfoTopRight: {
    position: 'absolute' as const,
    top: '5px',
    right: '-10px',
    width: '100px',
    height: '100px',
    background: 'url("/images/floral_image.png") center/contain no-repeat',
    opacity: 0.5,
    transform: 'rotate(270deg)',
  },
  eventInfoBottomLeft: {
    position: 'absolute' as const,
    bottom: '5px',
    left: '-15px',
    width: '100px',
    height: '100px',
    background: 'url("/images/floral_image.png") center/contain no-repeat',
    opacity: 0.5,
    transform: 'rotate(90deg)',
  },

  // Form Elements
  formContainer: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(232, 224, 215, 0.5)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  formTopLeft: {
    position: 'absolute' as const,
    bottom: '5px',
    left: '-15px',
    width: '100px',
    height: '100px',
    background: 'url("/images/floral_image.png") center/contain no-repeat',
    opacity: 0.5,
    transform: 'rotate(90deg)',
  },
  formTopRight: {
    position: 'absolute' as const,
    top: '5px',
    right: '-10px',
    width: '100px',
    height: '100px',
    background: 'url("/images/floral_image.png") center/contain no-repeat',
    opacity: 0.5,
    transform: 'rotate(270deg)',
  },

  // Typography
  title: {
    color: '#2c1810',
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    position: 'relative' as const,
    zIndex: 1,
    '@media (min-width: 768px)': {
      fontSize: '2.5rem',
      marginBottom: '2rem',
    },
  },
  formTitle: {
    color: '#2c1810',
    fontSize: '1.25rem',
    marginBottom: '1.5rem',
    fontWeight: '600',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    position: 'relative' as const,
    zIndex: 1,
  },
  details: {
    position: 'relative' as const,
    zIndex: 1,
  },
  detailItem: {
    marginBottom: '1rem',
    color: '#4a3c35',
    fontSize: '0.9rem',
    lineHeight: '1.5',
  },
  detailLabel: {
    fontWeight: '600',
    marginRight: '0.5rem',
  },

  // Form Elements
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    position: 'relative' as const,
    zIndex: 1,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    color: '#2c1810',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #A1AEB1',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#FBFCFC',
    color: '#000506',
    outline: 'none',
    '&:focus': {
      borderColor: '#315358',
      boxShadow: '0 0 0 2px rgba(49, 83, 88, 0.1)',
    },
  },
  select: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #A1AEB1',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#FBFCFC',
    color: '#000506',
    outline: 'none',
    cursor: 'pointer',
    '&:focus': {
      borderColor: '#315358',
      boxShadow: '0 0 0 2px rgba(49, 83, 88, 0.1)',
    },
  },
  textarea: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #A1AEB1',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#FBFCFC',
    color: '#000506',
    outline: 'none',
    minHeight: '100px',
    resize: 'vertical' as const,
    '&:focus': {
      borderColor: '#315358',
      boxShadow: '0 0 0 2px rgba(49, 83, 88, 0.1)',
    },
  },

  // Toggle Buttons
  toggleContainer: {
    display: 'flex',
    gap: '0.5rem',
  },
  toggleButton: {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #A1AEB1',
    background: 'none',
    color: '#4a3c35',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(212, 163, 115, 0.1)',
    },
  },
  toggleButtonActive: {
    background: '#D4A373',
    color: '#ffffff',
    borderColor: '#D4A373',
    '&:hover': {
      background: '#E6B17E',
    },
  },
  toggleButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    '&:hover': {
      background: 'none',
    },
  },
  disabledMessage: {
    color: '#64748B',
    fontSize: '0.8rem',
    marginTop: '0.5rem',
  },

  // Submit Button
  submitButton: {
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    background: '#D4A373',
    color: '#ffffff',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '1rem',
    '&:hover': {
      transform: 'translateY(-2px)',
      background: '#E6B17E',
    },
  },

  // Loading and Error States
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
  },
  loader: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(118, 75, 162, 0.3)',
    borderTop: '4px solid #764ba2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center' as const,
  },
  errorTitle: {
    color: '#2c1810',
    fontSize: '1.5rem',
    marginBottom: '1rem',
    fontWeight: '600',
  },
  errorMessage: {
    color: '#4a3c35',
    fontSize: '1rem',
    lineHeight: '1.5',
  },
};
