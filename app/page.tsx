import Link from 'next/link';
import { EXERCISES } from '@/constants/exerciseData';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <header className="mb-16">
          <p className="text-[#e2ff3d] font-bold tracking-[0.4em] text-[10px] mb-4 uppercase">AI Elite Performance</p>
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8] uppercase">
            PUSH <br /> <span className="text-[#e2ff3d]">LIMITS.</span>
          </h1>
        </header>
        
        <nav className="flex flex-col gap-2">
          {Object.entries(EXERCISES).map(([key, data]) => (
            <Link href={`/${key}`} key={key} className="group relative overflow-hidden border border-zinc-900 bg-zinc-900/20 py-6 transition-all hover:border-[#e2ff3d]">
              <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-2xl font-black uppercase italic tracking-tight group-hover:text-[#e2ff3d] transition-colors">
                  {data.name}
                </h2>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-1 group-hover:text-white">Start Session</span>
              </div>
              {/* Efek Background Hover */}
              <div className="absolute inset-0 translate-y-full bg-[#e2ff3d] transition-transform duration-300 group-hover:translate-y-[95%]"></div>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}