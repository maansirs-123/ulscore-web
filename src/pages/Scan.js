import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, UserRound, Footprints } from "lucide-react";

const PI_API = "http://172.20.10.2:5000";

export default function Scan() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [patientName, setPatientName] = useState("");
  const [footSide, setFootSide] = useState("");
  const navigate = useNavigate();

  async function startScan() {
    if (!patientName.trim()) {
      setStatus("Please enter the patient's name.");
      return;
    }

    if (!footSide) {
      setStatus("Please select Left or Right foot.");
      return;
    }

    setLoading(true);
    setStatus("Capturing image and running wound analysis...");

    try {
      const response = await fetch(`${PI_API}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          foot_side: footSide,
        }),
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
            Place one foot above the purple line, enter scan details, then start.
          </p>

          <div className="scan-form-card">
            <label className="scan-field">
              <span>
                <UserRound size={17} strokeWidth={2.6} />
                Patient Name
              </span>

              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter name"
                disabled={loading}
              />
            </label>

            <div className="scan-field">
              <span>
                <Footprints size={17} strokeWidth={2.6} />
                Foot Being Scanned
              </span>

              <div className="foot-toggle">
                <button
                  type="button"
                  className={footSide === "Left" ? "active" : ""}
                  onClick={() => setFootSide("Left")}
                  disabled={loading}
                >
                  Left
                </button>

                <button
                  type="button"
                  className={footSide === "Right" ? "active" : ""}
                  onClick={() => setFootSide("Right")}
                  disabled={loading}
                >
                  Right
                </button>
              </div>
            </div>
          </div>

          <div className="camera-circle">
            <div className={`camera-icon ${loading ? "scanning" : ""}`}>
              <Camera size={64} strokeWidth={2.2} />
            </div>
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
            ⓘ Wait until LED turns green to step down.
          </p>
        </section>
      </section>
    </main>
  );
}