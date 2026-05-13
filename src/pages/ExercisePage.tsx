import { useParams, Link } from 'react-router-dom';
import PoseDetector from '../components/PoseDetector';

const EXERCISES = {
  pushup: { name: "Push Up", modelUrl: "https://teachablemachine.withgoogle.com/models/ho-trLhwI/" },
  squat: { name: "Squat", modelUrl: "https://teachablemachine.withgoogle.com/models/_fec-xp2u/" },
  situp: { name: "Sit Up", modelUrl: "https://teachablemachine.withgoogle.com/models/uk8veRyZx/" },
  jj: { name: "Jumping Jack", modelUrl: "https://teachablemachine.withgoogle.com/models/jZHgQNIHN/" },
  lunge: { name: "Lunges", modelUrl: "https://teachablemachine.withgoogle.com/models/lQEGyOvNo/" }
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
      <PoseDetector modelUrl={data.modelUrl} />
    </main>
  );
}