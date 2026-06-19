import { Link } from "react-router-dom";
import { EXERCISES_DATA } from "../constants";
import type { LogItem } from "../types";

interface DashboardProps {
  exerciseCounts: Record<string, number>;
  totalSessionReps: number;
  totalScore: number;
  timer: number;
  formatTime: (seconds: number) => string;
  logs: LogItem[];
}

const ROUTE_MAP: Record<string, string> = {
  jj: "/jumping-jack",
  pushup: "/push-up",
  situp: "/sit-up",
  squat: "/squat",
  lunge: "/lunges"
};

export default function Dashboard({
  exerciseCounts,
  totalSessionReps,
  totalScore,
  timer,
  formatTime,
  logs
}: DashboardProps) {
  return (
    <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Welcome & Session Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col justify-center space-y-3">
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
            JELAJAHI <span className="text-emerald-400">BATAS KEMAMPUAN</span> ANDA
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl font-normal leading-relaxed">
            Fit AI menggunakan deteksi pose bertenaga AI secara real-time langsung melalui kamera perangkat Anda. 
            Pilih gerakan di bawah, aktifkan kamera, dan mulailah berolahraga dengan presisi presisi tinggi.
          </p>
        </div>
        
        {/* Session Stats HUD Card */}
        <div className="glass-panel rounded-2xl p-6 glow-emerald border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <h2 className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-4 flex items-center justify-between">
            <span>RANGKUMAN SESI INI</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400/50">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border-r border-white/5 pr-4">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Total Reps</span>
              <span className="text-3xl font-black italic tracking-tighter text-white block mt-1">
                {totalSessionReps}
              </span>
            </div>
            <div className="pl-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Total Skor</span>
              <span className="text-3xl font-black italic tracking-tighter text-emerald-400 block mt-1">
                {totalScore} <span className="text-xs font-normal text-slate-500 font-sans">pts</span>
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>AKTIVITAS AKTIF</span>
            <span className="text-white font-bold">{formatTime(timer)}</span>
          </div>
        </div>
      </div>

      {/* Exercise Selection Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-white/5 pb-2">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold font-mono">
            MENU LATIHAN TERSEDIA
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            {Object.keys(EXERCISES_DATA).length} EXERCISES LOADED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {Object.entries(EXERCISES_DATA).map(([key, item]) => {
            const repsCount = exerciseCounts[key] || 0;
            const routePath = ROUTE_MAP[key] || "/";
            
            // Select Icon dynamically
            let iconSvg = (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            );
            
            if (key === "jj") {
              iconSvg = (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h-1V6c0-1.1-.9-2-2-2h-3c-1.1 0-2 .9-2 2v2H9c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/>
                  <path d="M7 14H5c-1.1 0-2-.9-2-2-2h2"/>
                  <path d="M17 14h2c1.1 0 2-.9 2-2-2h-2"/>
                </svg>
              );
            } else if (key === "pushup") {
              iconSvg = (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="8" width="20" height="8" rx="2"/>
                  <circle cx="6" cy="12" r="1"/>
                  <circle cx="18" cy="12" r="1"/>
                  <path d="M10 12h4"/>
                </svg>
              );
            } else if (key === "situp") {
              iconSvg = (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14h16l-3-6H7l-3 6z"/>
                  <circle cx="12" cy="5" r="1"/>
                  <path d="M12 18v2M8 20h8"/>
                </svg>
              );
            } else if (key === "lunge") {
              iconSvg = (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 16h6l2 5M19 16h-4l-2 5"/>
                  <path d="M12 8v8"/>
                </svg>
              );
            } else if (key === "squat") {
              iconSvg = (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="4" r="2" />
                  <path d="M12 6h2l2 4-2 3-1-3-2 1v6h-2v-5l-2-2v-4z" />
                  <path d="M6 20h12" />
                </svg>
              );
            }

            return (
              <div
                key={key}
                className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between h-[290px] group border-white/5 relative overflow-hidden"
              >
                {/* Interactive accent lines */}
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                <div className="space-y-4">
                  {/* Icon & Muscle Group Badge */}
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-white/5 rounded-xl group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors duration-300">
                      {iconSvg}
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-slate-400">
                      {item.sub}
                    </span>
                  </div>

                  {/* Info Text */}
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold group-hover:text-emerald-400 transition-colors duration-300 tracking-tight">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Bottom Stats & Trigger button */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">REPETISI</span>
                    <span className="text-2xl font-black italic tracking-tighter text-white tabular-nums group-hover:text-emerald-400 transition-colors duration-300">
                      {repsCount}
                    </span>
                  </div>
                  
                  <Link
                    to={routePath}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-black transition-all duration-300 text-slate-300 flex items-center justify-center cursor-pointer shadow-md"
                    title="Start exercise"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Log Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Instructions Guide */}
        <div className="glass-panel rounded-2xl p-6 border-white/5 space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-emerald-400 font-bold font-mono">
            PANDUAN PENYETELAN KAMERA
          </h3>
          
          <ul className="space-y-3 text-xs text-slate-400">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-emerald-400 flex-shrink-0 text-[10px]">
                1
              </span>
              <span>Tempatkan kamera setinggi pinggang atau dada, sekitar 2 - 2.5 meter di depan Anda.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-emerald-400 flex-shrink-0 text-[10px]">
                2
              </span>
              <span>Pastikan seluruh tubuh Anda dari kepala hingga kaki terlihat jelas pada frame kamera.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-emerald-400 flex-shrink-0 text-[10px]">
                3
              </span>
              <span>Pencahayaan yang cukup di dalam ruangan membantu mendeteksi sendi tubuh Anda secara presisi.</span>
            </li>
          </ul>
        </div>

        {/* Right Logger / Session History Feed */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border-white/5 flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold font-mono">
              LOG REPETISI REALTIME
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              {logs.length} EVENT DETECTED
            </span>
          </div>

          <div className="flex-grow overflow-y-auto max-h-48 pr-2 space-y-2.5">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8 text-slate-500 space-y-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
                <p className="text-xs italic">Belum ada repetisi gerakan yang terdeteksi di sesi ini.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-zinc-950/40 border border-white/5 px-4 py-2.5 rounded-xl flex justify-between items-center text-xs hover:border-emerald-500/20 hover:bg-zinc-950/70 transition-all duration-150"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <div>
                      <p className="font-bold text-slate-200 uppercase tracking-tight">{log.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-slate-400 uppercase">REP COUNT:</span>
                    <span className="font-mono font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-md border border-emerald-500/20 shadow-sm">
                      {log.count}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
