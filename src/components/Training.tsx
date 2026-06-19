import { useEffect, useRef, useState } from "react";
import * as tmPose from "@teachablemachine/pose";
import { EXERCISES_DATA } from "../constants";
import type { LogItem } from "../types";

interface TrainingProps {
  activeKey: string;
  isTraining: boolean;
  setIsTraining: (val: boolean) => void;
  exerciseCounts: Record<string, number>;
  setExerciseCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  timer: number;
  setTimer: React.Dispatch<React.SetStateAction<number>>;
  logs: LogItem[];
  setLogs: React.Dispatch<React.SetStateAction<LogItem[]>>;
  audioMode: "muted" | "beep" | "synth";
  setAudioMode: (mode: "muted" | "beep" | "synth") => void;
}

export default function Training({
  activeKey,
  isTraining,
  setIsTraining,
  exerciseCounts,
  setExerciseCounts,
  timer,
  setTimer,
  logs,
  setLogs,
  audioMode,
  setAudioMode
}: TrainingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentEx = EXERCISES_DATA[activeKey];


  const [currentStatus, setCurrentStatus] = useState("OFFLINE");
  const [currentBars, setCurrentBars] = useState<{ label: string; value: number; color: string }[]>([]);
  const [hasRepJustOccurred, setHasRepJustOccurred] = useState(false);
  const [currentStage, setCurrentStage] = useState("up");

  // Ref tracking state sync for high frequency animation frame callbacks
  const trackingRef = useRef({
    stage: "up",
    counter: exerciseCounts[activeKey] || 0,
    lastRepTime: 0,
    isTraining: isTraining,
    activeKey: activeKey,
    audioMode: audioMode
  });

  // Keep references updated
  useEffect(() => {
    trackingRef.current.isTraining = isTraining;
    trackingRef.current.activeKey = activeKey;
    trackingRef.current.audioMode = audioMode;
    trackingRef.current.counter = exerciseCounts[activeKey] || 0;
  }, [isTraining, activeKey, audioMode, exerciseCounts]);

  // Play audio sound effect based on configuration
  const playSoundEffect = (type: "rep" | "stage") => {
    if (trackingRef.current.audioMode === "muted") return;
    try {
      const audioCtx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (trackingRef.current.audioMode === "synth") {
        if (type === "rep") {
          // Double note chime
          osc.type = "triangle";
          osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
          gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
          osc.start();
          
          osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
          gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.08);
          osc.stop(audioCtx.currentTime + 0.25);
        } else {
          // Short synth blip
          osc.type = "sine";
          osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.06);
        }
      } else if (trackingRef.current.audioMode === "beep") {
        // Legacy simple beep
        osc.type = "sine";
        osc.frequency.setValueAtTime(type === "rep" ? 880 : 440, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + (type === "rep" ? 0.12 : 0.08));
      }
    } catch (e) {
      console.warn("Audio context blocked or failed to load", e);
    }
  };

  // Teachable Machine Engine & Webcam Core
  useEffect(() => {
    let webcam: tmPose.Webcam;
    let model: tmPose.CustomPoseNet;
    let animationId: number;
    let isActive = true;

    const setupAI = async () => {
      try {
        setCurrentStatus("INITIALIZING AI...");
        setCurrentBars([]);
        
        // Load pose model and metadata
        model = await tmPose.load(
          currentEx.modelUrl + "model.json", 
          currentEx.modelUrl + "metadata.json"
        );
        
        if (!isActive) return;

        // Start webcam setup
        const size = 640;
        webcam = new tmPose.Webcam(size, 480, true); 
        await webcam.setup(); 
        await webcam.play();
        
        if (!isActive) {
          webcam.stop();
          return;
        }

        setCurrentStatus("STANDBY / CALIBRATING");

        // Primary Frame Processing Loop
        const loop = async () => {
          if (!isActive) return;
          
          webcam.update();

          if (trackingRef.current.isTraining) {
            const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
            const prediction = await model.predict(posenetOutput);

            if (pose && pose.score > 0.15) {
              const currentExerciseLogic = EXERCISES_DATA[trackingRef.current.activeKey];
              const result = currentExerciseLogic.checkRep(prediction, trackingRef.current.stage);
              
              if (result) {
                setCurrentBars(result.bars);
                
                // Play a brief sound when transition from up to down (e.g. going down into rep)
                if (trackingRef.current.stage !== result.nextStage && result.nextStage === "down") {
                  playSoundEffect("stage");
                }

                trackingRef.current.stage = result.nextStage;
                setCurrentStage(result.nextStage);
                setCurrentStatus(result.status);

                if (result.isRep) {
                  const now = Date.now();
                  // Debounce consecutive rapid rep counts
                  if (now - trackingRef.current.lastRepTime > 700) {
                    trackingRef.current.counter++;
                    trackingRef.current.lastRepTime = now;
                    
                    const exerciseKey = trackingRef.current.activeKey;
                    setExerciseCounts((prev) => ({ 
                      ...prev, 
                      [exerciseKey]: prev[exerciseKey] + 1 
                    }));

                    // Flash feedback
                    setHasRepJustOccurred(true);
                    setTimeout(() => setHasRepJustOccurred(false), 800);

                    // Create log entry
                    const dateStr = new Date().toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    });
                    setLogs((prev) => [
                      { 
                        id: Date.now().toString(), 
                        name: currentExerciseLogic.name, 
                        time: dateStr, 
                        count: trackingRef.current.counter 
                      },
                      ...prev
                    ]);

                    // Play success sound
                    playSoundEffect("rep");
                  }
                }
              }
            }

            // Draw Webcam and custom glowing pose skeleton tracking on visual canvas
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, 640, 480);
                
                // Draw camera feed
                ctx.drawImage(webcam.canvas, 0, 0, 640, 480);
                
                // Draw custom tracked pose skeleton
                if (pose) {
                  // Connect joints with glowing styling
                  ctx.lineWidth = 4;
                  ctx.strokeStyle = trackingRef.current.stage === "down" 
                    ? "rgba(239, 68, 68, 0.85)" // Red
                    : "rgba(244, 63, 94, 0.85)";  // Rose
                  
                  ctx.shadowColor = trackingRef.current.stage === "down" 
                    ? "rgba(239, 68, 68, 0.8)" 
                    : "rgba(244, 63, 94, 0.8)";
                  ctx.shadowBlur = 10;

                  tmPose.drawSkeleton(pose.keypoints, 0.55, ctx);

                  // Reset shadows for keypoints to improve performance
                  ctx.shadowBlur = 0;
                  ctx.fillStyle = trackingRef.current.stage === "down"
                    ? "#ef4444"
                    : "#f43f5e";
                  tmPose.drawKeypoints(pose.keypoints, 0.55, ctx);
                }
              }
            }
          } else {
            // Even if not active training, copy webcam preview to canvas
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, 640, 480);
                ctx.drawImage(webcam.canvas, 0, 0, 640, 480);
              }
            }
          }

          animationId = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        console.error("Camera access or model loading error: ", err);
        setCurrentStatus("CAMERA BLOCKED / OFFLINE");
      }
    };

    setupAI();

    return () => {
      isActive = false;
      if (webcam) webcam.stop();
      cancelAnimationFrame(animationId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const handleStartStop = () => {
    if (!isTraining) {
      trackingRef.current.stage = "up";
      setIsTraining(true);
      setCurrentStatus("CALIBRATING POSITION");
    } else {
      setIsTraining(false);
      setCurrentStatus("PAUSED / STANDBY");
    }
  };

  const handleReset = () => {
    setIsTraining(false);
    setTimer(0);
    trackingRef.current.stage = "up";
    setExerciseCounts((prev) => ({ ...prev, [activeKey]: 0 }));
    setCurrentBars([]);
    setCurrentStatus("STANDBY / CALIBRATING");
  };

  // Helper selectors & formatters
  const highestAccuracy = currentBars.length > 0 ? Math.max(...currentBars.map(b => b.value)) : 0;
  
  const calculatePace = () => {
    if (timer === 0) return 0;
    const reps = exerciseCounts[activeKey] || 0;
    return parseFloat(((reps / timer) * 60).toFixed(1));
  };

  return (
    <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-[fadeIn_0.4s_ease-out]">
      {/* LEFT COLUMN: TELEMETRY CONTROL SIDEBAR */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Active Exercise Detail Card */}
        <div className="glass-panel rounded-2xl p-5 border-white/5 space-y-4">
          <div>
            <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest block mb-1">
              GERAKAN AKTIF
            </span>
            <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">
              {currentEx.name}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-2 font-normal">
              {currentEx.desc}
            </p>
          </div>

          {/* Targeted muscle groups */}
          <div className="pt-3 border-t border-white/5 space-y-1.5">
            <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider block">Target Otot</span>
            <div className="flex flex-wrap gap-1.5">
              {currentEx.muscleGroup.split(',').map((muscle, idx) => (
                <span key={idx} className="text-[9px] font-mono uppercase bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded border border-red-500/25">
                  {muscle.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Console Control & Audio Settings */}
        <div className="glass-panel rounded-2xl p-5 border-white/5 space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold font-mono">
            PENGATURAN CONSOLE
          </h3>

          {/* Sound Mode Toggle */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
              Feedback Suara (BEEP/SYNTH)
            </label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
              {(["synth", "beep", "muted"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAudioMode(mode)}
                  className={`py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    audioMode === mode
                      ? "bg-red-600 text-white shadow-md font-black"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions Guide Alert */}
          <div className="bg-zinc-950/60 rounded-xl p-3 border border-white/5 text-[11px] text-slate-400 leading-relaxed font-normal">
            <span className="font-bold text-slate-200 block mb-1">💡 Petunjuk Singkat:</span>
            Tekan tombol <b className="text-red-400">Mulai Latihan</b>, atur tubuh Anda pada frame kamera, dan lakukan repetisi secara teratur untuk mulai melacak gerakan Anda.
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN: LIVE RADAR / CAMERA HUB CONTAINER */}
      <div className="lg:col-span-6 space-y-6 flex flex-col items-center">
        
        {/* Cyber HUD Camera wrapper */}
        <div 
          className={`w-full bg-zinc-950/80 border-2 rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300 ${
            hasRepJustOccurred 
              ? "rep-flash" 
              : isTraining 
                ? "border-red-500/40 shadow-red-950/10" 
                : "border-red-500/20 shadow-black/80"
          }`}
          style={{ "--hud-color": isTraining ? "#ef4444" : "#f43f5e" } as React.CSSProperties}
        >
          {/* Scanline overlay & corners */}
          <div className="scanlines absolute inset-0 z-10 pointer-events-none rounded-2xl"></div>
          <div className="hud-corner-tl"></div>
          <div className="hud-corner-tr"></div>
          <div className="hud-corner-bl"></div>
          <div className="hud-corner-br"></div>

          {/* Status Header Badge overlay */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-md border backdrop-blur-md shadow-md ${
              isTraining 
                ? "bg-red-500/10 text-red-400 border-red-500/30" 
                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            }`}>
              {currentStatus}
            </span>
            
            {isTraining && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 pulse-beacon"></span>
            )}
          </div>

          {/* Current Stage Indicator Badge */}
          <div className="absolute top-4 right-4 z-20">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-md bg-black/85 text-slate-300 border border-white/10 shadow-md">
              STAGE: <b className="text-red-400 italic font-sport ml-1">{currentStage}</b>
            </span>
          </div>

          {/* Canvas rendering output */}
          <div className="relative w-full aspect-[4/3] bg-zinc-950 flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={640} 
              height={480} 
              className="w-full h-full object-cover brightness-95 contrast-105" 
            />
            
            {/* Fallback Camera message overlay when training is inactive */}
            {!isTraining && (
              <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center p-6 text-center space-y-4 transition-all duration-300">
                <div className="p-4 rounded-full bg-red-500/5 border border-red-500/10 text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    KAMERA DALAM KEADAAN STANDBY
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Model AI dan kamera sudah siap dimuat. Klik tombol <b>Mulai Latihan</b> untuk menyalakan pelacakan sendi secara realtime.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick calibration indicators panel */}
        <div className="w-full grid grid-cols-3 gap-4 bg-zinc-900/40 border border-white/5 rounded-2xl p-4 text-center divide-x divide-white/5 relative z-10">
          <div>
            <span className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-wider">Repetisi</span>
            <p className="text-2xl font-black italic text-red-400 mt-1 tabular-nums">
              {exerciseCounts[activeKey] || 0}
            </p>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-wider">Pace Kecepatan</span>
            <p className="text-2xl font-black italic text-white mt-1 tabular-nums font-mono-custom">
              {calculatePace()}<span className="text-xs font-normal text-slate-500">/m</span>
            </p>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-wider">Akurasi Live</span>
            <p className="text-2xl font-black italic text-rose-400 mt-1 tabular-nums font-mono-custom">
              {(highestAccuracy * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Action buttons controller */}
        <div className="w-full grid grid-cols-2 gap-4">
          <button
            onClick={handleStartStop}
            className={`py-3.5 rounded-2xl font-black uppercase text-xs italic tracking-wider transition-all duration-300 border cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
              isTraining 
                ? 'bg-zinc-950 hover:bg-zinc-900 border-white/10 hover:border-red-500/40 text-red-400 shadow-black/20' 
                : 'bg-red-600 hover:bg-red-500 border-red-600 text-white shadow-red-950/15'
            }`}
          >
            {isTraining ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="5" y="5" rx="1"/>
                </svg>
                Berhenti Latihan
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="6 3 20 12 6 21 6 3"/>
                </svg>
                Mulai Latihan
              </>
            )}
          </button>
          
          <button
            onClick={handleReset}
            className="py-3.5 rounded-2xl bg-zinc-900 border border-white/10 text-slate-400 hover:bg-zinc-800 hover:text-slate-100 font-black uppercase text-xs italic tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            Reset Reps
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: HUD TELEMETRY DATA TELEMETRI */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Live Giant Repetition Display */}
        <div className="glass-panel rounded-2xl p-6 border-white/5 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-sm"></div>
          
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            REPETISI TERDETEKSI
          </span>
          
          <span className="text-7xl font-black italic tracking-tighter leading-none my-4 tabular-nums text-white block glow-red animate-[repIncrease_0.3s_ease-out]">
            {exerciseCounts[activeKey] || 0}
          </span>
          
          <span className="text-[10px] font-black uppercase tracking-widest text-red-400/90 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/25">
            {currentEx.name}
          </span>
        </div>

        {/* AI Classification Probability Telemetry */}
        <div className="glass-panel rounded-2xl p-5 border-white/5 space-y-4">
          <div className="border-b border-white/5 pb-2.5 flex justify-between items-center">
            <h3 className="text-xs font-black text-red-400 uppercase tracking-widest font-mono">
              TELEMETRI MODEL AI
            </h3>
            <span className="text-[9px] font-mono text-slate-500">LIVE FEED</span>
          </div>
          
          <div className="space-y-4">
            {currentBars.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono italic">
                MENUNGGU TELEMETRI AKTIF...
              </div>
            ) : (
              currentBars.map((bar, index) => {
                const percentage = (bar.value * 100).toFixed(0);
                return (
                  <div key={index} className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block max-w-[80%] truncate">
                        {bar.label}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-red-400">
                        {percentage}%
                      </span>
                    </div>
                    
                    {/* Custom visual progress bar */}
                    <div className="w-full h-3.5 bg-zinc-950 border border-white/5 rounded-full p-[2.5px] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-75 ease-out ${bar.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Session Workout Log feed (limited to 5 for training console context) */}
        <div className="glass-panel rounded-2xl p-5 border-white/5 space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2.5 font-mono">
            RIWAYAT REPETISI AKTIF
          </h3>
          
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 text-xs">
            {logs.filter(l => l.name === currentEx.name).length === 0 ? (
              <p className="text-[10px] text-slate-500 italic text-center py-4">Lakukan gerakan pertama Anda...</p>
            ) : (
              logs.filter(l => l.name === currentEx.name).slice(0, 5).map((log) => (
                <div key={log.id} className="bg-zinc-950/40 border border-white/5 p-2 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-300">REP #{log.count}</span>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{log.time}</span>
                  </div>
                  
                  <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded">
                    COUNTED
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
