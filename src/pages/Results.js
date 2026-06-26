import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PI_API = "http://172.20.10.2:5000";

function calculateModifiedSinbad(result) {
  const ulcerRegion = (result.ulcer_location || "").toLowerCase();

  const necrosisPct = Number(result.necrosis_ratio || 0) * 100;
  const sloughPct = Number(result.slough_ratio || 0) * 100;
  const granulationPct = Number(result.granulation_ratio || 0) * 100;

  const areaMm2 = Number(result.segmentation_area_mm2 || 0);
  const areaCm2 = areaMm2 / 100;

  let score = 0;

  const siteScore =
    ulcerRegion.includes("midfoot") || ulcerRegion.includes("hindfoot") ? 1 : 0;

  const ischemiaScore = necrosisPct > 0 ? 1 : 0;

  let bacterialScore = 0;
  if (sloughPct > granulationPct) {
    bacterialScore = 1;
  } else if (granulationPct > sloughPct) {
    bacterialScore = 0.5;
  }

  const areaScore = areaCm2 >= 1 ? 1 : 0;

  score = siteScore + ischemiaScore + bacterialScore + areaScore;

  let riskLabel = "No Risk";
  let riskDescription = "No major risk indicators detected.";

  if (score > 0 && score <= 1) {
    riskLabel = "Low Risk";
    riskDescription = "Likely to heal with basic care.";
  } else if (score > 1 && score <= 2.5) {
    riskLabel = "Moderate Risk";
    riskDescription = "Needs active wound management.";
  } else if (score > 2.5) {
    riskLabel = "High Risk";
    riskDescription = "Requires debridement/specialist care.";
  }

  return {
    score,
    maxScore: 4,
    siteScore,
    ischemiaScore,
    bacterialScore,
    areaScore,
    riskLabel,
    riskDescription,
    areaCm2,
  };
}

function RiskGauge({ score, maxScore, riskLabel }) {
  const percent = Math.min(score / maxScore, 1);
  const angle = -90 + percent * 180;

  return (
    <div className="risk-gauge-card">
      <svg viewBox="0 0 320 210" className="risk-gauge">
        <path
          d="M 55 160 A 105 105 0 0 1 265 160"
          fill="none"
          stroke="#eef0f4"
          strokeWidth="34"
          strokeLinecap="round"
        />

        <path
          d="M 55 160 A 105 105 0 0 1 107 69"
          fill="none"
          stroke="#37d66f"
          strokeWidth="34"
        />

        <path
          d="M 107 69 A 105 105 0 0 1 160 55"
          fill="none"
          stroke="#ffd84d"
          strokeWidth="34"
        />

        <path
          d="M 160 55 A 105 105 0 0 1 213 69"
          fill="none"
          stroke="#ffa02b"
          strokeWidth="34"
        />

        <path
          d="M 213 69 A 105 105 0 0 1 265 160"
          fill="none"
          stroke="#ff3364"
          strokeWidth="34"
          strokeLinecap="round"
        />

        <g transform={`rotate(${angle} 160 160)`}>
          <line
            x1="160"
            y1="160"
            x2="160"
            y2="78"
            stroke="#112b5c"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </g>

        <circle cx="160" cy="160" r="17" fill="#112b5c" />
        <circle cx="160" cy="160" r="8" fill="white" />

        <text x="55" y="197" className="gauge-label" textAnchor="middle">
          No Risk
        </text>
        <text x="108" y="42" className="gauge-label" textAnchor="middle">
          Low
        </text>
        <text x="160" y="30" className="gauge-label" textAnchor="middle">
          Moderate
        </text>
        <text x="232" y="42" className="gauge-label" textAnchor="middle">
          High
        </text>
      </svg>

      <div className="risk-summary">
        <h3>{riskLabel}</h3>
        <div className="score-number">
          {score.toFixed(1)} / {maxScore}
        </div>
      </div>
    </div>
  );
}

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

  const sinbad = calculateModifiedSinbad(result);

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
            <h2>Modified SINBAD Risk Score</h2>

            <RiskGauge
              score={sinbad.score}
              maxScore={sinbad.maxScore}
              riskLabel={sinbad.riskLabel}
            />

            <p className="risk-description">{sinbad.riskDescription}</p>

            <div className="metric-row highlight">
              <span>Total Score</span>
              <strong>{sinbad.score.toFixed(1)} / {sinbad.maxScore}</strong>
            </div>

            <div className="thin-divider" />

            <div className="metric-row">
              <span>Site</span>
              <strong>{sinbad.siteScore}</strong>
            </div>

            <div className="metric-row">
              <span>Ischemia</span>
              <strong>{sinbad.ischemiaScore}</strong>
            </div>

            <div className="metric-row">
              <span>Bacterial Infection</span>
              <strong>{sinbad.bacterialScore}</strong>
            </div>

            <div className="metric-row">
              <span>Area</span>
              <strong>{sinbad.areaScore}</strong>
            </div>

            <div className="thin-divider" />

            <div className="metric-row highlight">
              <span>Ulcer Region</span>
              <strong>{result.ulcer_location || "Not detected"}</strong>
            </div>

            <div className="metric-row highlight">
              <span>Ulcer Area</span>
              <strong>
                {Number(result.segmentation_area_mm2).toFixed(2)} mm²
              </strong>
            </div>

            <div className="metric-row">
              <span>Area in cm²</span>
              <strong>{sinbad.areaCm2.toFixed(2)} cm²</strong>
            </div>

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