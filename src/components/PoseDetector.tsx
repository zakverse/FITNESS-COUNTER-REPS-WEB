import { useEffect, useRef, useState } from "react";
import * as tmPose from "@teachablemachine/pose";

interface PoseDetectorProps {
  modelUrl: string;
  onCheckRep: (prediction: any[], stage: string) => { nextStage: string; status: string; isRep: boolean } | null;
}

export default function PoseDetector({ modelUrl, onCheckRep }: PoseDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("INITIALIZING");
  const [accuracy, setAccuracy] = useState(0);
  
  // Ref untuk menyimpan data tanpa memicu re-render yang bikin lag
  const logicRef = useRef({ stage: "up", counter: 0, lastRepTime: 0 });

  useEffect(() => {
    let webcam: tmPose.Webcam;
    let model: tmPose.CustomPoseNet;
    let animationId: number;

    const init = async () => {
      try {
        // Load model dan metadata dari Teachable Machine
        model = await tmPose.load(modelUrl + "model.json", modelUrl + "metadata.json");
        
        // Setup ukuran kamera (480px biar smooth di browser)
        const size = 480; 
        const flip = true; // Mirroring kamera
        webcam = new tmPose.Webcam(size, size, flip); 
        
        await webcam.setup(); 
        await webcam.play();
        setStatus("READY");

        const loop = async () => {
          webcam.update(); // Update frame kamera

          // Estimasi kerangka pose tubuh
          const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
          const prediction = await model.predict(posenetOutput);

          // Cari probabilitas tertinggi untuk ditampilkan di HUD akurasi
          if (prediction && prediction.length > 0) {
            const probabilities = prediction.map(p => p.probability); // Ambil probabilitas tertinggi dari semua kelas
            setAccuracy(Math.max(...probabilities)); // Update akurasi tertinggi untuk HUD
          } else {
            setAccuracy(0); // Jika tidak ada prediksi, set akurasi ke 0% untuk menandakan ketidakpastian model
          }

          // Atur batasan minimal keypoint manusia terdeteksi (Confidence Score)
          const minConfidence = 0.65; 
          const now = Date.now();

          if (pose && pose.score > minConfidence) {
            // KIRIM SELURUH ARRAY PREDICTION KE LOGIC EXERCISEPAGE
            const result = onCheckRep(prediction, logicRef.current.stage);
            
            if (result) {
              logicRef.current.stage = result.nextStage;
              setStatus(result.status);

              // Jika gerakan dinyatakan selesai (isRep = true)
              if (result.isRep) {
                // Cooldown 600ms biar pas badannya goyang dikit gak kehitung dua kali
                if (now - logicRef.current.lastRepTime > 600) {
                  logicRef.current.counter++;
                  logicRef.current.lastRepTime = now;
                  setReps(logicRef.current.counter);

                  // Efek Suara Ding/Beep Khas Aplikasi Olahraga
                  try {
                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = audioCtx.createOscillator();
                    osc.connect(audioCtx.destination);
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.1);
                  } catch (audioErr) {
                    console.log("Audio blocked by browser auto-play policy");
                  }
                }
              }
            }
          }

          // Render visual ke dalam Canvas HTML5
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, size, size);
              ctx.drawImage(webcam.canvas, 0, 0);
              
              // Gambar garis skeleton warna Kuning Neon khusus
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
        console.error("Gagal menjalankan kamera/AI:", err);
        setStatus("CAMERA ERROR");
      }
    };

    init();

    // Jalankan pembersihan (cleanup) pas ganti halaman biar memori / kamera mati bersih
    return () => {
      if (webcam) webcam.stop();
      cancelAnimationFrame(animationId);
    };
  }, [modelUrl, onCheckRep]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Tampilan HUD Skor Repetisi */}
      <div className="flex items-baseline gap-6 mb-10 text-center">
        <span className="text-[14rem] font-black italic leading-[0.7] text-[#e2ff3d] tracking-tighter tabular-nums">
          {reps}
        </span>
        <div className="flex flex-col text-left border-l-4 border-[#e2ff3d] pl-4">
          <span className="text-3xl font-black italic text-white uppercase leading-none">Reps</span>
          <span className="text-[#e2ff3d] font-bold text-[10px] mt-2 tracking-widest opacity-80">
            CONFIDENCE: {(accuracy * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Frame Kotak Kamera Elit */}
      <div className="relative w-full max-w-[480px] aspect-square bg-zinc-900 border-2 border-zinc-800 shadow-[0_0_80px_rgba(226,255,61,0.06)] overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={480} 
          height={480} 
          className="w-full h-full object-cover grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition-all duration-700" 
        />
        
        {/* Indikator Status di Pojok Kiri Atas */}
        <div className="absolute top-0 left-0 bg-[#e2ff3d] text-black px-4 py-1 text-[10px] font-black uppercase italic tracking-tighter">
          SYSTEM LIVE // {status}
        </div>

        {/* Ornamen Teks Dekorasi ala Cyberpunk Sport */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
          <span>TRACKING_CORE_V5</span>
          <span>VITE_ENGINE</span>
        </div>
      </div>

      <p className="mt-14 text-zinc-800 font-black text-[10px] uppercase tracking-[0.8em]">
        Do not compromise on form
      </p>
    </div>
  );
}