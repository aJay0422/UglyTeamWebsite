import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Cloud } from "./scene/cloud";
import { Pole } from "./scene/pole";
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

/** 带辐条的车轮，辐条让旋转可见 */
function Wheel({ x, y, r }: { x: number; y: number; r: number }) {
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 6;
    return (
      <line
        key={i}
        x1={x}
        y1={y}
        x2={x + Math.cos(a) * (r - 3)}
        y2={y + Math.sin(a) * (r - 3)}
      />
    );
  });
  return (
    <g
      className="sketchy sketch-wheel"
      fill={PAPER}
      stroke={INK}
      strokeWidth={2.4}
      strokeLinecap="round"
    >
      <circle cx={x} cy={y} r={r} />
      {spokes}
    </g>
  );
}

/**
 * 侧视简笔火车：车头（居中）朝左 + 紧贴其后的整条车厢带。
 * 车厢用一条带 + 分隔竖线绘制，故车头/车厢、车厢/车厢之间无缝紧贴。
 * viewBox 只包住车头，车厢向右画到可视区外，靠 overflow-visible 拼接至页面右边缘。
 */
function Train({ className }: { className?: string }) {
  const carCount = 10;
  const carW = 268;
  const carStart = 372;
  const carSpan = carCount * carW;

  return (
    <svg
      viewBox="-14 0 400 280"
      className={cn("overflow-visible", className)}
      fill="none"
    >
      <g className="sketch-bob">
        <Wheel x={44} y={254} r={26} />
        <Wheel x={116} y={254} r={26} />
        <Wheel x={188} y={254} r={26} />
        <Wheel x={260} y={254} r={26} />
        {Array.from({ length: carCount }, (_, k) => (
          <g key={k}>
            <Wheel x={carStart + k * carW + 40} y={258} r={22} />
            <Wheel x={carStart + k * carW + 216} y={258} r={22} />
          </g>
        ))}

        <g
          className="sketchy"
          stroke={INK}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect
            x={carStart}
            y="150"
            width={carSpan}
            height="86"
            rx="8"
            fill={PAPER}
          />
          {Array.from({ length: carCount - 1 }, (_, k) => {
            const x = carStart + (k + 1) * carW;
            return <line key={k} x1={x} y1="150" x2={x} y2="236" />;
          })}
          {Array.from({ length: carCount }, (_, k) =>
            Array.from({ length: 6 }, (_, i) => (
              <rect
                key={`${k}-${i}`}
                x={carStart + k * carW + 18 + i * 40}
                y="168"
                width="28"
                height="30"
                rx="4"
                fill={PAPER}
                strokeWidth={2.4}
              />
            ))
          )}
        </g>

        <g
          className="sketchy"
          stroke={INK}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M78 140 L78 98 L120 98 L120 140" fill={PAPER} />
          <line x1="70" y1="98" x2="128" y2="98" />
          <path
            d="M20 152 Q20 140 34 140 L286 140 L286 236 L34 236 Q20 236 20 224 Z"
            fill={PAPER}
          />
          <path d="M20 152 L0 232 L34 236" fill={PAPER} />
          <path d="M150 140 Q150 120 166 120 Q182 120 182 140" fill={PAPER} />
          <circle cx="54" cy="188" r="30" fill={PAPER} />
          <circle cx="54" cy="188" r="4" fill={PAPER} />
          <line x1="54" y1="162" x2="54" y2="176" />
          <line x1="54" y1="200" x2="54" y2="214" />
          <line x1="112" y1="140" x2="112" y2="236" />
          <line x1="206" y1="140" x2="206" y2="236" />
          <rect x="286" y="112" width="86" height="124" rx="8" fill={PAPER} />
          <rect x="302" y="132" width="54" height="42" rx="4" fill={PAPER} />
          <line x1="329" y1="132" x2="329" y2="174" />
          <line x1="302" y1="153" x2="356" y2="153" />
        </g>

        {[0, 1, 2, 3].map((i) => (
          <circle
            key={i}
            cx={100}
            cy={86}
            r={9 + i * 3}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2}
            className="sketchy sketch-puff"
            style={{ animationDelay: `${i * 1}s` }}
          />
        ))}
      </g>
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
        <Cloud key="b1" className="absolute left-[5%] top-[32%] h-[12vh] w-[30vh]" />
        <Cloud key="b2" className="absolute left-[10%] top-[19%] h-[10vh] w-[25vh]" />
        <Cloud key="b3" className="absolute left-[16%] top-[36%] h-[7vh] w-[17.5vh]" />
        <Cloud key="s1" className="absolute left-[43%] top-[15%] h-[5vh] w-[12.5vh]" />
        <Cloud key="m1" className="absolute left-[62%] top-[30%] h-[10vh] w-[25vh]" />
        <Cloud key="m2" className="absolute left-[68%] top-[19%] h-[8vh] w-[20vh]" />
        <Cloud key="s2" className="absolute left-[88%] top-[12%] h-[4vh] w-[10vh]" />
      </Parallax>

      <Parallax duration={55} className="bottom-[22%] h-[36vh]">
        <Pole key="p1" className="absolute bottom-0 left-[20%] h-full w-auto" />
        <Pole key="p2" className="absolute bottom-0 left-[72%] h-[94%] w-auto" />
      </Parallax>

      <Parallax duration={34} className="bottom-[22%] h-[18vh]">
        <Tree key="t1" className="absolute bottom-0 left-[30%] h-full w-auto" />
        <Tree key="t2" className="absolute bottom-0 left-[78%] h-[86%] w-auto" />
      </Parallax>

      <svg
        aria-hidden
        className="sketchy-line absolute inset-x-0 bottom-[22%] h-[1.2vh] w-full"
        viewBox="0 0 1200 12"
        preserveAspectRatio="none"
        fill="none"
        stroke={INK}
        strokeWidth={2.6}
      >
        <path d="M0 6 Q60 1 120 6 Q180 11 240 6 Q300 1 360 6 Q420 11 480 6 Q540 1 600 6 Q660 11 720 6 Q780 1 840 6 Q900 11 960 6 Q1020 1 1080 6 Q1140 11 1200 6" />
      </svg>

      <Parallax duration={15} className="bottom-[20.2%] h-[0.6vh]">
        <div
          className="sketchy-line absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${INK} 0 1.4vh, transparent 1.4vh 3vh)`,
          }}
        />
      </Parallax>

      <Train className="absolute bottom-[22%] left-1/2 h-[30vh] w-auto -translate-x-1/2" />
    </div>
  );
}
