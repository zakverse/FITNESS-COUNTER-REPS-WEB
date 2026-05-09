"use client";
import { useEffect, useRef, useState } from "react";
import * as tmPose from "@teachablemachine/pose";

export default function PoseDetector({ modelUrl }: { modelUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("INITIALIZING");
  const [accuracy, setAccuracy] = useState(0);
  
  // Ref untuk logic agar tidak memicu re-render yang bikin lag
  const logicRef = useRef({ 
    stage: "up", 
    counter: 0,
    lastRepTime: 0 // Untuk mencegah double counting dalam waktu singkat
  });

  useEffect(() => {
    let webcam: tmPose.Webcam;
    let model: tmPose.CustomPoseNet;
    let animationId: number;

    const init = async () => {
      try {
        // Load model Teachable Machine
        model = await tmPose.load(modelUrl + "model.json", modelUrl + "metadata.json");
        
        // Setting resolusi 480px: Balance antara smooth dan visual gede
        const size = 480; 
        webcam = new tmPose.Webcam(size, size, true); 
        
        await webcam.setup(); 
        await webcam.play();
        setStatus("READY");

        const loop = async () => {
          webcam.update(); 

          // Estimasi pose dengan PoseNet
          const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
          const prediction = await model.predict(posenetOutput);

          // Ambil probabilitas untuk UI
          const probUp = prediction[0].probability;
          const probDown = prediction[1].probability;
          setAccuracy(Math.max(probUp, probDown));

          // LOGIC REPETISI DIPERKETAT
          // 1. Cek Confidence Score: AI harus yakin itu manusia (min 0.75)
          // 2. Threshold Tinggi: Harus 96% yakin posisinya benar biar gak bocor
          const minConfidence = 0.75;
          const threshold = 0.96;
          const now = Date.now();

          if (pose && pose.score > minConfidence) {
            // Deteksi posisi DOWN
            if (probDown > threshold && logicRef.current.stage !== "down") {
              logicRef.current.stage = "down";
              setStatus("GO DOWN");
            } 
            // Deteksi kembali ke posisi UP (Repetisi Selesai)
            else if (probUp > threshold && logicRef.current.stage === "down") {
              // Cooldown 600ms supaya gak kehitung dua kali kalau gerakan goyang
              if (now - logicRef.current.lastRepTime > 600) {
                logicRef.current.counter++;
                logicRef.current.stage = "up";
                logicRef.current.lastRepTime = now;
                setReps(logicRef.current.counter);
                setStatus("GOOD REP!");
                
                // Beep Sound (Khas Aplikasi Sport)
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

          // RENDER CANVAS OPTIMIZED
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              ctx.drawImage(webcam.canvas, 0, 0);
              
              // Gambar Skeleton Kuning Neon
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
        console.error("AI Error:", err);
        setStatus("CAMERA ERROR");
      }
    };

    init();

    // Cleanup: Matikan webcam saat pindah route biar memori aman
    return () => {
      if (webcam) webcam.stop();
      cancelAnimationFrame(animationId);
    };
  }, [modelUrl]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Statistik Repetisi Raksasa */}
      <div className="flex items-baseline gap-6 mb-10">
        <span className="text-[16rem] font-black italic leading-[0.7] text-[#e2ff3d] tracking-tighter tabular-nums">
          {reps}
        </span>
        <div className="flex flex-col border-l-4 border-[#e2ff3d] pl-4">
          <span className="text-3xl font-black italic text-white uppercase leading-none">Reps</span>
          <span className="text-[#e2ff3d] font-bold text-[10px] mt-2 tracking-widest opacity-80">
            CONFIDENCE: {(accuracy * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Frame Kamera Sporty */}
      <div className="relative w-full max-w-[480px] aspect-square bg-zinc-900 border-2 border-zinc-800 shadow-[0_0_80px_rgba(226,255,61,0.08)]">
        <canvas 
          ref={canvasRef} 
          width={480} 
          height={480} 
          className="w-full h-full object-cover grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition-all duration-1000" 
        />
        
        {/* Status Tag */}
        <div className="absolute top-0 left-0 bg-[#e2ff3d] text-black px-4 py-1 text-[10px] font-black uppercase tracking-tighter italic">
          Live Tracking // {status}
        </div>

        {/* Technical Deco */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
          <span>Neural_Net_Active</span>
          <span>480px_60fps_opt</span>
        </div>
      </div>

      <p className="mt-16 text-zinc-800 font-black text-[10px] uppercase tracking-[0.8em]">
        Do not compromise on form
      </p>
    </div>
  );
}