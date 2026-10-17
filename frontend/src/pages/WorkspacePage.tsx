// pages/WorkspacePage.tsx — Screen 1: Tatva Workspace
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Session } from "../api/client";

export function WorkspacePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await api.listSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const createDemoSession = async () => {
    try {
      const s = await api.createSession({
        title: "Introduction to Voice AI Architecture & Latency Optimization",
        mode: "lesson",
        language: "en",
        speakers: ["Dr. Evelyn Vance"],
      });
      navigate(`/live/${s.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesFilter = filter === "all" || s.mode === filter;
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getModeBadgeClass = (mode: string) => {
    switch (mode) {
      case "lesson":
        return "bg-primary/10 text-primary-dark";
      case "speech":
        return "bg-tertiary-container text-tertiary-dark";
      case "debate":
        return "bg-error/10 text-error";
      case "discussion":
        return "bg-secondary/15 text-secondary-dark";
      default:
        return "bg-surface-container text-neutral";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary-dark">Complete</span>;
      case "recording":
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-error/15 text-error animate-pulse">● Live</span>;
      case "analysing":
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary animate-pulse">⚡ Distilling</span>;
      default:
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-neutral/70">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <section className="bg-white border-b border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-label-sm font-semibold mb-1">
              <span>🎙️ Voice-First Knowledge Studio</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Bangalore 2026</span>
            </div>
            <h1 className="text-headline-lg font-bold text-neutral tracking-tight">
              Spoken Knowledge, Structurally Preserved.
            </h1>
            <p className="text-body-lg text-neutral/70 leading-relaxed">
              Capture lectures, debates, and rehearsals in real time with SLNG STT.
              When you stop speaking, Tatva instantly extracts objectives, concept maps, and quizzes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/start"
              className="btn-primary text-center justify-center text-label-md py-3 px-6 shadow-md"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Session</span>
            </Link>

            <button
              onClick={createDemoSession}
              className="btn-secondary text-center justify-center text-label-md py-3 px-5"
            >
              <span>⚡ Quick Demo</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Workspace Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["all", "lesson", "speech", "debate", "discussion"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-full text-label-sm font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  filter === tab
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-neutral/70 border border-border hover:bg-surface-container-low"
                }`}
              >
                {tab === "all" ? "All Sessions" : `${tab}s`}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <input
              type="text"
              placeholder="Search sessions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-body-sm text-neutral focus:outline-none focus:border-primary shadow-sm"
            />
            <svg
              className="absolute left-3 top-2.5 text-neutral/40"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card p-6 space-y-4">
                <div className="h-5 w-24 skeleton rounded" />
                <div className="h-6 w-3/4 skeleton rounded" />
                <div className="h-12 w-full skeleton rounded" />
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="card p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary text-3xl flex items-center justify-center mx-auto">
              🎙️
            </div>
            <div>
              <h3 className="font-bold text-headline-sm text-neutral">No Voice Sessions Yet</h3>
              <p className="text-body-sm text-neutral/60 mt-1">
                Start your first session to capture spoken ideas into interactive knowledge cards, or launch a quick demo.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Link to="/start" className="btn-primary text-sm py-2 px-4">
                Start a Session
              </Link>
              <button onClick={createDemoSession} className="btn-secondary text-sm py-2 px-4">
                Launch Quick Demo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((s) => {
              const targetUrl =
                s.status === "recording"
                  ? `/live/${s.id}`
                  : s.status === "analysing"
                  ? `/distilling/${s.id}`
                  : `/canvas/${s.id}`;

              return (
                <Link
                  key={s.id}
                  to={targetUrl}
                  className="card p-6 flex flex-col justify-between hover:shadow-level-3 hover:border-primary/40 transition-all group cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded ${getModeBadgeClass(s.mode)}`}>
                        {s.mode}
                      </span>
                      {getStatusBadge(s.status)}
                    </div>

                    <h3 className="font-semibold text-title-md text-neutral group-hover:text-primary transition-colors line-clamp-2">
                      {s.title}
                    </h3>
                  </div>

                  <div className="pt-6 border-t border-border/70 mt-6 flex items-center justify-between text-xs text-neutral/60">
                    <div className="flex items-center gap-2">
                      <span>📅 {new Date(s.created_at).toLocaleDateString()}</span>
                      {s.duration_s && (
                        <span>• ⏱️ {Math.round(s.duration_s / 60)}m</span>
                      )}
                    </div>
                    <span className="font-semibold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Open →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
