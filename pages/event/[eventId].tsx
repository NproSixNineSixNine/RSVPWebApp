import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

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
  const router = useRouter();
  const { eventId } = router.query;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RSVPForm>({
    name: "",
    email: "",
    response: "yes",
    plus_one: false,
    dietary_preferences: "",
  });

  useEffect(() => {
    if (!router.isReady || !eventId) return;

    console.log(`🚨 Event ID from URL: ${eventId}`);
    console.log(`📝 Event ID type: ${typeof eventId}`);
    console.log(`🔍 Checking if eventId is valid: ${eventId}`);

    const fetchEvent = async () => {
      try {
        // First, let's check if we can get any events at all
        const { data: allEvents, error: allEventsError } = await supabase
          .from("events")
          .select("*")
          .limit(1);

        console.log("🔍 All events test:", allEvents);
        console.log("❌ All events error:", allEventsError);

        if (allEventsError) {
          console.error("❌ Error fetching all events:", allEventsError);
          setError("Error accessing events. Please try again later.");
          return;
        }

        // Now try to get our specific event using a different approach
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .maybeSingle();

        console.log("🔍 Query result:", { data, error });
        console.log("🔍 Raw SQL equivalent:", `SELECT * FROM events WHERE id = '${eventId}'`);

        if (error) {
          console.error("❌ Supabase error while fetching event:", error);
          if (error.code === 'PGRST116') {
            setError("Event not found. Please check the event link and try again.");
          } else {
            setError("An error occurred while loading the event. Please try again later.");
          }
        } else if (!data) {
          console.error("❌ No event data returned");
          setError("Event not found. Please check the event link and try again.");
        } else {
          console.log("✅ Event found:", data);
          setEvent(data);
          // Set plus_one to false if the event doesn't allow plus ones
          if (!data.allow_plus_one) {
            setFormData(prev => ({ ...prev, plus_one: false }));
          }
          setError(null);
        }
      } catch (err) {
        console.error("❌ Unexpected error:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, router.isReady]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? target.checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📤 Submitting RSVP with data:", formData);

    const { error } = await supabase.from("rsvps").insert([
      {
        ...formData,
        event_id: eventId,
      },
    ]);

    if (error) {
      alert("Error submitting RSVP. Try again.");
      console.error("❌ RSVP submission error:", error);
    } else {
      router.push(`/thank-you?response=${formData.response}`);
    }
  };

  if (loading) return <div className="loading">Loading event...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!event) return <div className="error">Event not found.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.background} />
      <div style={styles.content}>
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

        <div style={styles.formContainer}>
          <div style={styles.formTopLeft} />
          <div style={styles.formTopRight} />
          <h2 style={styles.formTitle}>RSVP</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Response</label>
              <select
                name="response"
                value={formData.response}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="yes">I'll be there!</option>
                <option value="no">Sorry, can't make it</option>
                <option value="maybe">Maybe</option>
              </select>
            </div>

            {event.allow_plus_one && (
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="plus_one"
                    checked={formData.plus_one}
                    onChange={handleChange}
                    style={styles.checkbox}
                  />
                  I'll bring a plus one
                </label>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Dietary Preferences</label>
              <textarea
                name="dietary_preferences"
                value={formData.dietary_preferences}
                onChange={handleChange}
                placeholder="Any dietary restrictions or preferences?"
                style={styles.textarea}
              />
            </div>

            <button type="submit" style={styles.submitButton}>
              Submit RSVP
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    background: '#ffffff',
  },
  background: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#faf6f2',
    zIndex: 1,
    '::before': {
      content: '""',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 0c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 80c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zM10 50c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm60 0c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z\' fill=\'%23e8e0d7\' fill-opacity=\'0.3\'/%3E%3C/svg%3E")',
      opacity: 0.2,
    },
  },
  content: {
    position: 'relative' as const,
    zIndex: 2,
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      padding: '1.5rem 1rem',
      gap: '1.5rem',
    },
  },
  eventInfo: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(232, 224, 215, 0.5)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '::before': {
      content: '""',
      position: 'absolute' as const,
      bottom: '0',
      right: '-15px',
      width: '150px',
      height: '150px',
      background: 'url("/images/floral_image.png") center/contain no-repeat',
      opacity: 0.5,
      transform: 'rotate(0deg)',
    },
    '::after': {
      content: '""',
      position: 'absolute' as const,
      bottom: '0',
      left: '-15px',
      width: '150px',
      height: '150px',
      background: 'url("/images/floral_image.png") center/contain no-repeat',
      opacity: 0.5,
      transform: 'rotate(90deg)',
    },
  },
  eventInfoTopRight: {
    position: 'absolute' as const,
    top: '5px',
    right: '-10px',
    width: '150px',
    height: '150px',
    background: 'url("/images/floral_image.png") center/contain no-repeat',
    opacity: 0.5,
    transform: 'rotate(270deg)',
  },
  eventInfoBottomLeft: {
    position: 'absolute' as const,
    bottom: '5px',
    left: '-15px',
    width: '150px',
    height: '150px',
    background: 'url("/images/floral_image.png") center/contain no-repeat',
    opacity: 0.5,
    transform: 'rotate(90deg)',
  },
  title: {
    color: '#2c1810',
    fontSize: '2.5rem',
    marginBottom: '2rem',
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    position: 'relative' as const,
    zIndex: 1,
    '::after': {
      content: '""',
      position: 'absolute' as const,
      bottom: '-0.75rem',
      left: '0',
      width: '50px',
      height: '2px',
      background: 'linear-gradient(90deg, #c7a17a 0%, #b08d6d 100%)',
      borderRadius: '2px',
    },
  },
  details: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  detailItem: {
    color: '#4a3c35',
    fontSize: '1rem',
    lineHeight: '1.5',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    opacity: 0,
    animation: 'fadeIn 0.5s ease forwards',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#2c1810',
    fontSize: '0.85rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  formContainer: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(232, 224, 215, 0.5)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '::before': {
      content: '""',
      position: 'absolute' as const,
      bottom: '0',
      right: '-15px',
      width: '150px',
      height: '150px',
      background: 'url("/images/floral_image.png") center/contain no-repeat',
      opacity: 0.5,
      transform: 'rotate(0deg)',
    },
    '::after': {
      content: '""',
      position: 'absolute' as const,
      bottom: '0',
      left: '-15px',
      width: '150px',
      height: '150px',
      background: 'url("/images/floral_image.png") center/contain no-repeat',
      opacity: 0.5,
      transform: 'rotate(270deg)',
    },
  },
  formTopLeft: {
    position: 'absolute' as const,
    bottom: '5px',
    left: '-15px',
    width: '150px',
    height: '150px',
    background: 'url("/images/floral_image.png") center/contain no-repeat',
    opacity: 0.5,
    transform: 'rotate(90deg)',
  },
  formTopRight: {
    position: 'absolute' as const,
    top: '5px',
    right: '-10px',
    width: '150px',
    height: '150px',
    background: 'url("/images/floral_image.png") center/contain no-repeat',
    opacity: 0.5,
    transform: 'rotate(270deg)',
  },
  formTitle: {
    color: '#2c1810',
    fontSize: '2rem',
    marginBottom: '2rem',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    position: 'relative' as const,
    '::after': {
      content: '""',
      position: 'absolute' as const,
      bottom: '-0.75rem',
      left: '0',
      width: '50px',
      height: '2px',
      background: 'linear-gradient(90deg, #c7a17a 0%, #b08d6d 100%)',
      borderRadius: '2px',
    },
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    opacity: 0,
    animation: 'fadeIn 0.5s ease forwards',
  },
  label: {
    color: '#4a3c35',
    fontSize: '0.9rem',
    fontWeight: '500',
    letterSpacing: '0.02em',
    transition: 'color 0.3s ease',
  },
  input: {
    padding: '0.875rem 1.25rem',
    borderRadius: '10px',
    border: '1px solid rgba(44, 24, 16, 0.1)',
    fontSize: '0.95rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s ease',
    color: '#2c1810',
    '::placeholder': {
      color: 'rgba(44, 24, 16, 0.4)',
    },
    ':focus': {
      outline: 'none',
      borderColor: '#c7a17a',
      boxShadow: '0 0 0 3px rgba(199, 161, 122, 0.1)',
      backgroundColor: 'white',
      transform: 'translateY(-1px)',
    },
  },
  select: {
    padding: '0.875rem 1.25rem',
    borderRadius: '10px',
    border: '1px solid rgba(44, 24, 16, 0.1)',
    fontSize: '0.95rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: '#2c1810',
    ':focus': {
      outline: 'none',
      borderColor: '#c7a17a',
      boxShadow: '0 0 0 3px rgba(199, 161, 122, 0.1)',
      backgroundColor: 'white',
      transform: 'translateY(-1px)',
    },
  },
  textarea: {
    padding: '0.875rem 1.25rem',
    borderRadius: '10px',
    border: '1px solid rgba(44, 24, 16, 0.1)',
    fontSize: '0.95rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    minHeight: '100px',
    resize: 'vertical' as const,
    transition: 'all 0.3s ease',
    color: '#2c1810',
    '::placeholder': {
      color: 'rgba(44, 24, 16, 0.4)',
    },
    ':focus': {
      outline: 'none',
      borderColor: '#c7a17a',
      boxShadow: '0 0 0 3px rgba(199, 161, 122, 0.1)',
      backgroundColor: 'white',
      transform: 'translateY(-1px)',
    },
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#4a3c35',
    fontSize: '0.9rem',
    cursor: 'pointer',
    userSelect: 'none' as const,
    transition: 'color 0.3s ease',
    ':hover': {
      color: '#2c1810',
    },
  },
  checkbox: {
    width: '1.1rem',
    height: '1.1rem',
    cursor: 'pointer',
    accentColor: '#c7a17a',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'scale(1.1)',
    },
  },
  submitButton: {
    padding: '1rem 2rem',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #c7a17a 0%, #b08d6d 100%)',
    color: 'white',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '::before': {
      content: '""',
      position: 'absolute' as const,
      top: '0',
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
      transition: '0.5s',
    },
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(199, 161, 122, 0.2)',
      background: 'linear-gradient(135deg, #b08d6d 0%, #c7a17a 100%)',
      '::before': {
        left: '100%',
      },
    },
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.1rem',
    color: '#4a3c35',
  },
  error: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.1rem',
    color: '#c7a17a',
  },
};

// Add keyframes for animations
const keyframes = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Add the keyframes to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = keyframes;
  document.head.appendChild(style);
}
