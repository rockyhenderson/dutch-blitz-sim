import React, { useEffect, useMemo, useRef, useState } from "react";

// Simple frontend-only Dutch Blitz-ish simulator (not full rules):
// - 4 players (red, blue, green, yellow)
// - Emits colorful log lines in a sidebar while a round "runs"
// - Random actions occur; some reduce a player's blitz pile
// - First player to clear blitz wins; simulation stops; summary saved to localStorage
// - Click Start to run; shows a spinner while running
// - Nice UI via Tailwind (no external setup needed in this canvas)

const PLAYER_COLORS = [
  { id: "red", label: "Red", cls: "text-red-500", bg: "bg-red-500" },
  { id: "blue", label: "Blue", cls: "text-blue-500", bg: "bg-blue-500" },
  { id: "green", label: "Green", cls: "text-green-600", bg: "bg-green-600" },
  { id: "yellow", label: "Yellow", cls: "text-yellow-500", bg: "bg-yellow-500" },
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nowMs() {
  return Date.now();
}

export default function App() {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState(() =>
    PLAYER_COLORS.map((p) => ({ id: p.id, label: p.label, blitz: 10, points: 0, plays: 0 }))
  );
  const [startedAt, setStartedAt] = useState(null);
  const [endedAt, setEndedAt] = useState(null);
  const ticker = useRef(null);
  const logPaneRef = useRef(null);

  // auto-scroll logs
  useEffect(() => {
    if (logPaneRef.current) {
      logPaneRef.current.scrollTop = logPaneRef.current.scrollHeight;
    }
  }, [logs]);

  const durationMs = useMemo(() => {
    if (!startedAt) return 0;
    return (endedAt ?? nowMs()) - startedAt;
  }, [startedAt, endedAt, running]);

  const reset = () => {
    setLogs([]);
    setWinner(null);
    setStartedAt(null);
    setEndedAt(null);
    setPlayers(PLAYER_COLORS.map((p) => ({ id: p.id, label: p.label, blitz: 10, points: 0, plays: 0 })));
  };

  const saveSummary = (summary) => {
    try {
      const key = "db_runs";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.unshift(summary);
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 50))); // keep last 50
    } catch (e) {
      // ignore
    }
  };

  const start = () => {
    if (running) return;
    reset();
    setRunning(true);
    const started = nowMs();
    setStartedAt(started);

    ticker.current = setInterval(() => {
      // Simulate a "tick" where 1–3 actions may occur
      const actions = 1 + Math.floor(Math.random() * 3);
      setPlayers((prev) => {
        let next = [...prev];
        let localWinner = null;
        for (let i = 0; i < actions; i++) {
          const actorIdx = Math.floor(Math.random() * next.length);
          const actor = next[actorIdx];

          // Pick an action flavor
          const actionType = randomChoice(["play_to_center", "flip_wood", "move_post"]);
          const cardNum = 1 + Math.floor(Math.random() * 10);

          // Effects: plays always increment; sometimes reduce blitz
          const willUseBlitz = actionType === "play_to_center" && Math.random() < 0.35 && actor.blitz > 0;
          const newBlitz = willUseBlitz ? Math.max(0, actor.blitz - 1) : actor.blitz;
          const newPoints = actionType === "play_to_center" ? actor.points + 1 : actor.points;

          next[actorIdx] = {
            ...actor,
            plays: actor.plays + 1,
            points: newPoints,
            blitz: newBlitz,
          };

          // Log line
          const playerDef = PLAYER_COLORS.find((p) => p.id === actor.id);
          const verb =
            actionType === "play_to_center"
              ? `played ${cardNum} to center${willUseBlitz ? " (from Blitz)" : ""}`
              : actionType === "flip_wood"
              ? "cycled wood pile"
              : "rearranged post pile";

          setLogs((L) => [
            ...L,
            {
              t: nowMs() - started,
              player: actor.id,
              text: `${actor.label} ${verb}`,
            },
          ]);

          if (newBlitz === 0) {
            localWinner = actor.id;
            break; // winner found; stop additional actions this tick
          }
        }

        if (localWinner) {
          // stop outside of setPlayers to avoid state race
          setTimeout(() => stop(localWinner), 0);
        }

        return next;
      });
    }, 140); // ~7 actions/sec avg
  };

  const stop = (winnerId) => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
    setRunning(false);
    setEndedAt(nowMs());

    const w = PLAYER_COLORS.find((p) => p.id === winnerId) || null;
    setWinner(w);

    // Save summary locally
    const summary = {
      ts: new Date().toISOString(),
      durationMs: (nowMs() - (startedAt ?? nowMs())),
      winner: w?.label ?? null,
      players: players.map((p) => ({ id: p.id, label: p.label, plays: p.plays, points: p.points, blitz: p.blitz })),
      totalEvents: logs.length,
    };
    saveSummary(summary);
  };

  useEffect(() => () => ticker.current && clearInterval(ticker.current), []);

  const PrettyStat = ({ label, value }) => (
    <div className="flex flex-col items-start bg-white/70 dark:bg-neutral-900/70 rounded-2xl p-4 shadow">
      <span className="text-xs uppercase tracking-wider text-neutral-500">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-neutral-900 dark:to-neutral-800 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white" />
          <h1 className="text-2xl font-bold">Dutch Blitz – Mini Sim</h1>
        </div>
        <div className="flex items-center gap-2">
          {!running && !winner && (
            <button onClick={start} className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition">
              ▶ Start Simulation
            </button>
          )}
          {running && (
            <button onClick={() => stop(null)} className="px-4 py-2 rounded-xl bg-amber-500 text-black hover:opacity-90 transition">
              ⏸ Stop
            </button>
          )}
          {!running && (
            <button onClick={reset} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-neutral-700 hover:opacity-90 transition">
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Status & Metrics */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status card */}
          <div className="relative rounded-3xl p-6 bg-white/80 dark:bg-neutral-900/80 shadow">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-neutral-500">Round Status</div>
                <div className="text-3xl font-bold">
                  {running ? "Running…" : winner ? `${winner.label} wins!` : "Idle"}
                </div>
              </div>
              {running && (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-slate-400 rounded-full border-t-transparent animate-spin" />
                  <span className="text-sm text-neutral-500">Simulating</span>
                </div>
              )}
            </div>

            {/* Winner ribbon */}
            {winner && (
              <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full ${PLAYER_COLORS.find(p=>p.id===winner.id)?.bg} text-white font-medium`}>
                🏆 {winner.label} cleared Blitz first
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <PrettyStat label="Duration" value={`${Math.floor(durationMs / 1000)}s`} />
              <PrettyStat label="Total Events" value={logs.length} />
              {players.map((p) => (
                <div key={p.id} className="flex flex-col items-start bg-white/70 dark:bg-neutral-900/70 rounded-2xl p-4 shadow">
                  <span className="text-xs uppercase tracking-wider text-neutral-500">{p.label}</span>
                  <div className="text-sm flex items-center gap-3 mt-1">
                    <span className="font-semibold">Plays: {p.plays}</span>
                    <span className="opacity-70">Pts: {p.points}</span>
                    <span className="opacity-70">Blitz: {p.blitz}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved summaries */}
          <div className="rounded-3xl p-6 bg-white/80 dark:bg-neutral-900/80 shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Saved Summaries (local)</h2>
              <button
                className="text-sm px-3 py-1 rounded-lg bg-slate-200 dark:bg-neutral-700 hover:opacity-90"
                onClick={() => {
                  localStorage.removeItem("db_runs");
                  window.location.reload();
                }}
              >
                Clear
              </button>
            </div>
            <SummariesList />
          </div>
        </div>

        {/* Right: Log sidebar */}
        <div className="rounded-3xl p-0 bg-white/80 dark:bg-neutral-900/80 shadow flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <h2 className="font-semibold">Event Log</h2>
            <span className="text-xs text-neutral-500">{logs.length} lines</span>
          </div>
          <div ref={logPaneRef} className="p-4 h-[520px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-sm text-neutral-500">Click <span className="font-medium">Start Simulation</span> to begin. Logs will appear here in the player's color.</div>
            ) : (
              <ul className="space-y-2">
                {logs.map((l, idx) => {
                  const p = PLAYER_COLORS.find((pc) => pc.id === l.player);
                  return (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-neutral-400 tabular-nums w-16">{(l.t / 1000).toFixed(2)}s</span>
                      <span className={`${p?.cls ?? ""} font-medium`}>{l.text}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <footer className="py-8 text-center text-xs text-neutral-500">Frontend-only prototype · data saved to localStorage · replace with backend later</footer>
    </div>
  );
}

function SummariesList() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const key = "db_runs";
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      setItems(data);
    } catch (e) {
      setItems([]);
    }
  }, []);

  if (!items?.length) {
    return <div className="text-sm text-neutral-500">No runs yet.</div>;
  }
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="border border-black/5 dark:border-white/10 rounded-xl p-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Winner: {it.winner ?? "(none)"}</div>
            <div className="text-neutral-500">{new Date(it.ts).toLocaleString()}</div>
          </div>
          <div className="mt-1 text-neutral-600 dark:text-neutral-300">Duration: {(it.durationMs / 1000).toFixed(1)}s · Events: {it.totalEvents}</div>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            {it.players?.map((p) => (
              <div key={p.id} className="px-2 py-1 rounded-lg bg-white/70 dark:bg-neutral-800/70">
                <div className="text-xs uppercase tracking-wide text-neutral-500">{p.label}</div>
                <div className="text-xs">Plays {p.plays} · Pts {p.points} · Blitz {p.blitz}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
