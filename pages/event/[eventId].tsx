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

export default function RSVPPage() {
  const router = useRouter();
  const { eventId } = router.query;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
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
      alert("RSVP submitted! Thank you.");
      router.push(`/thank-you?response=${formData.response}`);
    }
  };

  if (loading) return <div className="loading">Loading event...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!event) return <div className="error">Event not found.</div>;

  return (
    <div className="container">
      <div className="event-details">
        <h1>{event.title}</h1>
        <p><strong>Date & Time:</strong> {new Date(event.date_time).toLocaleString()}</p>
        <p><strong>Location:</strong> {event.location}</p>
        <p><strong>Description:</strong> {event.description}</p>
        <p><strong>+1 Allowed:</strong> {event.allow_plus_one ? "Yes" : "No"}</p>
      </div>

      <div className="rsvp-form-container">
        <h2>RSVP</h2>
        <form onSubmit={handleSubmit} className="rsvp-form">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <select name="response" value={formData.response} onChange={handleChange}>
            <option value="yes">Yes, I'm attending</option>
            <option value="no">No, I can't make it</option>
          </select>

          {event.allow_plus_one && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="plus_one"
                checked={formData.plus_one}
                onChange={handleChange}
              />
              Bringing a +1
            </label>
          )}

          <input
            type="text"
            name="dietary_preferences"
            placeholder="Any dietary preferences?"
            value={formData.dietary_preferences}
            onChange={handleChange}
          />

          <button type="submit">Submit RSVP</button>
        </form>
      </div>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .loading,
        .error {
          text-align: center;
          padding: 2rem;
          font-size: 1.2rem;
          color: #666;
        }

        .error {
          color: #dc3545;
          background: #fff5f5;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1rem;
        }

        .event-details {
          background: #f8f8f8;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .event-details h1 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .event-details p {
          margin: 10px 0;
          color: #666;
        }

        .rsvp-form-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .rsvp-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .rsvp-form input,
        .rsvp-form select {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 10px 0;
        }

        button {
          padding: 12px 20px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }

        button:hover {
          background: #0051a2;
        }
      `}</style>
    </div>
  );
}
