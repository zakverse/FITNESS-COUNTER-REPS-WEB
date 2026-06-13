import { useParams, Link } from 'react-router-dom';
import PoseDetector from '../components/PoseDetector';

interface RepResult {
  nextStage: string;
  status: string;
  isRep: boolean;
  currentBars: { label: string; value: number }[];
}

const EXERCISES = {
  pushup: { 
    name: "Push Up", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/ho-trLhwI/",
    // Class: 0 = Push Up - Atas, 1 = Push Up - Bawah, 2 = Netral
    checkRep: (prediction: any[], stage: string): RepResult => {
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
        status = "RESTING / NETRAL";
      }

      return {
        nextStage,
        status,
        isRep,
        currentBars: [
          { label: "Push Up - Atas", value: probUp },
          { label: "Push Up - Bawah", value: probDown },
          { label: "Netral", value: probNetral }
        ]
      };
    }
  },
  squat: { 
    name: "Squat", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/_fec-xp2u/",
    // Class: 0 = Squat-Berdiri, 1 = Squat-Turun, 2 = Netral (Asumsi standar tim lu)
    checkRep: (prediction: any[], stage: string): RepResult => {
      const probUp = prediction[0]?.probability || 0;
      const probDown = prediction[1]?.probability || 0;
      const probNetral = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = stage === "up" ? "STAND" : "DEEP SQUAT";
      let isRep = false;

      if (probNetral < 0.5) {
        if (probDown > 0.95 && stage !== "down") {
          nextStage = "down";
          status = "GO DOWN!";
        }
        if (probUp > 0.95 && stage === "down") {
          nextStage = "up";
          status = "REP COUNTED!";
          isRep = true;
        }
      }

      return {
        nextStage,
        status,
        isRep,
        currentBars: [
          { label: "Squat-Berdiri", value: probUp },
          { label: "Squat-Turun", value: probDown },
          { label: "Netral", value: probNetral }
        ]
      };
    }
  },
  situp: { 
    name: "Sit Up", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/uk8veRyZx/",
    // Class: 0 = Sit Up Rebahan, 1 = Sit Up Duduk, 2 = Netral
    checkRep: (prediction: any[], stage: string): RepResult => {
      const probDown = prediction[0]?.probability || 0; // Rebahan (Bawah)
      const probUp = prediction[1]?.probability || 0;   // Duduk (Atas)
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
          status = "UP / CRUNCH!";
          isRep = true;
        }
      }

      return {
        nextStage,
        status,
        isRep,
        currentBars: [
          { label: "Sit Up Rebahan", value: probDown },
          { label: "Sit Up Duduk", value: probUp },
          { label: "Netral", value: probNetral }
        ]
      };
    }
  },
  jj: { 
    name: "Jumping Jack", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/jZHgQNIHN/",
    // Class: 0 = Jumping-Jack-lompat, 1 = Jumping-Jack-Berdiri, 2 = Jumping-jack-berdiri-tangan-atas
    checkRep: (prediction: any[], stage: string): RepResult => {
      const probLompat = prediction[0]?.probability || 0;
      const probBerdiri = prediction[1]?.probability || 0;
      const probTanganAtas = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = "START";
      let isRep = false;

      // Logic gabungan: Lompat atau Tangan Atas memicu status 'down'
      if ((probLompat > 0.92 || probTanganAtas > 0.92) && stage !== "down") {
        nextStage = "down";
        status = "JUMPING!";
      }
      if (probBerdiri > 0.95 && stage === "down") {
        nextStage = "up";
        status = "EXCELLENT!";
        isRep = true;
      }

      return {
        nextStage,
        status,
        isRep,
        currentBars: [
          { label: "Jumping-Jack-lompat", value: probLompat },
          { label: "Jumping-Jack-Berdiri", value: probBerdiri },
          { label: "Jumping-jack-tangan-atas", value: probTanganAtas }
        ]
      };
    }
  },
  lunge: { 
    name: "Lunges", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/lQEGyOvNo/",
    // Class: 0 = Lunges, 1 = Berdiri
    checkRep: (prediction: any[], stage: string): RepResult => {
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
        status = "STEP UP!";
        isRep = true;
      }

      return {
        nextStage,
        status,
        isRep,
        currentBars: [
          { label: "Lunges", value: probDown },
          { label: "Berdiri", value: probUp }
        ]
      };
    }
  }
};

export default function ExercisePage() {
  const { exercise } = useParams();
  const data = EXERCISES[exercise as keyof typeof EXERCISES];

  if (!data) return <div className="p-10 font-black text-white bg-zinc-950 min-h-screen flex items-center justify-center">EXERCISE NOT FOUND</div>;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center p-6 md:p-12">
      <header className="w-full max-w-5xl flex justify-between items-center mb-10 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-[#00f3ff]">{data.name}</h1>
          <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Cybernetic Tracking Active</p>
        </div>
        <Link to="/" className="text-[10px] font-black tracking-widest border border-zinc-800 px-4 py-2 hover:bg-[#ff0055] hover:text-white hover:border-[#ff0055] transition-all duration-300 bg-zinc-900/50">
          TERMINATE
        </Link>
      </header>
      
      <PoseDetector modelUrl={data.modelUrl} onCheckRep={data.checkRep} />
    </main>
  );
}