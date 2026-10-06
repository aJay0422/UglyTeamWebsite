"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

import { cn } from "@/lib/utils";
import { Cloud } from "./scene/cloud";
import { Pole } from "./scene/pole";
import {
  DEPART_MS,
  RETURN_MS,
  SpeedProvider,
  useSceneSpeed,
} from "./scene/speed-context";
import { PhotoWallProvider } from "./scene/photo-context";
import { Train } from "./scene/train";
import { Tree } from "./scene/tree";
import { INK, PAPER } from "./scene/scene-config";

/**
 * 双层拼接、由 JS 按当前速度驱动的视差层（营造场景向左移动 = 火车向前开）。
 * hideOnDepart：进入照片墙时整条带向右滑出屏幕后停住（不再循环 → 不会再有新的进入）；
 * 返回主界面时滑回原位并恢复循环。
 */
function Parallax({
  baseDuration,
  className,
  children,
  hideOnDepart = false,
}: {
  /** 基础速度下走完一个循环所需秒数（越大越慢） */
  baseDuration: number;
  className?: string;
  children: ReactNode;
  /** 进入照片墙时是否滑出屏幕（用于树 / 电线杆） */
  hideOnDepart?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const frozen = useRef(false);
  const reduced = useReducedMotion();
  const { speed, departed } = useSceneSpeed();

  useAnimationFrame((_, delta) => {
    const el = ref.current;
    if (!el || reduced || frozen.current) return;
    const loop = el.offsetWidth / 2;
    if (!loop) return;
    const pxPerSec = (loop / baseDuration) * speed.get();
    let next = x.get() + pxPerSec * (delta / 1000);
    if (next >= 0) next -= loop;
    x.set(next);
  });

  // 发车 / 返回时整条带滑出或滑回
  useEffect(() => {
    if (!hideOnDepart) return;
    const el = ref.current;
    if (!el) return;
    const loop = el.offsetWidth / 2;
    if (!loop) return;

    if (departed) {
      // 向右滑出屏幕后停住：不再循环，故不会有新的树 / 电线杆进入
      frozen.current = true;
      const controls = animate(x, loop, {
        duration: DEPART_MS / 1000,
        ease: "easeInOut",
      });
      return () => controls.stop();
    }

    // 返回：从屏外滑回原位，随后恢复循环（两份内容相同，落到 0 处可无缝衔接）
    const controls = animate(x, 0, {
      duration: RETURN_MS / 1000,
      ease: "easeOut",
    });
    controls.finished
      .then(() => {
        x.set(0);
        frozen.current = false;
      })
      .catch(() => {});
    return () => controls.stop();
  }, [departed, hideOnDepart, x]);

  return (
    <motion.div
      ref={ref}
      aria-hidden
      style={{ x }}
      className={cn(
        "pointer-events-none absolute left-0 flex w-[200%]",
        className
      )}
    >
      <div className="relative h-full w-1/2 shrink-0">{children}</div>
      <div className="relative h-full w-1/2 shrink-0">{children}</div>
    </motion.div>
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
        <filter id="sketch-text" x="-18%" y="-18%" width="136%" height="136%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves="2"
            seed="11"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

/** 松手后触发“磁吸吸附”到地面的纵向范围（px） */
const SNAP_RANGE = 120;

/**
 * 照片墙里可拖动的小石头：松手时“磁吸”吸附到地面，
 * 之后随地面向右滑动，滑到某个车轮下方（“被轧到”）时下压 + 抖动，然后退出。
 */
function Rock({ sceneRef }: { sceneRef: RefObject<HTMLDivElement | null> }) {
  const { departed, exit } = useSceneSpeed();
  const rockRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const committed = useRef(false);
  const [locked, setLocked] = useState(false);
  const [squish, setSquish] = useState(false);

  // 重新进入照片墙时重置石头（位置与状态），避免残留上次的位移与压扁
  useEffect(() => {
    if (!departed) return;
    x.set(0);
    y.set(0);
    committed.current = false;
    setLocked(false);
    setSquish(false);
  }, [departed, x, y]);

  const pressAndExit = useCallback(() => {
    setSquish(true);
    const scene = sceneRef.current;
    if (scene) {
      scene.classList.add("scene-shake");
      window.setTimeout(() => scene.classList.remove("scene-shake"), 560);
    }
    window.setTimeout(() => exit(), 620);
  }, [exit, sceneRef]);

  const handleDragEnd = useCallback(() => {
    if (committed.current) return;
    const rock = rockRef.current;
    const scene = sceneRef.current;
    if (!rock || !scene) return;

    const rb = rock.getBoundingClientRect();
    const sb = scene.getBoundingClientRect();
    const groundY = sb.top + sb.height * 0.78; // 地面线 = 轮子着地线（bottom:22%）
    const distToGround = groundY - rb.bottom; // >0 表示石头在地面上方
    if (Math.abs(distToGround) > SNAP_RANGE) return; // 超出磁吸范围：不吸附、不触发

    committed.current = true;
    setLocked(true);

    // 磁吸：弹簧式把石头底部吸附并紧贴地面线
    animate(y, y.get() + distToGround, {
      type: "spring",
      stiffness: 520,
      damping: 34,
    })
      .finished.then(() => {
        // 找石头右前方最近的车轮（石头随地面右移会被它轧到）
        const rockCx = rb.left + rb.width / 2;
        let targetX: number | null = null;
        let best = Infinity;
        document.querySelectorAll<SVGGElement>(".sketch-wheel").forEach((el) => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const d = cx - rockCx;
          if (d > 6 && d < best) {
            best = d;
            targetX = cx;
          }
        });

        if (targetX === null) {
          pressAndExit();
          return;
        }

        // 以约等于地面滚动的速度右移，滑到车轮下方再触发
        const delta = targetX - rockCx;
        const duration = Math.min(2.4, Math.max(0.5, Math.abs(delta) / 120));
        return animate(x, x.get() + delta, { duration, ease: "linear" })
          .finished.then(() => pressAndExit());
      })
      .catch(() => {});
  }, [pressAndExit, sceneRef, x, y]);

  if (!departed) return null;

  return (
    <motion.div
      ref={rockRef}
      data-no-scroll
      drag={!locked}
      dragConstraints={sceneRef}
      dragMomentum={false}
      dragElastic={0.08}
      onDragEnd={handleDragEnd}
      style={{ x, y }}
      className={
        "absolute bottom-6 right-6 z-30 touch-none " +
        (locked ? "cursor-default" : "cursor-grab active:cursor-grabbing")
      }
    >
      <motion.svg
        aria-hidden
        viewBox="0 0 60 46"
        width="60"
        height="46"
        className="sketchy"
        fill="none"
        stroke={INK}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          overflow: "visible",
          transformBox: "fill-box",
          transformOrigin: "bottom center",
        }}
        animate={squish ? { scaleY: 0.58, scaleX: 1.24 } : { scaleY: 1, scaleX: 1 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <path
          d="M6 40 C3 27 9 15 20 11 C32 6 46 10 52 21 C58 31 53 40 46 42 Z"
          fill={PAPER}
        />
        <path d="M20 12 L26 23 L16 33" />
        <path d="M26 23 L43 20" />
      </motion.svg>
    </motion.div>
  );
}

export function TrainScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  return (
    <SpeedProvider>
      <div
        ref={sceneRef}
        className="relative h-full min-h-screen w-full overflow-hidden"
        style={{ backgroundColor: PAPER }}
      >
        <SketchFilters />

        <Parallax baseDuration={120} className="top-0 h-1/2">
          <Cloud key="b1" className="absolute left-[5%] top-[32%] h-[calc(12*var(--u))] w-[calc(30*var(--u))]" />
          <Cloud key="b2" className="absolute left-[10%] top-[19%] h-[calc(10*var(--u))] w-[calc(25*var(--u))]" />
          <Cloud key="b3" className="absolute left-[16%] top-[36%] h-[calc(7*var(--u))] w-[calc(17.5*var(--u))]" />
          <Cloud key="s1" className="absolute left-[43%] top-[15%] h-[calc(5*var(--u))] w-[calc(12.5*var(--u))]" />
          <Cloud key="m1" className="absolute left-[62%] top-[30%] h-[calc(10*var(--u))] w-[calc(25*var(--u))]" />
          <Cloud key="m2" className="absolute left-[68%] top-[19%] h-[calc(8*var(--u))] w-[calc(20*var(--u))]" />
          <Cloud key="s2" className="absolute left-[88%] top-[12%] h-[calc(4*var(--u))] w-[calc(10*var(--u))]" />
        </Parallax>

        <Parallax
          baseDuration={55}
          hideOnDepart
          className="bottom-[22%] h-[calc(36*var(--u))]"
        >
          <Pole key="p1" className="absolute bottom-0 left-[20%] h-full w-auto" />
          <Pole key="p2" className="absolute bottom-0 left-[72%] h-[94%] w-auto" />
        </Parallax>

        <Parallax
          baseDuration={34}
          hideOnDepart
          className="bottom-[22%] h-[calc(18*var(--u))]"
        >
          <Tree key="t1" className="absolute bottom-0 left-[30%] h-full w-auto" />
          <Tree key="t2" className="absolute bottom-0 left-[78%] h-[86%] w-auto" />
        </Parallax>

        <Parallax baseDuration={15} className="bottom-[22%] h-[calc(1.2*var(--u))]">
          <svg
            aria-hidden
            className="sketchy-line absolute inset-0 h-full w-full"
            viewBox="0 0 1200 12"
            preserveAspectRatio="none"
            fill="none"
            stroke={INK}
            strokeWidth={2.6}
          >
            <path d="M0 6 Q60 1 120 6 Q180 11 240 6 Q300 1 360 6 Q420 11 480 6 Q540 1 600 6 Q660 11 720 6 Q780 1 840 6 Q900 11 960 6 Q1020 1 1080 6 Q1140 11 1200 6" />
          </svg>
        </Parallax>

        <Parallax baseDuration={15} className="bottom-[20.2%] h-[calc(0.6*var(--u))]">
          <div
            className="sketchy-line absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, ${INK} 0 1.4vh, transparent 1.4vh 3vh)`,
            }}
          />
        </Parallax>

        <PhotoWallProvider>
          <Train
            className="absolute bottom-[22%] left-1/2 h-[calc(30*var(--u))] w-auto -translate-x-1/2"
            sceneRef={sceneRef}
          />
        </PhotoWallProvider>

        <Rock sceneRef={sceneRef} />
      </div>
    </SpeedProvider>
  );
}
