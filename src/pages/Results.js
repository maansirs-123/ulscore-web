import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PI_API = "http://192.168.137.2:5000";

export default function Results() {
  const { scanId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch(`${PI_API}/results/${scanId}`);
        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || "Could not load results");
        }

        setResult(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchResults();
  }, [scanId]);

  if (error) {
    return (
      <main className="app-page">
        <section className="phone-card">
          <img src="/ulscore-logo.png" alt="ULScore" className="logo" />

          <section className="content-card">
            <h1>Could not load results</h1>
            <p className="status-text error">{error}</p>

            <button className="primary-button" onClick={() => navigate("/scan")}>
              Back to Scan
            </button>
          </section>
        </section>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="app-page">
        <section className="phone-card">
          <img src="/ulscore-logo.png" alt="ULScore" className="logo" />

          <section className="content-card">
            <h1>Loading Results...</h1>
            <p className="status-text">Fetching scan {scanId}</p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <section className="phone-card">
        <img src="/ulscore-logo.png" alt="ULScore" className="logo" />

        <div className="gradient-wave" />

        <section className="content-card">
          <div className="badge">SCAN RESULT</div>

          <h1>Wound Image</h1>

          <img
            src={result.boxed_image_url}
            alt="Boxed wound result"
            className="result-image"
          />

          <section className="result-panel">
            <h2>{result.classification}</h2>

            <div className="metric-row highlight">
              <span>Ulcer Area</span>
              <strong>{Number(result.segmentation_area_mm2).toFixed(2)} mm²</strong>
            </div>

            <div className="metric-row">
              <span>Segmentation Pixels</span>
              <strong>{result.segmentation_pixel_count}</strong>
            </div>

            <div className="thin-divider" />

            <div className="metric-row">
              <span>Necrosis</span>
              <strong>{(result.necrosis_ratio * 100).toFixed(2)}%</strong>
            </div>

            <div className="metric-row">
              <span>Slough</span>
              <strong>{(result.slough_ratio * 100).toFixed(2)}%</strong>
            </div>

            <div className="metric-row">
              <span>Granulation</span>
              <strong>{(result.granulation_ratio * 100).toFixed(2)}%</strong>
            </div>
          </section>

          <p className="scan-id">Scan ID: {scanId}</p>

          <button className="primary-button" onClick={() => navigate("/scan")}>
            📷 New Scan
          </button>
        </section>
      </section>
    </main>
  );
}