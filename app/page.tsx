import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { AuroraText } from "@/components/ui/aurora-text";
import { BlurFade } from "@/components/ui/blur-fade";
import { Meteors } from "@/components/ui/meteors";
import { LightBeam } from "@/components/light-beam";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-neutral-950 px-6 text-center">
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.12}
        duration={3}
        repeatDelay={1}
        className={cn(
          "text-neutral-500",
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        )}
      />
      <Meteors number={24} />

      {/* 从界面左上角射出、终点落在标题左端的光束 */}
      <LightBeam targetId="hero-title" />

      <div className="relative z-10 flex flex-col items-center">
        <BlurFade delay={0.1}>
          <span className="mb-6 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-[0.2em] text-neutral-300 backdrop-blur">
            UGLY TEAM · 丑团
          </span>
        </BlurFade>

        <BlurFade delay={0.25}>
          <h1
            id="hero-title"
            className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl"
          >
            <AuroraText>丑团官方网站开发中</AuroraText>
            <span className="text-neutral-600">...</span>
          </h1>
        </BlurFade>

        <BlurFade delay={0.4}>
          <p className="mt-6 text-lg text-neutral-400 sm:text-xl">敬请期待</p>
        </BlurFade>
      </div>
    </main>
  );
}
