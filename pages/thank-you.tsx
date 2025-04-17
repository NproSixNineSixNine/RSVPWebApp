/**
 * Thank You Page Component
 * 
 * This page displays a confirmation message after a user submits their RSVP.
 * Features:
 * - Dynamic content based on RSVP response (attending/not attending)
 * - Responsive design with decorative elements
 * - Clean and elegant UI with subtle animations
 */

import { useRouter } from "next/router";

// Type definitions for better type safety
interface ThankYouPageProps {
  response?: string;
}

export default function ThankYouPage() {
  // Router instance for navigation and query parameters
  const router = useRouter();
  const { response } = router.query as ThankYouPageProps;
  
  // Determine if user is attending based on response
  const isAttending = response === "yes";

  return (
    <div style={styles.container}>
      {/* Background with decorative pattern */}
      <div style={styles.background} />
      
      {/* Main content container */}
      <div style={styles.content}>
        {/* Thank you card with decorative elements */}
        <div style={styles.card}>
          {/* Decorative elements */}
          <div style={styles.cardTopRight} />
          <div style={styles.cardBottomLeft} />
          
          {/* Dynamic content based on RSVP response */}
          {isAttending ? (
            // Content for attending guests
            <>
              <h1 style={styles.title}>🎉 Thank you for your RSVP!</h1>
              <p style={styles.message}>
                We're excited to see you at the event. A confirmation has been recorded.
              </p>
              <p style={styles.message}>
                If you have any questions, feel free to reach out.
              </p>
            </>
          ) : (
            // Content for non-attending guests
            <>
              <h1 style={styles.title}>Thank you for letting us know</h1>
              <p style={styles.message}>
                We're sorry you can't make it, but we appreciate your response.
              </p>
              <p style={styles.message}>
                If anything changes, feel free to RSVP again or contact us directly.
              </p>
            </>
          )}
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
    '@media (min-width: 640px)': {
      padding: '2rem',
    },
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

  // Content
  content: {
    position: 'relative' as const,
    zIndex: 2,
    maxWidth: '1000px',
    width: '100%',
    margin: '0 auto',
    padding: '1rem',
    '@media (min-width: 768px)': {
      padding: '2rem',
    },
  },

  // Card
  card: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(232, 224, 215, 0.5)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    width: '100%',
    textAlign: 'center' as const,
    '@media (min-width: 768px)': {
      padding: '2rem',
    },
  },

  // Decorative Elements
  cardTopRight: {
    position: 'absolute' as const,
    top: '5px',
    right: '-10px',
    width: '100px',
    height: '100px',
    background: 'url("/images/floral_image.png") center/contain no-repeat',
    opacity: 0.5,
    transform: 'rotate(270deg)',
    '@media (min-width: 768px)': {
      width: '150px',
      height: '150px',
    },
  },
  cardBottomLeft: {
    position: 'absolute' as const,
    bottom: '5px',
    left: '-15px',
    width: '100px',
    height: '100px',
    background: 'url("/images/floral_image.png") center/contain no-repeat',
    opacity: 0.5,
    transform: 'rotate(90deg)',
    '@media (min-width: 768px)': {
      width: '150px',
      height: '150px',
    },
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
  message: {
    color: '#4a3c35',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    marginBottom: '1rem',
    position: 'relative' as const,
    zIndex: 1,
    '@media (min-width: 768px)': {
      fontSize: '1rem',
      marginBottom: '1.25rem',
    },
  },
}; 