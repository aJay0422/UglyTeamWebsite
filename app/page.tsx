import { TrainScene } from "@/components/train-scene";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full" style={{ backgroundColor: "#F6F0E6" }}>
      <TrainScene />

      {/* 标题覆盖层 */}
      <div className="pointer-events-none absolute inset-x-0 top-[12%] z-10 flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold tracking-[0.2em] sm:text-6xl" style={{ color: "#2B2B2B" }}>
          丑团
        </h1>
        <p className="mt-3 text-sm tracking-widest sm:text-base" style={{ color: "#8a8175" }}>
          官方网站 · 正在开发中
        </p>
      </div>
    </main>
  );
}
