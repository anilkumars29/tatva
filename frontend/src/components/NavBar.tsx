// components/NavBar.tsx
import { Link, useLocation } from "react-router-dom";

const TatvaLogo = () => (
  <Link to="/" className="flex items-center gap-2.5 select-none">
    {/* Minimal SVG logo mark matching the Stitch brand icon */}
    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2L14 7L9 12L4 7L9 2Z" fill="white" fillOpacity="0.9" />
        <path d="M9 7L14 12L9 17L4 12L9 7Z" fill="white" fillOpacity="0.5" />
      </svg>
    </div>
    <span className="font-semibold text-title-md text-neutral tracking-tight">Tatva</span>
  </Link>
);

export function NavBar() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <TatvaLogo />

        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded text-label-md font-medium transition-colors ${
              pathname === "/" ? "bg-primary/10 text-primary" : "text-neutral/60 hover:text-neutral hover:bg-surface-container-low"
            }`}
          >
            Workspace
          </Link>
          <Link
            to="/start"
            className={`px-3 py-1.5 rounded text-label-md font-medium transition-colors ${
              pathname === "/start" ? "bg-primary/10 text-primary" : "text-neutral/60 hover:text-neutral hover:bg-surface-container-low"
            }`}
          >
            New Session
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <span className="text-label-sm font-bold text-primary">T</span>
          </div>
        </div>
      </div>
    </header>
  );
}
