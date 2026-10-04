"use client";

import { useEffect, useState } from "react";

type Beam = { length: number; angle: number };

interface LightBeamProps {
  /** 目标元素的 id，光束终点对准该元素左端中点 */
  targetId: string;
  /** RGB 颜色，如 "139, 92, 246" */
  color?: string;
  /** 光束在起点（左上角）处的宽度（px） */
  thickness?: number;
  /** 光束在终点（文字处）的宽度（px），一般小于起点宽度以收拢光束 */
  endThickness?: number;
  /** 柔化半径（px） */
  blur?: number;
  /** 起点处的不透明度 */
  opacity?: number;
  /** 终点处的不透明度（默认 0.35；调大可让光一直亮到文字处） */
  endOpacity?: number;
  /** 照射长度系数：1=正好到目标左端；<1 更短；>1 更长 */
  reach?: number;
}

/**
 * 从界面左上角 (0,0) 射出、终点对准目标元素左端中点的光束。
 * 长度实时等于"左上角 -> 目标左端"的距离，因此不会超出目标。
 */
export function LightBeam({
  targetId,
  color = "139, 92, 246",
  thickness = 130,
  endThickness = 250,
  blur = 35,
  opacity = 0.35,
  endOpacity = 0.10,
  reach = 1.15,
}: LightBeamProps) {
  const [beam, setBeam] = useState<Beam | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = r.left; // 目标左端相对视口左上角的横向距离
      const dy = r.top + r.height / 2; // 目标垂直中点
      const length = Math.hypot(dx, dy) * reach;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      setBeam({ length, angle });
    };

    update();
    window.addEventListener("resize", update);
    // 字体加载、入场动画结束后再校正几次，避免文字位置漂移
    const timers = [200, 800, 1500].map((t) => window.setTimeout(update, t));
    document.fonts?.ready.then(update).catch(() => {});

    return () => {
      window.removeEventListener("resize", update);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [targetId, reach]);

  if (!beam) return null;

  // 容器高度取两者较大值，起点/末端宽度各自独立，任意组合都生效
  const bandHeight = Math.max(thickness, endThickness);
  const startHalf = (thickness / bandHeight) * 50;
  const endHalf = (endThickness / bandHeight) * 50;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 z-0"
      style={{
        top: -bandHeight / 2,
        width: beam.length,
        height: bandHeight,
        transformOrigin: "left center",
        transform: `rotate(${beam.angle}deg)`,
        filter: `blur(${blur}px)`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          // 从起点宽度平滑过渡到末端宽度的光束（可收拢或张开）
          clipPath: `polygon(0% ${50 - startHalf}%, 100% ${50 - endHalf}%, 100% ${50 + endHalf}%, 0% ${50 + startHalf}%)`,
          background: `linear-gradient(to right, rgba(${color}, ${opacity}) 0%, rgba(${color}, ${
            (opacity + endOpacity) / 2
          }) 60%, rgba(${color}, ${endOpacity}) 100%)`,
        }}
      />
    </div>
  );
}
