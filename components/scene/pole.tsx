"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  INK,
  INTERACT_COOLDOWN_MS,
  INTERACT_PROBABILITY,
  PAPER,
  SPARK_BLUE,
} from "./scene-config";

/** 光晕的暖色（RGB） */
const GLOW = "231, 178, 74";

type PoleEffect = "spark" | "bulb";
const EFFECT_KINDS: PoleEffect[] = ["spark", "bulb"];
const EFFECT_MS: Record<PoleEffect, number> = { spark: 1500, bulb: 2700 };

/** 电线杆：点击后按概率随机触发 电流闪过 / 灯泡亮起 */
export function Pole({ className }: { className?: string }) {
  const [effect, setEffect] = useState<PoleEffect | null>(null);
  const lastRef = useRef(0);
  const timerRef = useRef<number | null>(null);

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
    <div
      className={cn("pointer-events-auto cursor-pointer", className)}
      onClick={handleClick}
    >
      <svg
        viewBox="0 0 48 220"
        className="sketchy h-full w-full"
        fill="none"
        stroke={INK}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="24" y1="10" x2="24" y2="220" />
        <line x1="6" y1="32" x2="42" y2="32" />
        <line x1="9" y1="50" x2="39" y2="50" />
        <line x1="6" y1="32" x2="6" y2="40" />
        <line x1="42" y1="32" x2="42" y2="40" />
        <line x1="9" y1="50" x2="9" y2="58" />
        <line x1="39" y1="50" x2="39" y2="58" />

        {effect === "spark" && <Spark />}
        {effect === "bulb" && <Bulb />}
      </svg>
    </div>
  );
}

/** 电流：杆顶与横担处闪过的几道手绘折线 */
function Spark() {
  return (
    <g
      className="spark"
      fill="none"
      stroke={SPARK_BLUE}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 14 L20 8 L27 5 L23 0" />
      <path d="M8 32 L2 28 L7 25" />
      <path d="M40 32 L46 28 L41 25" />
      <path d="M24 52 L20 58 L26 61" />
    </g>
  );
}

/** 灯泡：立在横担上，亮起并散出暖色光晕 */
function Bulb() {
  return (
    <g className="bulb">
      <circle cx="24" cy="24" r="34" fill={`rgba(${GLOW}, 0.10)`} stroke="none" />
      <circle cx="24" cy="24" r="22" fill={`rgba(${GLOW}, 0.16)`} stroke="none" />
      <circle cx="24" cy="24" r="12" fill={`rgba(${GLOW}, 0.28)`} stroke="none" />
      <circle cx="24" cy="23" r="8" fill={PAPER} stroke={INK} strokeWidth={2.2} />
      <path
        d="M21 22 L24 26 L27 22"
        fill="none"
        stroke={INK}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 30 L28 30 L27 34 L21 34 Z"
        fill={PAPER}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </g>
  );
}
