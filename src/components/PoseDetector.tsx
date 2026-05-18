import { useEffect, useRef, useState } from "react";
import * as tmPose from "@teachablemachine/pose";

interface PoseDetectorProps {
  modelUrl: string;
  onCheckRep: (probUp: number, probDown: number, stage: string) => { nextStage: string; status: string; isRep: boolean } | null;
}

export default function PoseDetector({ modelUrl, onCheckRep }: PoseDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("INITIALIZING");
  const [accuracy, setAccuracy] = useState(0);
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
        setStatus("READY");

        const loop = async () => {
          webcam.update();
          const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
          const prediction = await model.predict(posenetOutput);

          const probUp = prediction[0].probability;
          const probDown = prediction[1].probability;
          setAccuracy(Math.max(probUp, probDown));

          const minConfidence = 0.75;
          const now = Date.now();

          if (pose && pose.score > minConfidence) {
            // Jalankan fungsi logic dinamis bawaan tiap halaman olahraga
            const result = onCheckRep(probUp, probDown, logicRef.current.stage);
            
            if (result) {
              logicRef.current.stage = result.nextStage;
              setStatus(result.status);

              if (result.isRep) {
                // Cooldown 600ms biar pas badannya goyang gak kehitung double rep
                if (now - logicRef.current.lastRepTime > 600) {
                  logicRef.current.counter++;
                  logicRef.current.lastRepTime = now;
                  setReps(logicRef.current.counter);

                  // Audio Beep Khas Gym
                  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = audioCtx.createOscillator();
                  osc.connect(audioCtx.destination);
                  osc.type = "sine";
                  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                  osc.start();
                  osc.stop(audioCtx.currentTime + 0.1);
                }
              }
            }
          }

          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              ctx.drawImage(webcam.canvas, 0, 0);
              if (pose) {
                ctx.strokeStyle = "#e2ff3d";
                ctx.fillStyle = "#e2ff3d";
                ctx.lineWidth = 3;
                tmPose.drawKeypoints(pose.keypoints, 0.5, ctx);
                tmPose.drawSkeleton(pose.keypoints, 0.5, ctx);
              }
            }
          }
          animationId = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        setStatus("CAMERA ERROR");
      }
    };

    init();
    return () => {
      if (webcam) webcam.stop();
      cancelAnimationFrame(animationId);
    };
  }, [modelUrl, onCheckRep]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* HUD Reps raksasa di tengah atas */}
      <div className="flex items-baseline gap-6 mb-10 text-center">
        <span className="text-[14rem] font-black italic leading-[0.7] text-[#e2ff3d] tracking-tighter tabular-nums">
          {reps}
        </span>
        <div className="flex flex-col text-left border-l-4 border-[#e2ff3d] pl-4">
          <span className="text-3xl font-black italic text-white uppercase leading-none">Reps</span>
          <span className="text-[#e2ff3d] font-bold text-[10px] mt-2 tracking-widest opacity-80">
            CONF: {(accuracy * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Box Kamera Minimalis Hitam Kuning */}
      <div className="relative w-full max-w-[480px] aspect-square bg-zinc-900 border-2 border-zinc-800 shadow-[0_0_80px_rgba(226,255,61,0.06)] overflow-hidden">
        <canvas ref={canvasRef} width={480} height={480} className="w-full h-full object-cover grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition-all duration-700" />
        <div className="absolute top-0 left-0 bg-[#e2ff3d] text-black px-4 py-1 text-[10px] font-black uppercase italic tracking-tighter">
          SYSTEM LIVE // {status}
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
          <span>TRACKING_CORE_V4</span>
          <span>VITE_CORE</span>
        </div>
      </div>
    </div>
  );
}