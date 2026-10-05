import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Cloud } from "./scene/cloud";
import { Pole } from "./scene/pole";
import { Train } from "./scene/train";
import { Tree } from "./scene/tree";
import { INK, PAPER } from "./scene/scene-config";

/** 双层拼接、整体向右滚动的视差层（营造场景向左移动 = 火车向前开） */
function Parallax({
  duration,
  className,
  children,
}: {
  duration: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "parallax pointer-events-none absolute left-0 flex w-[200%]",
        className
      )}
      style={{ "--pan-duration": `${duration}s` } as CSSProperties}
    >
      <div className="relative h-full w-1/2 shrink-0">{children}</div>
      <div className="relative h-full w-1/2 shrink-0">{children}</div>
    </div>
  );
}

/** 手绘抖动滤镜：#sketch 用于主体，#sketch-line 用于地面线条（强度分开） */
function SketchFilters() {
  return (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
      <defs>
        <filter id="sketch" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter
          id="sketch-line"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="2"
            seed="21"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="9"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

export function TrainScene() {
  return (
    <div
      className="relative h-full min-h-screen w-full overflow-hidden"
      style={{ backgroundColor: PAPER }}
    >
      <SketchFilters />

      <Parallax duration={120} className="top-0 h-1/2">
        <Cloud key="b1" className="absolute left-[5%] top-[32%] h-[calc(12*var(--u))] w-[calc(30*var(--u))]" />
        <Cloud key="b2" className="absolute left-[10%] top-[19%] h-[calc(10*var(--u))] w-[calc(25*var(--u))]" />
        <Cloud key="b3" className="absolute left-[16%] top-[36%] h-[calc(7*var(--u))] w-[calc(17.5*var(--u))]" />
        <Cloud key="s1" className="absolute left-[43%] top-[15%] h-[calc(5*var(--u))] w-[calc(12.5*var(--u))]" />
        <Cloud key="m1" className="absolute left-[62%] top-[30%] h-[calc(10*var(--u))] w-[calc(25*var(--u))]" />
        <Cloud key="m2" className="absolute left-[68%] top-[19%] h-[calc(8*var(--u))] w-[calc(20*var(--u))]" />
        <Cloud key="s2" className="absolute left-[88%] top-[12%] h-[calc(4*var(--u))] w-[calc(10*var(--u))]" />
      </Parallax>

      <Parallax duration={55} className="bottom-[22%] h-[calc(36*var(--u))]">
        <Pole key="p1" className="absolute bottom-0 left-[20%] h-full w-auto" />
        <Pole key="p2" className="absolute bottom-0 left-[72%] h-[94%] w-auto" />
      </Parallax>

      <Parallax duration={34} className="bottom-[22%] h-[calc(18*var(--u))]">
        <Tree key="t1" className="absolute bottom-0 left-[30%] h-full w-auto" />
        <Tree key="t2" className="absolute bottom-0 left-[78%] h-[86%] w-auto" />
      </Parallax>

      <svg
        aria-hidden
        className="sketchy-line absolute inset-x-0 bottom-[22%] h-[calc(1.2*var(--u))] w-full"
        viewBox="0 0 1200 12"
        preserveAspectRatio="none"
        fill="none"
        stroke={INK}
        strokeWidth={2.6}
      >
        <path d="M0 6 Q60 1 120 6 Q180 11 240 6 Q300 1 360 6 Q420 11 480 6 Q540 1 600 6 Q660 11 720 6 Q780 1 840 6 Q900 11 960 6 Q1020 1 1080 6 Q1140 11 1200 6" />
      </svg>

      <Parallax duration={15} className="bottom-[20.2%] h-[calc(0.6*var(--u))]">
        <div
          className="sketchy-line absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${INK} 0 1.4vh, transparent 1.4vh 3vh)`,
          }}
        />
      </Parallax>

      <Train className="absolute bottom-[22%] left-1/2 h-[calc(30*var(--u))] w-auto -translate-x-1/2" />
    </div>
  );
}
