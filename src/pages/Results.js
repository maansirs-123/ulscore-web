import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ClipboardList,
  HeartPulse,
  Info,
  Camera,
} from "lucide-react";

const PI_API = "http://172.20.10.2:5000";

function hasUlcer(result) {
  return (
    Number(result.segmentation_pixel_count || 0) > 0 &&
    Number(result.segmentation_area_mm2 || 0) > 0
  );
}

function calculateModifiedSinbad(result) {
  const ulcerRegion = (result.ulcer_location || "").toLowerCase();

  const necrosisPct = Number(result.necrosis_ratio || 0) * 100;
  const sloughPct = Number(result.slough_ratio || 0) * 100;
  const granulationPct = Number(result.granulation_ratio || 0) * 100;

  const areaMm2 = Number(result.segmentation_area_mm2 || 0);
  const areaCm2 = areaMm2 / 100;

  if (!hasUlcer(result)) {
    return {
      score: 0,
      maxScore: 4,
      siteScore: 0,
      ischemiaScore: 0,
      bacterialScore: 0,
      areaScore: 0,
      riskLabel: "No Risk",
      riskDescription: "No ulcer detected.",
      areaCm2,
      necrosisPct,
      sloughPct,
      granulationPct,
    };
  }

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

  const score = siteScore + ischemiaScore + bacterialScore + areaScore;

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
    necrosisPct,
    sloughPct,
    granulationPct,
  };
}

function getRecommendation(result) {
  if (!hasUlcer(result)) return null;

  const necrosis = Number(result.necrosis_ratio || 0) * 100;
  const slough = Number(result.slough_ratio || 0) * 100;
  const granulation = Number(result.granulation_ratio || 0) * 100;

  if (necrosis > 0) {
    return {
      tissue: "Necrotic tissue",
      priority: "High-priority wound care review recommended.",
      color: "black",
      items: [
        {
          title: "Therapeutic Goal",
          text: "Remove devitalized tissue. Do not attempt debridement if vascular insufficiency is suspected. Keep dry and refer for vascular assessment.",
        },
        {
          title: "Role of Dressing",
          text: "Hydrate the wound bed and promote autolytic debridement.",
        },
        {
          title: "Wound Bed Preparation",
          text: "Surgical or mechanical debridement if clinically appropriate.",
        },
        {
          title: "Primary Dressing",
          text: "Hydrogel or honey.",
        },
        {
          title: "Secondary Dressing",
          text: "Polyurethane film dressing.",
        },
      ],
    };
  }

  if (slough > granulation && slough > 0) {
    return {
      tissue: "Sloughy wound bed",
      priority: "Focus on slough removal and moisture balance.",
      color: "yellow",
      items: [
        {
          title: "Therapeutic Goal",
          text: "Remove slough and provide a clean wound bed for granulation tissue.",
        },
        {
          title: "Role of Dressing",
          text: "Rehydrate the wound bed, control moisture balance, and promote autolytic debridement.",
        },
        {
          title: "Wound Bed Preparation",
          text: "Wound cleansing. Consider surgical or mechanical debridement if appropriate.",
        },
        {
          title: "Primary Dressing",
          text: "Hydrogel, honey, or absorbent dressing depending on exudate.",
        },
        {
          title: "Secondary Dressing",
          text: "Polyurethane film dressing, low-adherent silicone dressing, or retention bandage.",
        },
      ],
    };
  }

  if (granulation > 0) {
    return {
      tissue: "Granulating wound bed",
      priority: "Protect healthy tissue and support epithelialization.",
      color: "red",
      items: [
        {
          title: "Therapeutic Goal",
          text: "Promote granulation and provide a healthy wound bed for epithelialization.",
        },
        {
          title: "Role of Dressing",
          text: "Maintain moisture balance and protect new tissue growth.",
        },
        {
          title: "Wound Bed Preparation",
          text: "Wound cleansing. Consider barrier products if exudate is high.",
        },
        {
          title: "Primary Dressing",
          text: "Hydrogel, low-adherent silicone dressing, or absorbent dressing if exudate is high.",
        },
        {
          title: "Secondary Dressing",
          text: "Pad and/or retention bandage. Avoid overly occlusive dressings.",
        },
      ],
    };
  }

  return null;
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

function BreakdownItem({ title, score, active, rationale }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className={`breakdown-item ${active ? "active" : ""}`}>
      <div className="breakdown-top">
        <div className="breakdown-title-wrap">
          <span>{title}</span>

          {active && (
            <button
              type="button"
              className="info-button"
              onClick={() => setShowInfo(!showInfo)}
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              aria-label={`Show ${title} explanation`}
            >
              <Info size={17} strokeWidth={2.6} />
            </button>
          )}
        </div>

        <strong>{score}</strong>
      </div>

      {!active && (
        <p className="muted">No risk point added for this category.</p>
      )}

      {active && showInfo && (
        <div className="info-popover">
          {rationale}
        </div>
      )}
    </div>
  );
}

export default function Results() {
  const { scanId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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
  const rec = getRecommendation(result);

  return (
    <main className="app-page">
      <section className="phone-card">
        <img src="/ulscore-logo.png" alt="ULScore" className="logo" />

        <div className="gradient-wave" />

        <section className="content-card">
          <div className="badge">SCAN RESULT</div>


          <div className="result-tabs">
          {[
            ["overview", "Score", Activity],
            ["breakdown", "Breakdown", ClipboardList],
            ["maintenance", "Care", HeartPulse],
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              className={`result-tab ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={17} strokeWidth={2.6} />
              <span>{label}</span>
            </button>
          ))}
        </div>

          {activeTab === "overview" && (
            <>
              <h1>Wound Image</h1>

              {hasUlcer(result) && (
                <img
                  src={result.boxed_image_url}
                  alt="Boxed wound result"
                  className="result-image"
                />
              )}

              {!hasUlcer(result) && (
                <div className="empty-care-card">
                  <h3>No ulcer detected</h3>
                  <p>No wound box or care recommendation was generated.</p>
                </div>
              )}

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
                  <strong>
                    {sinbad.score.toFixed(1)} / {sinbad.maxScore}
                  </strong>
                </div>
              </section>
            </>
          )}

          {activeTab === "breakdown" && (
            <section className="result-panel">
              <h2>Score Breakdown</h2>

              <div className="breakdown-grid">
                <BreakdownItem
                  title="Site"
                  score={sinbad.siteScore}
                  active={sinbad.siteScore > 0}
                  rationale="Midfoot or hindfoot ulcers often have worse perfusion and slower healing."
                />

                <BreakdownItem
                  title="Ischemia"
                  score={sinbad.ischemiaScore}
                  active={sinbad.ischemiaScore > 0}
                  rationale="Necrosis is a red flag because tissue death can indicate poor blood flow."
                />

                <BreakdownItem
                  title="Bacteria"
                  score={sinbad.bacterialScore}
                  active={sinbad.bacterialScore > 0}
                  rationale="Bacteria can prolong inflammation and slow wound healing."
                />

                <BreakdownItem
                  title="Area"
                  score={sinbad.areaScore}
                  active={sinbad.areaScore > 0}
                  rationale="Wound area is larger than or equal to 1 cm²."
                />
              </div>

              <div className="metric-summary-card">
                <div className="metric-row highlight">
                  <span>Ulcer Region</span>
                  <strong>{result.ulcer_location || "Not detected"}</strong>
                </div>

                <div className="metric-row highlight">
                  <span>Ulcer Area</span>
                  <strong>
                    {Number(result.segmentation_area_mm2 || 0).toFixed(2)} mm²
                  </strong>
                </div>

                <div className="metric-row">
                  <span>Area in cm²</span>
                  <strong>{sinbad.areaCm2.toFixed(2)} cm²</strong>
                </div>

                <div className="metric-row">
                  <span>Necrosis</span>
                  <strong>{sinbad.necrosisPct.toFixed(2)}%</strong>
                </div>

                <div className="metric-row">
                  <span>Slough</span>
                  <strong>{sinbad.sloughPct.toFixed(2)}%</strong>
                </div>

                <div className="metric-row">
                  <span>Granulation</span>
                  <strong>{sinbad.granulationPct.toFixed(2)}%</strong>
                </div>
              </div>
            </section>
          )}

          {activeTab === "maintenance" && (
            <section className="result-panel">
              <h2>Care Recommendation</h2>

              {!rec ? (
                <div className="empty-care-card">
                  <h3>No ulcer detected</h3>
                  <p>
                    No wound-care recommendation is generated because no ulcer
                    was detected.
                  </p>
                </div>
              ) : (
                <div className="care-card">
                  <div className={`care-banner ${rec.color}`}>
                    <span>Dominant Tissue</span>
                    <strong>{rec.tissue}</strong>
                    <p>{rec.priority}</p>
                  </div>

                  <div className="care-list">
                    {rec.items.map((item) => (
                      <div className="care-item" key={item.title}>
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <p className="scan-id">Scan ID: {scanId}</p>
          <button className="primary-button new-scan-button" onClick={() => navigate("/scan")}>
          <Camera size={21} strokeWidth={2.8} />
          <span>New Scan</span>
        </button>
        </section>
      </section>
    </main>
  );
}