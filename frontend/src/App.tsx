// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { WorkspacePage } from "./pages/WorkspacePage";
import { StartSessionPage } from "./pages/StartSessionPage";
import { LiveStudioPage } from "./pages/LiveStudioPage";
import { DistillingPage } from "./pages/DistillingPage";
import { KnowledgeCanvasPage } from "./pages/KnowledgeCanvasPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface font-sans text-neutral flex flex-col">
        <NavBar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<WorkspacePage />} />
            <Route path="/start" element={<StartSessionPage />} />
            <Route path="/live/:id" element={<LiveStudioPage />} />
            <Route path="/distilling/:id" element={<DistillingPage />} />
            <Route path="/canvas/:id" element={<KnowledgeCanvasPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
