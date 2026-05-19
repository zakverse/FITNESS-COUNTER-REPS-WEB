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
    // Menyesuaikan dengan Class: prediction[0] = Push Up - Atas, prediction[1] = Push Up - Bawah
    checkRep: (prediction: any[], stage: string): RepResult | null => {
      const probUp = prediction[0]?.probability || 0;
      const probDown = prediction[1]?.probability || 0;

      if (probDown > 0.95 && stage !== "down") {
        return { nextStage: "down", status: "GO DOWN", isRep: false };
      }
      if (probUp > 0.95 && stage === "down") {
        return { nextStage: "up", status: "GOOD REP!", isRep: true };
      }
      return null;
    }
  },
  squat: { 
    name: "Squat", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/_fec-xp2u/",
    // Menyesuaikan dengan Class: prediction[0] = Squat-Berdiri, prediction[1] = Squat-Turun
    checkRep: (prediction: any[], stage: string): RepResult | null => {
      const probUp = prediction[0]?.probability || 0;
      const probDown = prediction[1]?.probability || 0;

      if (probDown > 0.95 && stage !== "down") {
        return { nextStage: "down", status: "DEEP SQUAT", isRep: false };
      }
      if (probUp > 0.95 && stage === "down") {
        return { nextStage: "up", status: "STAND UP", isRep: true };
      }
      return null;
    }
  },
  situp: { 
    name: "Sit Up", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/uk8veRyZx/",
    // Menyesuaikan dengan Class: prediction[0] = Sit Up Rebah..., prediction[1] = Sit Up Duduk
    checkRep: (prediction: any[], stage: string): RepResult | null => {
      const probDown = prediction[0]?.probability || 0; // Posisi rebahan dianggap state bawah
      const probUp = prediction[1]?.probability || 0;   // Posisi duduk dianggap state atas

      if (probDown > 0.95 && stage !== "down") {
        return { nextStage: "down", status: "LAY DOWN", isRep: false };
      }
      if (probUp > 0.95 && stage === "down") {
        return { nextStage: "up", status: "CRUNCH!", isRep: true };
      }
      return null;
    }
  },
  jj: { 
    name: "Jumping Jack", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/jZHgQNIHN/",
    // Menyesuaikan dengan Class: prediction[0] = Jumpi...Jack-lompat, prediction[1] = Jumpi...Jack-Berdiri
    checkRep: (prediction: any[], stage: string): RepResult | null => {
      const probDown = prediction[0]?.probability || 0; // Saat lompat/tangan di atas
      const probUp = prediction[1]?.probability || 0;   // Saat berdiri tegak biasa

      if (probDown > 0.92 && stage !== "down") {
        return { nextStage: "down", status: "JUMP!", isRep: false };
      }
      if (probUp > 0.92 && stage === "down") {
        return { nextStage: "up", status: "RESET", isRep: true };
      }
      return null;
    }
  },
  lunge: { 
    name: "Lunges", 
    modelUrl: "https://teachablemachine.withgoogle.com/models/lQEGyOvNo/",
    // Menyesuaikan dengan Class: prediction[0] = Lunges, prediction[1] = Berdiri
    checkRep: (prediction: any[], stage: string): RepResult | null => {
      const probDown = prediction[0]?.probability || 0; // Posisi lunge turun
      const probUp = prediction[1]?.probability || 0;   // Posisi berdiri tegak

      if (probDown > 0.95 && stage !== "down") {
        return { nextStage: "down", status: "LUNGE DOWN", isRep: false };
      }
      if (probUp > 0.95 && stage === "down") {
        return { nextStage: "up", status: "STAND UP", isRep: true };
      }
      return null;
    }
  }
};

export default function ExercisePage() {
  const { exercise } = useParams();
  const data = EXERCISES[exercise as keyof typeof EXERCISES];

  if (!data) return <div className="p-10 font-black text-white bg-black min-h-screen flex items-center justify-center">NOT FOUND</div>;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <header className="w-full max-w-lg flex justify-between items-center mb-10 border-b border-zinc-900 pb-4">
        <h1 className="text-sm font-black uppercase italic tracking-widest text-zinc-500">{data.name} SESSION</h1>
        <Link to="/" className="text-[10px] font-bold border border-zinc-800 px-3 py-1 hover:bg-[#e2ff3d] hover:text-black transition-all">EXIT</Link>
      </header>
      <PoseDetector modelUrl={data.modelUrl} onCheckRep={data.checkRep} />
    </main>
  );
}