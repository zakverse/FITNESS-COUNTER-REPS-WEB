import { useEffect, useRef, useState } from "react";
import * as tmPose from "@teachablemachine/pose";

export default function PoseDetector({ modelUrl }: { modelUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("INITIALIZING");
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

          // Logic 96% Akurasi & Confidence Score
          if (pose && pose.score > 0.75) {
            if (prediction[1].probability > 0.96 && logicRef.current.stage !== "down") {
              logicRef.current.stage = "down";
              setStatus("GO DOWN");
            } else if (prediction[0].probability > 0.96 && logicRef.current.stage === "down") {
              const now = Date.now();
              if (now - logicRef.current.lastRepTime > 600) {
                logicRef.current.counter++;
                logicRef.current.stage = "up";
                logicRef.current.lastRepTime = now;
                setReps(logicRef.current.counter);
                setStatus("GOOD REP!");
              }
            }
          }

          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              ctx.drawImage(webcam.canvas, 0, 0);
              if (pose) {
                ctx.strokeStyle = "#e2ff3d";
                ctx.lineWidth = 3;
                tmPose.drawKeypoints(pose.keypoints, 0.5, ctx);
                tmPose.drawSkeleton(pose.keypoints, 0.5, ctx);
              }
            }
          }
          animationId = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) { setStatus("CAMERA ERROR"); }
    };

    init();
    return () => { webcam?.stop(); cancelAnimationFrame(animationId); };
  }, [modelUrl]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-baseline gap-6 mb-10 text-center">
        <span className="text-[12rem] font-black italic leading-[0.7] text-[#e2ff3d] tracking-tighter tabular-nums">{reps}</span>
        <span className="text-3xl font-black italic text-white uppercase">Reps</span>
      </div>
      <div className="relative w-full max-w-[480px] aspect-square bg-zinc-900 border-2 border-zinc-800">
        <canvas ref={canvasRef} width={480} height={480} className="w-full h-full object-cover grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition-all duration-700" />
        <div className="absolute top-0 left-0 bg-[#e2ff3d] text-black px-4 py-1 text-[10px] font-black uppercase italic tracking-tighter">Live Tracking // {status}</div>
      </div>
    </div>
  );
}