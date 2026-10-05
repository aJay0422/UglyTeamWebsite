"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import {
  AMBER,
  APPLE_RED,
  INK,
  INTERACT_COOLDOWN_MS,
  INTERACT_PROBABILITY,
  PAPER,
  SPARK_BLUE,
} from "./scene-config";

type ChimneyEffect = "firework" | "spout";
const EFFECT_KINDS: ChimneyEffect[] = ["firework", "spout"];
const EFFECT_MS: Record<ChimneyEffect, number> = { firework: 2600, spout: 1900 };

/** 水花可调参数 */
const SPOUT = {
  count: 16,          // 水珠数量
  spread: 80,         // 水平散开基准
  spreadJitter: 24,   // 水平随机幅度
  peak: 80,           // 顶点高度基准
  peakJitter: 48,     // 顶点高度随机
  peakEdgeDrop: 32,   // 边缘水珠更矮
  fall: 40,           // 下落距离基准
  fallJitter: 60,     // 下落随机
  radiusMin: 1.8,
  radiusJitter: 1.5,
  delayJitter: 0.16,
};

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
 * 点击烟囱（冒烟处）按概率随机触发 烟花 / 喷水花；特效期间隐藏冒烟。
 */
export function Train({ className }: { className?: string }) {
  const carCount = 10;
  const carW = 268;
  const carStart = 372;
  const carSpan = carCount * carW;

  const [effect, setEffect] = useState<ChimneyEffect | null>(null);
  const [burstY, setBurstY] = useState(-34);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // 将爆炸点定位到视口从上到下 25% 处（换算成 SVG viewBox 坐标）
  useEffect(() => {
    const update = () => {
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.height) return;
      setBurstY(((window.innerHeight * 0.25 - r.top) * 280) / r.height);
    };
    update();
    window.addEventListener("resize", update);
    const t = window.setTimeout(update, 300);
    return () => {
      window.removeEventListener("resize", update);
      window.clearTimeout(t);
    };
  }, []);

  const handleClick = () => {
    const now = Date.now();
    if (now - lastRef.current < INTERACT_COOLDOWN_MS) return;
    lastRef.current = now;
    if (Math.random() > INTERACT_PROBABILITY) return;
    const pick = EFFECT_KINDS[Math.floor(Math.random() * EFFECT_KINDS.length)];
    setEffect(pick);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setEffect(null), EFFECT_MS[pick]);
  };

  return (
    <svg
      ref={svgRef}
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

        {!effect &&
          [0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={100}
              cy={86}
              r={9 + i * 3}
              fill={PAPER}
              stroke={INK}
              strokeWidth={2}
              className="sketchy sketch-puff"
              style={{ animationDelay: `${i}s` }}
            />
          ))}

        {effect === "firework" && <Firework y={burstY} />}
        {effect === "spout" && <Spout />}

        <rect
          x="60"
          y="60"
          width="80"
          height="86"
          fill="transparent"
          style={{ pointerEvents: "all" }}
          className="cursor-pointer"
          onClick={handleClick}
        />
      </g>
    </svg>
  );
}

/** 烟花：从烟囱飞射出短线，在视口 25% 高处炸开 */
function Firework({ y }: { y: number }) {
  const cx = 100;
  const cy = y;
  const rays = Array.from({ length: 14 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 14;
    return {
      x1: cx + Math.cos(a) * 8,
      y1: cy + Math.sin(a) * 8,
      x2: cx + Math.cos(a) * 64,
      y2: cy + Math.sin(a) * 64,
      c: i % 2 === 0 ? AMBER : APPLE_RED,
    };
  });
  return (
    <g>
      <line
        className="fw-rise"
        x1={cx}
        y1="92"
        x2={cx}
        y2="70"
        stroke={AMBER}
        strokeWidth={2.6}
        strokeLinecap="round"
        style={{ "--rise": `${cy - 70}px` } as CSSProperties}
      />
      <g className="fw-burst">
        {rays.map((r, i) => (
          <line
            key={i}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke={r.c}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        ))}
        <circle cx={cx} cy={cy} r="4" fill={AMBER} />
      </g>
    </g>
  );
}

/** 喷水花：水珠沿预设抛物线向上散开再落下（模拟鲸鱼喷水） */
function Spout() {
  const drops = useMemo(
    () =>
      Array.from({ length: SPOUT.count }, (_, i) => {
        const spread = (i / (SPOUT.count - 1) - 0.5) * 2; // -1 ~ 1
        return {
          dx: spread * (SPOUT.spread + Math.random() * SPOUT.spreadJitter),
          h: SPOUT.peak + Math.random() * SPOUT.peakJitter - Math.abs(spread) * SPOUT.peakEdgeDrop,
          fall: SPOUT.fall + Math.random() * SPOUT.fallJitter,
          r: SPOUT.radiusMin + Math.random() * SPOUT.radiusJitter,
          delay: Math.random() * SPOUT.delayJitter,
        };
      }),
    []
  );
  return (
    <g fill={SPARK_BLUE} stroke="none">
      {drops.map((d, i) => (
        <circle
          key={i}
          cx={100}
          cy={88}
          r={d.r}
          className="water-drop"
          style={
            {
              "--dx": `${d.dx}px`,
              "--h": `${d.h}px`,
              "--fall": `${d.fall}px`,
              animationDelay: `${d.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </g>
  );
}
