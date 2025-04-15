import Link from "next/link";
import { useRouter } from "next/router";

export default function ThankYouPage() {
  const router = useRouter();
  const { response } = router.query;
  const isAttending = response === "yes";

  return (
    <div className="container">
      <div className="thank-you-card">
        {isAttending ? (
          <>
            <h1>🎉 Thank you for your RSVP!</h1>
            <p>We're excited to see you at the event. A confirmation has been recorded.</p>
            <p>If you have any questions, feel free to reach out.</p>
          </>
        ) : (
          <>
            <h1>Thank you for letting us know</h1>
            <p>We're sorry you can't make it, but we appreciate your response.</p>
            <p>If anything changes, feel free to RSVP again or contact us directly.</p>
          </>
        )}
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f0f4f8;
        }

        .thank-you-card {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 20px;
          color: #2c3e50;
        }

        p {
          font-size: 1.1rem;
          color: #555;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
} 