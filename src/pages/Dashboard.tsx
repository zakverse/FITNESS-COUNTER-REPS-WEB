import { Link } from 'react-router-dom';

const EXERCISES = {
  pushup: { name: "Push Up", modelUrl: "https://teachablemachine.withgoogle.com/models/ho-trLhwI/" },
  squat: { name: "Squat", modelUrl: "https://teachablemachine.withgoogle.com/models/_fec-xp2u/" },
  situp: { name: "Sit Up", modelUrl: "https://teachablemachine.withgoogle.com/models/uk8veRyZx/" },
  jj: { name: "Jumping Jack", modelUrl: "https://teachablemachine.withgoogle.com/models/jZHgQNIHN/" },
  lunge: { name: "Lunges", modelUrl: "https://teachablemachine.withgoogle.com/models/lQEGyOvNo/" }
};

export default function Dashboard() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
      <h1 className="text-7xl font-black italic mb-16 leading-none text-center uppercase tracking-tighter">
        PUSH <br/><span className="text-[#e2ff3d]">LIMITS.</span>
      </h1>
      <div className="w-full max-w-sm space-y-2">
        {Object.entries(EXERCISES).map(([key, data]) => (
          <Link to={`/${key}`} key={key} className="block border border-zinc-800 p-6 hover:bg-[#e2ff3d] hover:text-black transition-all">
            <h2 className="text-2xl font-black uppercase italic text-center tracking-tight">{data.name}</h2>
          </Link>
        ))}
      </div>
    </main>
  );
}