import { useEffect, useRef, useState } from "react";
import * as tmPose from "@teachablemachine/pose";

interface BarData {
  label: string;
  value: number;
}

interface PoseDetectorProps {
  modelUrl: string;
  onCheckRep: (prediction: any[], stage: string) => { nextStage: string; status: string; isRep: boolean; currentBars: BarData[] };
}

export default function PoseDetector({ modelUrl, onCheckRep }: PoseDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("INITIALIZING");
  const [bars, setBars] = useState<BarData[]>([]);
  
  const logicRef = useRef({ stage: "up", counter: 0, lastRepTime: 0 });

  useEffect(() => {
    let webcam: tmPose.Webcam;
    let model: tmPose.CustomPoseNet;
    let animationId: number;

    const init = async () => {
      try {
        model = await tmPose.load(modelUrl + "model.json", modelUrl + "metadata.json");
        
        const size = 480; 
        webcam = new tmPose.Webcam(size, size, true); 
        await webcam.setup(); 
        await webcam.play();
        setStatus("SYSTEM LIVE");

        const loop = async () => {
          webcam.update();
          const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
          const prediction = await model.predict(posenetOutput);

          const minConfidence = 0.65;
          const now = Date.now();

          if (pose && pose.score > minConfidence) {
            // Panggil logic dan ambil data bar dinamis
            const result = onCheckRep(prediction, logicRef.current.stage);
            
            if (result) {
              setBars(result.currentBars);
              logicRef.current.stage = result.nextStage;
              setStatus(result.status);

              if (result.isRep) {
                if (now - logicRef.current.lastRepTime > 650) {
                  logicRef.current.counter++;
                  logicRef.current.lastRepTime = now;
                  setReps(logicRef.current.counter);

                  // Beep sound
                  try {
                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = audioCtx.createOscillator();
                    osc.connect(audioCtx.destination);
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.15);
                  } catch (e) {}
                }
              }
            }
          }

          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, size, size);
              ctx.drawImage(webcam.canvas, 0, 0);
              if (pose) {
                ctx.strokeStyle = logicRef.current.stage === "down" ? "#ff0055" : "#00f3ff";
                ctx.fillStyle = logicRef.current.stage === "down" ? "#ff0055" : "#00f3ff";
                ctx.lineWidth = 4;
                tmPose.drawKeypoints(pose.keypoints, 0.5, ctx);
                tmPose.drawSkeleton(pose.keypoints, 0.5, ctx);
              }
            }
          }
          animationId = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        setStatus("OFFLINE / CAMERA ERROR");
      }
    };

    init();
    return () => {
      if (webcam) webcam.stop();
      cancelAnimationFrame(animationId);
    };
  }, [modelUrl, onCheckRep]);

  return (
    <div className="w-full max-w-5xl grid grid-col-1 lg:grid-cols-12 gap-8 items-center">
      
      {/* SEKTOR KIRI: KAMERA TRACKING FRAME */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="relative w-full aspect-square bg-zinc-900 border border-zinc-800 shadow-[0_0_50px_rgba(0,243,255,0.03)] overflow-hidden rounded-sm">
          <canvas ref={canvasRef} width={480} height={480} className="w-full h-full object-cover brightness-75 contrast-125 grayscale-[20%]" />
          <div className={`absolute top-0 left-0 text-black px-3 py-1 text-[9px] font-black uppercase tracking-wider ${logicRef.current.stage === 'down' ? 'bg-[#ff0055]' : 'bg-[#00f3ff]'}`}>
            {status}
          </div>
        </div>
      </div>

      {/* SEKTOR TENGAH: SKOR REPETISI RAKSASA */}
      <div className="lg:col-span-3 flex flex-col items-center justify-center py-6 border-y lg:border-y-0 lg:border-x border-zinc-900">
        <span className={`text-[12rem] font-black italic leading-none tracking-tighter tabular-nums transition-colors duration-300 ${logicRef.current.stage === 'down' ? 'text-[#ff0055]' : 'text-[#00f3ff]'}`}>
          {reps}
        </span>
        <span className="text-zinc-500 text-xs font-bold tracking-[0.4em] uppercase -mt-2">REPETITIONS</span>
      </div>

      {/* SEKTOR KANAN: OUTPUT PROGRESS BARS (SINKRON DENGAN TEACHABLE MACHINE) */}
      <div className="lg:col-span-4 flex flex-col justify-center space-y-5 p-4 bg-zinc-900/30 border border-zinc-950/50 rounded-sm">
        <h3 className="text-zinc-400 font-black italic text-xs uppercase tracking-widest border-b border-zinc-900 pb-2">
          AI Realtime Output
        </h3>
        
        {bars.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">Waiting for telemetry data...</p>
        ) : (
          bars.map((bar, index) => {
            const percentage = (bar.value * 100).toFixed(0);
            const isHigh = bar.value > 0.85;
            
            // Set warna bar dinamis: Pink untuk gerakan target, Cyan untuk sisanya
            const barColor = bar.label.toLowerCase().includes('bawah') || bar.label.toLowerCase().includes('lompat')
              ? 'bg-[#ff0055]' 
              : 'bg-[#00f3ff]';

            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className={`text-xs font-bold tracking-tight uppercase ${isHigh ? 'text-zinc-100 font-black' : 'text-zinc-500'}`}>
                    {bar.label}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isHigh ? 'text-zinc-100' : 'text-zinc-600'}`}>
                    {percentage}%
                  </span>
                </div>
                <div className="w-full h-3 bg-zinc-900 border border-zinc-800 p-[2px] rounded-full">
                  <div 
                    className={`h-full rounded-full transition-all duration-75 ${barColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}