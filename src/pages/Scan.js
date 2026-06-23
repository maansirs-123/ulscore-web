import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PI_API = "http://YOUR_RASPBERRY_PI_IP:5000";

export default function Scan() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  async function startScan() {
    setLoading(true);
    setStatus("Capturing image and running wound analysis...");

    try {
      const response = await fetch(`${PI_API}/scan`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Scan failed");
      }

      navigate(`/results/${data.scan_id}`);
    } catch (error) {
      setStatus("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-page">
      <section className="phone-card">
        <img src="/ulscore-logo.png" alt="ULScore" className="logo" />

        <div className="gradient-wave" />

        <section className="content-card">
          <div className="badge">SCAN</div>

          <h1>Ready to Scan</h1>

          <p className="subtitle">
            Place the wound in view and start the scan.
          </p>

          <div className="camera-circle">
            <div className="camera-icon">📷</div>
          </div>

          <button
            className="primary-button"
            onClick={startScan}
            disabled={loading}
          >
            {loading ? "Scanning..." : "Start Scan"} <span>›</span>
          </button>

          {status && <p className="status-text">{status}</p>}

          <div className="divider" />

          <p className="helper-text">
            ⓘ Ensure good lighting and steady positioning for best results.
          </p>
        </section>
      </section>
    </main>
  );
}