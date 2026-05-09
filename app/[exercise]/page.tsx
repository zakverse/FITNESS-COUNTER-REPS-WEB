"use client";
import { useParams } from 'next/navigation';
import { EXERCISES } from '@/constants/exerciseData';
import PoseDetector from '@/components/PoseDetector';
import Link from 'next/link';

export default function ExercisePage() {
  const params = useParams();
  const slug = params.exercise as string;
  const data = EXERCISES[slug as keyof typeof EXERCISES];

  if (!data) return <div className="bg-black min-h-screen flex items-center justify-center font-black">NOT FOUND</div>;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6 md:p-10">
      {/* Header Kecil & Rapis */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 bg-[#e2ff3d] animate-pulse rounded-full"></div>
          <h1 className="text-sm font-black uppercase tracking-[0.3em] italic">{data.name} <span className="text-zinc-500">Session</span></h1>
        </div>
        <Link href="/" className="text-[10px] font-black uppercase tracking-widest border border-zinc-800 px-4 py-2 hover:bg-[#e2ff3d] hover:text-black transition-all">
          Stop Training
        </Link>
      </header>

      {/* Komponen Utama */}
      <div className="w-full max-w-4xl flex flex-col items-center">
        <PoseDetector modelUrl={data.modelUrl} />
      </div>
    </main>
  );
}