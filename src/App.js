import { Routes, Route, Navigate } from "react-router-dom";
import Scan from "./pages/Scan";
import Results from "./pages/Results";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/scan" replace />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/results/:scanId" element={<Results />} />
    </Routes>
  );
}