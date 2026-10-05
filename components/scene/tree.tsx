"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  APPLE_RED,
  APPLE_REST_MS,
  INK,
  INTERACT_COOLDOWN_MS,
  INTERACT_PROBABILITY,
  PAPER,
} from "./scene-config";

/** 苹果动画总时长：掉落 + 弹跳 + 静止 + 淡出 */
const APPLE_TOTAL_MS = APPLE_REST_MS + 2200;

/** 树：点击后掉落一个苹果，落地弹跳，静止后淡出 */
export function Tree({ className }: { className?: string }) {
  const [apple, setApple] = useState(false);
  const lastRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const handleClick = () => {
    const now = Date.now();
    if (now - lastRef.current < INTERACT_COOLDOWN_MS) return;
    lastRef.current = now;
    if (Math.random() > INTERACT_PROBABILITY) return;
    setApple(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setApple(false), APPLE_TOTAL_MS);
  };

  return (
    <div
      className={cn("pointer-events-auto cursor-pointer", className)}
      onClick={handleClick}
    >
      <svg viewBox="0 0 84 150" className="sketchy h-full w-full">
        <line
          x1="42"
          y1="76"
          x2="42"
          y2="148"
          stroke={INK}
          strokeWidth={2.8}
          strokeLinecap="round"
        />
        <path
          d="M18 78 C2 78 0 56 18 52 C14 30 42 22 54 37 C66 22 88 34 80 54 C96 58 92 78 72 78 Z"
          fill={PAPER}
          stroke={INK}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {apple && (
        <div className="apple pointer-events-none absolute bottom-0 left-1/2 w-[calc(2.4*var(--u))]">
          <svg
            viewBox="0 0 26 28"
            className="h-auto w-full"
            fill="none"
            stroke={INK}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 9 C10 4 4 5 3 11 C2 18 6 24 13 25 C20 24 24 18 23 11 C22 5 16 4 13 9 Z" fill={APPLE_RED} />
            <path d="M13 8 C13 5 12 4 11 3" />
            <path d="M12 4 Q16 1 20 3 Q16 7 12 4 Z" fill={PAPER} />
          </svg>
        </div>
      )}
    </div>
  );
}
