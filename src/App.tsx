import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, useLocation, useNavigate, Link } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Training from "./components/Training";
import type { LogItem } from "./types";
import "./App.css";

function NavigationHeader({ 
  setIsTraining 
}: { 
  setIsTraining: (val: boolean) => void; 
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === "/";


  return (
    <header className="glass-panel border-b border-white/5 py-4 px-6 md:px-8 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Link to="/" onClick={() => setIsTraining(false)} className="flex items-center">
          <span className="text-3xl font-black italic tracking-tighter text-emerald-400">FIT</span>
          <span className="text-3xl font-black italic tracking-tighter text-white bg-emerald-500/20 px-2 py-0.5 rounded-md ml-1 border border-emerald-500/30">AI</span>
        </Link>
        <span className="hidden sm:inline-block w-[1px] h-6 bg-white/10 mx-2"></span>
        <span className="hidden sm:inline-block text-[11px] font-mono tracking-widest text-slate-400 uppercase">
          V2 Cybernetic Pose Engine
        </span>
      </div>

      {!isDashboard ? (
        <button 
          onClick={() => {
            setIsTraining(false);
            navigate("/");
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-emerald-400/50 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider transition-all duration-200 text-slate-300 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Kembali ke Dashboard
        </button>
      ) : (
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-beacon"></span>
            Live Tracking Active
          </div>
        </div>
      )}
    </header>
  );
}

function MainAppContent() {
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({
    jj: 0, pushup: 0, situp: 0, squat: 0, lunge: 0
  });
  const [isTraining, setIsTraining] = useState(false);
  const [timer, setTimer] = useState(0);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [audioMode, setAudioMode] = useState<"muted" | "beep" | "synth">("synth");

  // Session duration timer loop
  useEffect(() => {
    let intervalId: number;
    if (isTraining) {
      intervalId = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isTraining]);

  const totalSessionReps = Object.values(exerciseCounts).reduce((a, b) => a + b, 0);
  const totalScore = totalSessionReps * 10;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const sharedProps = {
    isTraining,
    setIsTraining,
    exerciseCounts,
    setExerciseCounts,
    timer,
    setTimer,
    logs,
    setLogs,
    audioMode,
    setAudioMode,
    formatTime
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans select-none antialiased relative">
      {/* Background radial overlays */}
      <div className="bg-glowing-blob blob-cyan"></div>
      <div className="bg-glowing-blob blob-emerald"></div>

      {/* TOP HEADER STATUS BAR */}
      <NavigationHeader setIsTraining={setIsTraining} />

      {/* MAIN VIEW CONTROLLER / ROUTES */}
      <Routes>
        <Route 
          path="/" 
          element={
            <Dashboard 
              exerciseCounts={exerciseCounts} 
              totalSessionReps={totalSessionReps} 
              totalScore={totalScore} 
              timer={timer} 
              formatTime={formatTime} 
              logs={logs} 
            />
          } 
        />
        <Route path="/jumping-jack" element={<Training activeKey="jj" {...sharedProps} />} />
        <Route path="/push-up" element={<Training activeKey="pushup" {...sharedProps} />} />
        <Route path="/sit-up" element={<Training activeKey="situp" {...sharedProps} />} />
        <Route path="/squat" element={<Training activeKey="squat" {...sharedProps} />} />
        <Route path="/lunges" element={<Training activeKey="lunge" {...sharedProps} />} />
      </Routes>

      {/* FOOTER */}
      <footer className="py-6 mt-12 border-t border-white/5 text-center text-[10px] font-mono text-slate-500">
        FIT AI // TELESCOPIC FITNESS COUNTER // TUGAS BESAR WGTIK
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <MainAppContent />
    </Router>
  );
}