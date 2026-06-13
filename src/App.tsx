import { useEffect, useRef, useState } from "react";
import * as tmPose from "@teachablemachine/pose";

// 1. DEFINISI DATA DAN LOGIC GERAKAN (SINKRON DENGAN CLASS TEACHABLE MACHINE)
interface Exercise {
  name: string;
  sub: string;
  desc: string;
  muscleGroup: string;
  modelUrl: string;
  checkRep: (prediction: any[], stage: string) => {
    nextStage: string;
    status: string;
    isRep: boolean;
    bars: { label: string; value: number; color: string }[];
  };
}

const EXERCISES_DATA: Record<string, Exercise> = {
  jj: {
    name: "Jumping Jack",
    sub: "Full Body",
    desc: "Latihan kardio intensif untuk melatih kelincahan, kekuatan kaki, dan kebugaran jantung.",
    muscleGroup: "Full Body & Cardio",
    modelUrl: "https://teachablemachine.withgoogle.com/models/jZHgQNIHN/",
    checkRep: (prediction: any[], stage: string) => {
      const probLompat = prediction[0]?.probability || 0;
      const probBerdiri = prediction[1]?.probability || 0;
      const probTanganAtas = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = "READY";
      let isRep = false;

      // Logic: Lompat atau tangan atas memicu stage 'down'
      if ((probLompat > 0.90 || probTanganAtas > 0.90) && stage !== "down") {
        nextStage = "down";
        status = "JUMP!";
      }
      if (probBerdiri > 0.95 && stage === "down") {
        nextStage = "up";
        status = "EXCELLENT REP!";
        isRep = true;
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "Jumping-Jack-lompat", value: probLompat, color: "bg-cyan-500 shadow-cyan-500/20" },
          { label: "Jumping-Jack-Berdiri", value: probBerdiri, color: "bg-emerald-500 shadow-emerald-500/20" },
          { label: "Jumping-jack-berdiri-tangan-atas", value: probTanganAtas, color: "bg-teal-500 shadow-teal-500/20" }
        ]
      };
    }
  },
  pushup: {
    name: "Push Up",
    sub: "Chest & Triceps",
    desc: "Melatih kekuatan otot dada, bahu, lengan, serta kestabilan otot inti (core).",
    muscleGroup: "Chest, Triceps, Shoulders",
    modelUrl: "https://teachablemachine.withgoogle.com/models/ho-trLhwI/",
    checkRep: (prediction: any[], stage: string) => {
      const probUp = prediction[0]?.probability || 0;
      const probDown = prediction[1]?.probability || 0;
      const probNetral = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = stage === "up" ? "PLANK POSITION" : "HOLD POSITION";
      let isRep = false;

      if (probNetral < 0.5) {
        if (probDown > 0.95 && stage !== "down") {
          nextStage = "down";
          status = "PUSH DOWN!";
        }
        if (probUp > 0.95 && stage === "down") {
          nextStage = "up";
          status = "PERFECT PUSH!";
          isRep = true;
        }
      } else {
        status = "NETRAL / RESTING";
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "Push Up - Atas", value: probUp, color: "bg-cyan-500 shadow-cyan-500/20" },
          { label: "Push Up - Bawah", value: probDown, color: "bg-emerald-500 shadow-emerald-500/20" },
          { label: "Netral", value: probNetral, color: "bg-slate-600 shadow-slate-600/20" }
        ]
      };
    }
  },
  situp: {
    name: "Sit Up",
    sub: "Core & Abs",
    desc: "Menargetkan kekuatan otot perut (abs), pinggul, dan stabilitas punggung bawah.",
    muscleGroup: "Core & Abdominals",
    modelUrl: "https://teachablemachine.withgoogle.com/models/uk8veRyZx/",
    checkRep: (prediction: any[], stage: string) => {
      const probDown = prediction[0]?.probability || 0; // Rebahan
      const probUp = prediction[1]?.probability || 0;   // Duduk
      const probNetral = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = stage === "up" ? "START FORM" : "MID CRUNCH";
      let isRep = false;

      if (probNetral < 0.5) {
        if (probDown > 0.95 && stage !== "down") {
          nextStage = "down";
          status = "LAYING DOWN";
        }
        if (probUp > 0.95 && stage === "down") {
          nextStage = "up";
          status = "REP SUCCESS!";
          isRep = true;
        }
      } else {
        status = "NETRAL / RESTING";
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "Sit Up Rebahan", value: probDown, color: "bg-cyan-500 shadow-cyan-500/20" },
          { label: "Sit Up Duduk", value: probUp, color: "bg-emerald-500 shadow-emerald-500/20" },
          { label: "Netral", value: probNetral, color: "bg-slate-600 shadow-slate-600/20" }
        ]
      };
    }
  },
  lunge: {
    name: "Lunges",
    sub: "Legs & Balance",
    desc: "Latihan unilateral untuk meningkatkan stabilitas kaki, kekuatan paha depan, paha belakang, dan glutes.",
    muscleGroup: "Quadriceps, Glutes, Balance",
    modelUrl: "https://teachablemachine.withgoogle.com/models/lQEGyOvNo/",
    checkRep: (prediction: any[], stage: string) => {
      const probDown = prediction[0]?.probability || 0; // Lunges
      const probUp = prediction[1]?.probability || 0;   // Berdiri

      let nextStage = stage;
      let status = "READY";
      let isRep = false;

      if (probDown > 0.95 && stage !== "down") {
        nextStage = "down";
        status = "LUNGE STEP";
      }
      if (probUp > 0.95 && stage === "down") {
        nextStage = "up";
        status = "UPRIGHT STANCE";
        isRep = true;
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "Lunges", value: probDown, color: "bg-cyan-500 shadow-cyan-500/20" },
          { label: "Berdiri", value: probUp, color: "bg-emerald-500 shadow-emerald-500/20" }
        ]
      };
    }
  }
};

interface LogItem {
  id: string;
  name: string;
  time: string;
  count: number;
}

export default function App() {
  const [currentView, setCurrentView] = useState<"dashboard" | "training">("dashboard");
  const [activeKey, setActiveKey] = useState<keyof typeof EXERCISES_DATA>("jj");
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({
    jj: 0, pushup: 0, situp: 0, lunge: 0
  });

  const [currentStatus, setCurrentStatus] = useState("OFFLINE");
  const [currentBars, setCurrentBars] = useState<{ label: string; value: number; color: string }[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [timer, setTimer] = useState(0);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [audioMode, setAudioMode] = useState<"muted" | "beep" | "synth">("synth");
  const [hasRepJustOccurred, setHasRepJustOccurred] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentEx = EXERCISES_DATA[activeKey];

  // Ref tracking state sync
  const trackingRef = useRef({
    stage: "up",
    counter: 0,
    lastRepTime: 0,
    isTraining: false,
    activeKey: activeKey,
    audioMode: audioMode
  });

  // Sync state values to ref for high frequency callback accuracy
  useEffect(() => {
    trackingRef.current.isTraining = isTraining;
    trackingRef.current.activeKey = activeKey;
    trackingRef.current.audioMode = audioMode;
  }, [isTraining, activeKey, audioMode]);

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

  // Play audio sound effect based on configuration
  const playSoundEffect = (type: "rep" | "stage") => {
    if (trackingRef.current.audioMode === "muted") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    if (currentView !== "training") return;

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
                    ? "rgba(16, 185, 129, 0.85)" // Emerald
                    : "rgba(6, 182, 212, 0.85)";  // Cyan
                  
                  ctx.shadowColor = trackingRef.current.stage === "down" 
                    ? "rgba(16, 185, 129, 0.8)" 
                    : "rgba(6, 182, 212, 0.8)";
                  ctx.shadowBlur = 10;

                  tmPose.drawSkeleton(pose.keypoints, 0.55, ctx);

                  // Reset shadows for keypoints to improve performance
                  ctx.shadowBlur = 0;
                  ctx.fillStyle = trackingRef.current.stage === "down"
                    ? "#10b981"
                    : "#06b6d4";
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
  }, [activeKey, currentView]);

  const handleStartStop = () => {
    if (!isTraining) {
      trackingRef.current.counter = 0;
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
    trackingRef.current.counter = 0;
    trackingRef.current.stage = "up";
    setExerciseCounts((prev) => ({ ...prev, [activeKey]: 0 }));
    setCurrentBars([]);
    setCurrentStatus("STANDBY / CALIBRATING");
  };

  // Helper selectors & formatters
  const highestAccuracy = currentBars.length > 0 ? Math.max(...currentBars.map(b => b.value)) : 0;
  const totalSessionReps = Object.values(exerciseCounts).reduce((a, b) => a + b, 0);
  const totalScore = totalSessionReps * 10;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const calculatePace = () => {
    if (timer === 0) return 0;
    const reps = exerciseCounts[activeKey];
    return parseFloat(((reps / timer) * 60).toFixed(1));
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans select-none antialiased relative">
      
      {/* Background radial overlays */}
      <div className="bg-glowing-blob blob-cyan"></div>
      <div className="bg-glowing-blob blob-emerald"></div>

      {/* TOP HEADER STATUS BAR */}
      <header className="glass-panel border-b border-white/5 py-4 px-6 md:px-8 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-3xl font-black italic tracking-tighter text-emerald-400">FIT</span>
            <span className="text-3xl font-black italic tracking-tighter text-white bg-emerald-500/20 px-2 py-0.5 rounded-md ml-1 border border-emerald-500/30">AI</span>
          </div>
          <span className="hidden sm:inline-block w-[1px] h-6 bg-white/10 mx-2"></span>
          <span className="hidden sm:inline-block text-[11px] font-mono tracking-widest text-slate-400 uppercase">
            V2 Cybernetic Pose Engine
          </span>
        </div>

        {/* Global Stats or Back Button */}
        {currentView === "training" ? (
          <button 
            onClick={() => {
              setIsTraining(false);
              setCurrentView("dashboard");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-emerald-400/50 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider transition-all duration-200 text-slate-300"
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

      {/* MAIN VIEW CONTROLLER */}
      {currentView === "dashboard" ? (
        
        /* ------------------ VIEW 1: GLOBAL WORKOUT DASHBOARD ------------------ */
        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 animate-[fadeIn_0.4s_ease-out]">
          
          {/* Welcome & Session Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col justify-center space-y-3">
              <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                JELAJAHI <span className="text-emerald-400">BATAS KEMAMPUAN</span> ANDA
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl">
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
              <span className="text-[10px] text-slate-500 font-mono">4 EXERCISES LOADED</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {Object.entries(EXERCISES_DATA).map(([key, item]) => {
                const repsCount = exerciseCounts[key] || 0;
                
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
                      <path d="M7 14H5c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2h2"/>
                      <path d="M17 14h2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2h-2"/>
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
                }

                return (
                  <div
                    key={key}
                    className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between h-[280px] group border-white/5 relative overflow-hidden"
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
                        <h4 className="text-xl font-bold group-hover:text-emerald-400 transition-colors duration-300 tracking-tight">
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
                      
                      <button
                        onClick={() => {
                          setActiveKey(key);
                          setCurrentView("training");
                        }}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-black transition-all duration-300 text-slate-300 flex items-center justify-center cursor-pointer shadow-md"
                        title="Start exercise"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </button>
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
      ) : (
        
        /* ------------------ VIEW 2: ACTIVE TRAINING HUD CONSOLE ------------------ */
        <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-[fadeIn_0.4s_ease-out]">
          
          {/* LEFT COLUMN: TELEMETRY CONTROL SIDEBAR */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Active Exercise Detail Card */}
            <div className="glass-panel rounded-2xl p-5 border-white/5 space-y-4">
              <div>
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                  GERAKAN AKTIF
                </span>
                <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">
                  {currentEx.name}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  {currentEx.desc}
                </p>
              </div>
 
              {/* Targeted muscle groups */}
              <div className="pt-3 border-t border-white/5 space-y-1.5">
                <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider block">Target Otot</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentEx.muscleGroup.split(',').map((muscle, idx) => (
                    <span key={idx} className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/25">
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
                          ? "bg-emerald-500 text-black shadow-md font-black"
                          : "text-slate-400 hover:text-slate-100"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions Guide Alert */}
              <div className="bg-zinc-950/60 rounded-xl p-3 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-200 block mb-1">💡 Petunjuk Singkat:</span>
                Tekan tombol <b className="text-emerald-400">Mulai Latihan</b>, atur tubuh Anda pada frame kamera, dan lakukan repetisi secara teratur untuk mulai melacak gerakan Anda.
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
                    ? "border-emerald-500/40 shadow-emerald-950/10" 
                    : "border-emerald-500/20 shadow-black/80"
              }`}
              style={{ "--hud-color": isTraining ? "#10b981" : "#06b6d4" } as React.CSSProperties}
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
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                    : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                }`}>
                  {currentStatus}
                </span>
                
                {isTraining && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-beacon"></span>
                )}
              </div>

              {/* Current Stage Indicator Badge */}
              <div className="absolute top-4 right-4 z-20">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-md bg-black/85 text-slate-300 border border-white/10 shadow-md">
                  STAGE: <b className="text-emerald-400 italic font-sport ml-1">{trackingRef.current.stage}</b>
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
                    <div className="p-4 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                    
                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                        KAMERA DALAM KEADAAN STANDBY
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
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
                <p className="text-2xl font-black italic text-emerald-400 mt-1 tabular-nums">
                  {exerciseCounts[activeKey]}
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
                <p className="text-2xl font-black italic text-cyan-400 mt-1 tabular-nums font-mono-custom">
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
                    ? 'bg-red-500 hover:bg-red-400 border-red-500 text-white shadow-red-950/20' 
                    : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-500 text-black shadow-emerald-950/15'
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
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-sm"></div>
              
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                REPETISI TERDETEKSI
              </span>
              
              <span className="text-7xl font-black italic tracking-tighter leading-none my-4 tabular-nums text-white block glow-emerald animate-[repIncrease_0.3s_ease-out]">
                {exerciseCounts[activeKey]}
              </span>
              
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/90 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/25">
                {currentEx.name}
              </span>
            </div>

            {/* AI Classification Probability Telemetry */}
            <div className="glass-panel rounded-2xl p-5 border-white/5 space-y-4">
              <div className="border-b border-white/5 pb-2.5 flex justify-between items-center">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-mono">
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
                          <span className="text-[11px] font-mono font-bold text-emerald-400">
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
                      
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">
                        COUNTED
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </main>
      )}

      {/* FOOTER */}
      <footer className="py-6 mt-12 border-t border-white/5 text-center text-[10px] font-mono text-slate-500">
        FIT AI // TELESCOPIC FITNESS COUNTER // TUGAS BESAR WGTIK
      </footer>

    </div>
  );
}