import { useEffect, useRef, useState } from "react";
import * as tmPose from "@teachablemachine/pose";

// 1. DEFINISI DATA DAN LOGIC GERAKAN (SINKRON DENGAN CLASS TEACHABLE MACHINE LU)
const EXERCISES_DATA = {
  pushup: {
    name: "Push Up",
    sub: "Chest & Triceps",
    modelUrl: "https://teachablemachine.withgoogle.com/models/ho-trLhwI/",
    checkRep: (prediction: any[], stage: string) => {
      const probUp = prediction[0]?.probability || 0;
      const probDown = prediction[1]?.probability || 0;
      const probNetral = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = stage === "up" ? "READY / PLANK" : "HOLD POSITION";
      let isRep = false;

      if (probNetral < 0.5) {
        if (probDown > 0.95 && stage !== "down") {
          nextStage = "down";
          status = "PUSH DOWN!";
        }
        if (probUp > 0.95 && stage === "down") {
          nextStage = "up";
          status = "GOOD REP!";
          isRep = true;
        }
      } else {
        status = "NETRAL / RESTING";
      }

      return {
        nextStage, status, isRep,
        bars: [
          { label: "Push Up - Atas", value: probUp, color: "bg-yellow-400" },
          { label: "Push Up - Bawah", value: probDown, color: "bg-green-400" },
          { label: "Netral", value: probNetral, color: "bg-zinc-600" }
        ]
      };
    }
  },
  situp: {
    name: "Sit Up",
    sub: "Core & Abs",
    modelUrl: "https://teachablemachine.withgoogle.com/models/uk8veRyZx/",
    checkRep: (prediction: any[], stage: string) => {
      const probDown = prediction[0]?.probability || 0; // Rebahan
      const probUp = prediction[1]?.probability || 0;   // Duduk
      const probNetral = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = stage === "up" ? "READY" : "DOWN";
      let isRep = false;

      if (probNetral < 0.5) {
        if (probDown > 0.95 && stage !== "down") {
          nextStage = "down";
          status = "LAYING DOWN";
        }
        if (probUp > 0.95 && stage === "down") {
          nextStage = "up";
          status = "CRUNCH!";
          isRep = true;
        }
      }

      return {
        nextStage, status, isRep,
        bars: [
          { label: "Sit Up Rebahan", value: probDown, color: "bg-yellow-400" },
          { label: "Sit Up Duduk", value: probUp, color: "bg-green-400" },
          { label: "Netral", value: probNetral, color: "bg-zinc-600" }
        ]
      };
    }
  },
  squat: {
    name: "Squat",
    sub: "Legs & Glutes",
    modelUrl: "https://teachablemachine.withgoogle.com/models/_fec-xp2u/",
    checkRep: (prediction: any[], stage: string) => {
      const probUp = prediction[0]?.probability || 0;
      const probDown = prediction[1]?.probability || 0;

      let nextStage = stage;
      let status = stage === "up" ? "STAND" : "DEEP SQUAT";
      let isRep = false;

      if (probDown > 0.95 && stage !== "down") {
        nextStage = "down";
        status = "GO DOWN!";
      }
      if (probUp > 0.95 && stage === "down") {
        nextStage = "up";
        status = "STAND UP!";
        isRep = true;
      }

      return {
        nextStage, status, isRep,
        bars: [
          { label: "Squat-Berdiri", value: probUp, color: "bg-yellow-400" },
          { label: "Squat-Turun", value: probDown, color: "bg-green-400" }
        ]
      };
    }
  },
  lunge: {
    name: "Lunges",
    sub: "Legs & Balance",
    modelUrl: "https://teachablemachine.withgoogle.com/models/lunges/",
    checkRep: (prediction: any[], stage: string) => {
      const probDown = prediction[0]?.probability || 0;
      const probUp = prediction[1]?.probability || 0;

      let nextStage = stage;
      let status = "READY";
      let isRep = false;

      if (probDown > 0.95 && stage !== "down") {
        nextStage = "down";
        status = "LUNGE STEP";
      }
      if (probUp > 0.95 && stage === "down") {
        nextStage = "up";
        status = "STAND UP!";
        isRep = true;
      }

      return {
        nextStage, status, isRep,
        bars: [
          { label: "Lunges", value: probDown, color: "bg-yellow-400" },
          { label: "Berdiri", value: probUp, color: "bg-green-400" }
        ]
      };
    }
  },
  jj: {
    name: "Jumping Jack",
    sub: "Full Body",
    modelUrl: "https://teachablemachine.withgoogle.com/models/jZHgQNIHN/",
    checkRep: (prediction: any[], stage: string) => {
      const probLompat = prediction[0]?.probability || 0;
      const probBerdiri = prediction[1]?.probability || 0;
      const probTanganAtas = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = "READY";
      let isRep = false;

      if ((probLompat > 0.92 || probTanganAtas > 0.92) && stage !== "down") {
        nextStage = "down";
        status = "JUMP!";
      }
      if (probBerdiri > 0.95 && stage === "down") {
        nextStage = "up";
        status = "GOOD FORM!";
        isRep = true;
      }

      return {
        nextStage, status, isRep,
        bars: [
          { label: "Jumping-Jack-lompat", value: probLompat, color: "bg-yellow-400" },
          { label: "Jumping-Jack-Berdiri", value: probBerdiri, color: "bg-green-400" },
          { label: "Jacks-tangan-atas", value: probTanganAtas, color: "bg-zinc-600" }
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
  const [activeKey, setActiveKey] = useState<keyof typeof EXERCISES_DATA>("jj");
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({
    pushup: 0, situp: 0, squat: 0, lunge: 0, jj: 0
  });
  
  const [currentStatus, setCurrentStatus] = useState("INITIALIZING");
  const [currentBars, setCurrentBars] = useState<{ label: string; value: number; color: string }[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [timer, setTimer] = useState(0);
  const [logs, setLogs] = useState<LogItem[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentEx = EXERCISES_DATA[activeKey];

  // Ref penampung state tracking agar loop webcam tidak stale
  const trackingRef = useRef({
    stage: "up",
    counter: 0,
    lastRepTime: 0,
    isTraining: false,
    activeKey: activeKey
  });

  // Sinkronisasi data ref ketika state eksternal berubah
  useEffect(() => {
    trackingRef.current.isTraining = isTraining;
    trackingRef.current.activeKey = activeKey;
  }, [isTraining, activeKey]);

  // Timer Session Effect
  useEffect(() => {
    let intervalId: number;
    if (isTraining) {
      intervalId = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isTraining]);

  // ENGINE AI & WEBCAM CORE
  useEffect(() => {
    let webcam: tmPose.Webcam;
    let model: tmPose.CustomPoseNet;
    let animationId: number;

    const setupAI = async () => {
      try {
        setCurrentStatus("LOADING MODEL...");
        model = await tmPose.load(currentEx.modelUrl + "model.json", currentEx.modelUrl + "metadata.json");
        
        const size = 640; 
        webcam = new tmPose.Webcam(size, 440, true); 
        await webcam.setup(); 
        await webcam.play();
        setCurrentStatus("READY TO START");

        const loop = async () => {
          webcam.update();

          if (trackingRef.current.isTraining) {
            const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
            const prediction = await model.predict(posenetOutput);

            if (pose && pose.score > 0.65) {
              const currentExerciseLogic = EXERCISES_DATA[trackingRef.current.activeKey];
              const result = currentExerciseLogic.checkRep(prediction, trackingRef.current.stage);
              
              if (result) {
                setCurrentBars(result.bars);
                trackingRef.current.stage = result.nextStage;
                setCurrentStatus(result.status);

                if (result.isRep) {
                  const now = Date.now();
                  if (now - trackingRef.current.lastRepTime > 650) {
                    trackingRef.current.counter++;
                    trackingRef.current.lastRepTime = now;
                    
                    const k = trackingRef.current.activeKey;
                    setExerciseCounts((prev) => ({ ...prev, [k]: prev[k] + 1 }));
                    
                    // Tambah Log Latihan
                    const dateStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    setLogs((prev) => [
                      { id: Date.now().toString(), name: currentExerciseLogic.name, time: dateStr, count: trackingRef.current.counter },
                      ...prev
                    ]);

                    // Beep sound effect
                    try {
                      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = audioCtx.createOscillator();
                      osc.connect(audioCtx.destination);
                      osc.type = "sine";
                      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                      osc.start();
                      osc.stop(audioCtx.currentTime + 0.1);
                    } catch (e) {}
                  }
                }
              }
            }
          }

          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, 640, 440);
              ctx.drawImage(webcam.canvas, 0, 0, 640, 440);
            }
          }
          animationId = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        setCurrentStatus("CAMERA ACCESSED DENIED");
      }
    };

    setupAI();

    return () => {
      if (webcam) webcam.stop();
      cancelAnimationFrame(animationId);
    };
  }, [activeKey]);

  const handleStartStop = () => {
    if (!isTraining) {
      trackingRef.current.counter = exerciseCounts[activeKey];
      trackingRef.current.stage = "up";
      setIsTraining(true);
    } else {
      setIsTraining(false);
    }
  };

  const handleReset = () => {
    setIsTraining(false);
    setTimer(0);
    trackingRef.current.counter = 0;
    trackingRef.current.stage = "up";
    setExerciseCounts((prev) => ({ ...prev, [activeKey]: 0 }));
    setCurrentBars([]);
    setCurrentStatus("READY TO START");
  };

  // Kalkulasi Akurasi Tertinggi untuk HUD Tengah
  const highestAccuracy = currentBars.length > 0 ? Math.max(...currentBars.map(b => b.value)) : 0;
  
  // Kalkulasi Session Total
  const totalSessionReps = Object.values(exerciseCounts).reduce((a, b) => a + b, 0);
  const totalScore = totalSessionReps * 10;

  // Format Timer output mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans select-none antialiased">
      
      {/* 2. TOPBAR HEADER ACCORDING TO image_5a90a0.png */}
      <div className="flex justify-between items-center bg-[#121212] border-2 border-yellow-400/20 rounded-md p-3 mb-4 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black italic tracking-tighter uppercase text-white">FIT</span>
          <span className="text-2xl font-black italic tracking-tighter uppercase text-yellow-400 bg-yellow-400/10 px-2 rounded-sm border border-yellow-400/30">AI</span>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded text-xs font-black uppercase tracking-wider animate-pulse">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          Live
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID SYSTEM */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* ================= SIDEBAR KIRI ================= */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-[#121212] border-2 border-yellow-400 p-4 rounded-sm">
            <h2 className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-4">PILIH LATIHAN</h2>
            <div className="space-y-3">
              {Object.entries(EXERCISES_DATA).map(([key, item]) => {
                const isActive = activeKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (!isTraining) {
                        setActiveKey(key as any);
                        setCurrentBars([]);
                      }
                    }}
                    disabled={isTraining}
                    className={`w-full text-left p-3 border transition-all flex justify-between items-center ${
                      isActive 
                        ? 'bg-green-500 border-green-400 text-black font-black' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-yellow-400/50 disabled:opacity-50'
                    }`}
                  >
                    <div>
                      <h3 className={`text-base font-black uppercase italic ${isActive ? 'text-black' : 'text-zinc-100'}`}>{item.name}</h3>
                      <p className={`text-[10px] tracking-tight ${isActive ? 'text-black/70' : 'text-zinc-500'}`}>{item.sub}</p>
                    </div>
                    <span className={`text-xl font-black italic px-3 py-1 rounded ${isActive ? 'bg-black/10 text-black' : 'bg-black text-yellow-400'}`}>
                      {exerciseCounts[key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SESSION TOTAL HOVER HUD ACCORDING TO image_5a90a0.png */}
          <div className="bg-yellow-400 text-black p-4 rounded-sm font-black">
            <h2 className="text-xs uppercase tracking-widest text-black/60 mb-4">SESSION TOTAL</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="border-r border-black/20">
                <p className="text-[10px] text-black/60 uppercase">Total Reps</p>
                <p className="text-3xl italic tracking-tighter mt-1">{totalSessionReps}</p>
              </div>
              <div>
                <p className="text-[10px] text-black/60 uppercase">Skor</p>
                <p className="text-3xl italic tracking-tighter mt-1">{totalScore}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RADAR / CAMERA FEED TENGAH ================= */}
        <div className="xl:col-span-6 bg-[#121212] border-2 border-yellow-400 p-4 rounded-sm relative flex flex-col items-center">
          
          {/* Ornamen Pojok Bingkai Sesuai Gambar */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-yellow-400"></div>
          <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-zinc-700"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-zinc-700"></div>
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-yellow-400"></div>

          <div className="bg-yellow-400 text-black text-sm font-black uppercase italic tracking-widest px-8 py-2 mb-4 shadow-md">
            {currentEx.name}
          </div>

          {/* Canvas Tembak Kamera Core */}
          <div className="relative w-full max-w-[640px] aspect-[4/3] bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} width={640} height={440} className="w-full h-full object-cover transform scale-x-[-1]" />
            {!isTraining && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 pointer-events-none">
                <svg className="w-12 h-12 text-yellow-400 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 002-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest bg-black px-3 py-1 border border-yellow-400/20">CAMERA FEED READY</span>
              </div>
            )}
          </div>

          {/* REPS & STAGE INNER BOX HUD BOTTOM */}
          <div className="w-full max-w-md bg-black border-2 border-yellow-400/80 p-3 mt-4 grid grid-cols-3 text-center items-center shadow-lg divide-x-2 divide-yellow-400/30">
            <div>
              <p className="text-[9px] text-zinc-500 font-bold uppercase">Reps</p>
              <p className="text-2xl font-black italic text-yellow-400 mt-1 tabular-nums">{exerciseCounts[activeKey]}</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-500 font-bold uppercase">Stage</p>
              <p className="text-2xl font-black italic text-white uppercase mt-1">{trackingRef.current.stage}</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-500 font-bold uppercase">Akurasi</p>
              <p className="text-2xl font-black italic text-yellow-400 mt-1 tabular-nums">{(highestAccuracy * 100).toFixed(0)}%</p>
            </div>
          </div>

          {/* BUTTON CONTROLLER ACTIONS */}
          <div className="w-full max-w-md grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={handleStartStop}
              className={`w-full py-3 font-black uppercase text-sm italic tracking-wider transition-all duration-300 border-2 ${
                isTraining 
                  ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' 
                  : 'bg-green-600 border-green-500 text-black hover:bg-green-500 shadow-[0_0_20px_rgba(22,163,74,0.2)]'
              }`}
            >
              {isTraining ? "■ Berhenti" : "▶ Mulai Latihan"}
            </button>
            <button
              onClick={handleReset}
              className="w-full bg-[#121212] border-2 border-orange-500 text-orange-400 hover:bg-orange-500/10 font-black uppercase text-sm italic tracking-wider transition-all duration-300"
            >
              ⟲ Reset
            </button>
          </div>
        </div>

        {/* ================= MONITOR RIGHT CONSOLE ================= */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* TELEMETRY HUD REPS NOW */}
          <div className="bg-yellow-400 text-black p-4 rounded-sm flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">REPETISI SEKARANG</p>
            <span className="text-7xl font-black italic tracking-tighter leading-none my-3 tabular-nums text-black">
              {exerciseCounts[activeKey]}
            </span>
            <span className="text-xs font-black uppercase italic text-black/80">{currentEx.name}</span>
          </div>

          {/* STAGE HUD */}
          <div className="bg-orange-500 text-black px-4 py-3 rounded-sm flex justify-between items-center font-black">
            <span className="text-[10px] uppercase tracking-wider text-black/60">MOVEMENT STAGE</span>
            <span className="text-2xl uppercase italic tracking-tighter text-black">{trackingRef.current.stage}</span>
          </div>

          {/* TIMER HUD */}
          <div className="bg-black border-2 border-zinc-800 p-4 rounded-sm flex justify-between items-center font-mono">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">⏱ WAKTU</span>
            <span className="text-3xl font-bold tracking-tighter text-white">{formatTime(timer)}</span>
          </div>

          {/* AI DETECTION GRAPH STATUS */}
          <div className="bg-[#121212] border-2 border-zinc-800 p-4 rounded-sm space-y-4">
            <h3 className="text-xs font-black text-yellow-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
              AI DETECTION TELEMETRY // {currentStatus}
            </h3>
            <div className="space-y-3">
              {currentBars.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-600 font-bold uppercase tracking-widest">
                  NO LIVE DATA INPUT
                </div>
              ) : (
                currentBars.map((bar, index) => {
                  const percentage = (bar.value * 100).toFixed(0);
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">{bar.label}</span>
                        <span className="text-xs font-mono font-bold text-yellow-400">{percentage}%</span>
                      </div>
                      <div className="w-full h-4 bg-black border border-zinc-800 p-[2px]">
                        <div
                          className={`h-full transition-all duration-75 ${bar.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* REALTIME TRAINING LOGGER */}
          <div className="bg-[#121212] border-2 border-zinc-800 p-4 rounded-sm">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-3">
              LOG LATIHAN SESSION
            </h3>
            <div className="h-32 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {logs.length === 0 ? (
                <p className="text-[10px] text-zinc-600 italic text-center py-4">Belum ada repetisi terdeteksi...</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="bg-black/50 border border-zinc-900 p-2 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold uppercase tracking-tight text-zinc-300">{log.name}</p>
                      <p className="text-[9px] text-zinc-600">{log.time}</p>
                    </div>
                    <span className="font-mono font-black bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-400/20">
                      REP {log.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}