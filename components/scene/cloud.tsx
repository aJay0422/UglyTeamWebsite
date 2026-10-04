"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import {
  INK,
  INTERACT_COOLDOWN_MS,
  INTERACT_PROBABILITY,
  PAPER,
} from "./scene-config";

const CLOUD_PATH =
  "M24 70 C8 70 2 52 18 45 C12 24 42 14 58 27 C68 9 104 8 114 29 C136 19 160 33 154 52 C174 54 176 70 158 70 Z";

type CloudEffect = "rain" | "snow" | "thunder";
const EFFECT_KINDS: CloudEffect[] = ["rain", "snow", "thunder"];
const EFFECT_MS: Record<CloudEffect, number> = {
  rain: 2000,
  snow: 2600,
  thunder: 1200,
};

export function Cloud({ className }: { className?: string }) {
  const [effect, setEffect] = useState<CloudEffect | null>(null);
  const [width, setWidth] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
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

  // 闪电数量随云朵宽度变化，且取奇数以保证左右对称
  let bolts = Math.round(width / 90);
  bolts = Math.max(3, Math.min(7, bolts));
  if (bolts % 2 === 0) bolts += 1;

  return (
    <div
      ref={wrapRef}
      className={cn("pointer-events-auto cursor-pointer", className)}
      onClick={handleClick}
    >
      <svg
        viewBox="-10.5 0 200 80"
        className="sketchy h-full w-full"
        fill={PAPER}
        stroke={INK}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={CLOUD_PATH} />
      </svg>
      {effect === "rain" && <Rain />}
      {effect === "snow" && <Snow />}
      {effect === "thunder" && <Thunder count={bolts} />}
    </div>
  );
}

/** 雨：细长的雨丝 */
function Rain() {
  const drops = useMemo(
    () =>
      Array.from({ length: 16 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.3 + Math.random() * 0.7,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 top-full">
      {drops.map((d, i) => (
        <span
          key={i}
          className="rain-drop absolute top-0 rounded-full"
          style={{
            left: `${d.left}%`,
            backgroundColor: INK,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function Snowflake({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke={INK}
      strokeWidth={1.4}
      strokeLinecap="round"
      style={{ width: `${size}vh`, height: `${size}vh` }}
    >
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="1.7" y1="3.5" x2="10.3" y2="8.5" />
      <line x1="10.3" y1="3.5" x2="1.7" y2="8.5" />
    </svg>
  );
}

/** 雪：六角雪花 */
function Snow() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 3.8 + Math.random() * 2.2,
        drift: (Math.random() * 2 - 1) * 2,
        size: 1 + Math.random() * 0.8,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 top-full">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="snow-flake absolute top-0"
          style={
            {
              left: `${f.left}%`,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.duration}s`,
              "--drift": `${f.drift}vh`,
            } as CSSProperties
          }
        >
          <Snowflake size={f.size} />
        </span>
      ))}
    </div>
  );
}

/** 雷：多个小闪电，水平均匀排在云底，左右对称 */
function Thunder({ count }: { count: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-full h-0">
      {Array.from({ length: count }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 36"
          fill={INK}
          className="thunder absolute top-0 h-[2.6vh] w-[1.7vh] -translate-x-1/2"
          style={{
            left: `${((i + 0.5) / count) * 100}%`,
            animationDelay: `${i * 0.05}s`,
          }}
        >
          <path d="M14 0 L4 18 L11 18 L7 36 L20 15 L13 15 Z" />
        </svg>
      ))}
    </div>
  );
}
