import { useParams, Link } from 'react-router-dom';
import PoseDetector from '../components/PoseDetector';

interface RepResult {
  nextStage: string;
  status: string;
  isRep: boolean;
}

const EXERCISES = {
  pushup: { 
    name: "Push Up", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/ho-trLhwI/",
    // Push Up dibikin ketat (0.97) biar pas posisi plank diem gak nambah sendiri
    checkRep: (probUp: number, probDown: number, stage: string): RepResult | null => {
      if (probDown > 0.97 && stage !== "down") return { nextStage: "down", status: "GO DOWN", isRep: false };
      if (probUp > 0.95 && stage === "down") return { nextStage: "up", status: "GOOD REP!", isRep: true };
      return null;
    }
  },
  squat: { 
    name: "Squat", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/_fec-xp2u/",
    // Squat diturunin dikit (0.93) biar pas paha sejajar lantai langsung ke-trigger down
    checkRep: (probUp: number, probDown: number, stage: string): RepResult | null => {
      if (probDown > 0.93 && stage !== "down") return { nextStage: "down", status: "DEEP SQUAT", isRep: false };
      if (probUp > 0.95 && stage === "down") return { nextStage: "up", status: "STAND UP", isRep: true };
      return null;
    }
  },
  situp: { 
    name: "Sit Up", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/uk8veRyZx/",
    checkRep: (probUp: number, probDown: number, stage: string): RepResult | null => {
      if (probDown > 0.95 && stage !== "down") return { nextStage: "down", status: "LAY DOWN", isRep: false };
      if (probUp > 0.95 && stage === "down") return { nextStage: "up", status: "CRUNCH!", isRep: true };
      return null;
    }
  },
  jj: { 
    name: "Jumping Jack", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/jZHgQNIHN/",
    // Jumping Jack gerakannya cepet, dipasang agak rendah (0.90) biar gak ada rep yang lolos
    checkRep: (probUp: number, probDown: number, stage: string): RepResult | null => {
      if (probDown > 0.90 && stage !== "down") return { nextStage: "down", status: "HANDS UP", isRep: false };
      if (probUp > 0.92 && stage === "down") return { nextStage: "up", status: "RESET", isRep: true };
      return null;
    }
  },
  lunge: { 
    name: "Lunges", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/lQEGyOvNo/",
    checkRep: (probUp: number, probDown: number, stage: string): RepResult | null => {
      if (probDown > 0.94 && stage !== "down") return { nextStage: "down", status: "LUNGE DOWN", isRep: false };
      if (probUp > 0.95 && stage === "down") return { nextStage: "up", status: "GOOD FORM", isRep: true };
      return null;
    }
  }
};

export default function ExercisePage() {
  const { exercise } = useParams();
  const data = EXERCISES[exercise as keyof typeof EXERCISES];

  if (!data) return <div className="p-10 font-black text-white bg-black min-h-screen">NOT FOUND</div>;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <header className="w-full max-w-lg flex justify-between items-center mb-10 border-b border-zinc-900 pb-4">
        <h1 className="text-sm font-black uppercase italic tracking-widest text-zinc-500">{data.name} SESSION</h1>
        <Link to="/" className="text-[10px] font-bold border border-zinc-800 px-3 py-1 hover:bg-[#e2ff3d] hover:text-black transition-all">EXIT</Link>
      </header>
      {/* Lempar fungsi custom ke PoseDetector */}
      <PoseDetector modelUrl={data.modelUrl} onCheckRep={data.checkRep} />
    </main>
  );
}