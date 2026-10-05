"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  animate,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "motion/react";

/**
 * 火车场景的速度 / 状态控制器。
 * - 旋钮每转一次升一档；未满档 3 秒无操作平滑回退；
 * - 满档触发发车：场景进度 transition 0→1（镜头拉近），随后车速恢复基础速度；
 * - exit()：场景进度 1→0（镜头拉远回到主界面）。
 * 背景视差层与车轮都读取同一个弹性平滑速度值，从而变速时天然同步。
 */

/** 各档位对应的速度倍率（index 0..3，1 = 基础速度） */
export const LEVEL_FACTORS = [1, 1.8, 2.8, 4.0];
/** 触发发车所需的档位 */
export const KNOB_MAX_LEVEL = 3;
/** 未满档时，无操作多久后回退（毫秒） */
export const KNOB_RESET_MS = 3000;
/** 发车过场时长（毫秒）；也用于过场结束后车速恢复基础速度 */
export const DEPART_MS = 3000;
/** 返回主界面的过场时长（毫秒） */
export const RETURN_MS = 1800;

interface SceneSpeed {
  /** 弹性平滑后的速度倍率，背景与车轮共用 */
  speed: MotionValue<number>;
  /** 场景过渡进度：0=主界面，1=照片墙（镜头已拉近） */
  transition: MotionValue<number>;
  /** 当前档位 0..3 */
  level: number;
  /** 是否已发车（进入照片墙） */
  departed: boolean;
  /** 转动旋钮一次 */
  turn: () => void;
  /** 返回主界面（镜头拉远） */
  exit: () => void;
}

const SceneSpeedContext = createContext<SceneSpeed | null>(null);

export function useSceneSpeed() {
  const ctx = useContext(SceneSpeedContext);
  if (!ctx) throw new Error("useSceneSpeed 必须在 <SpeedProvider> 内使用");
  return ctx;
}

export function SpeedProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState(0);
  const [departed, setDeparted] = useState(false);
  const speed = useSpring(1, { stiffness: 55, damping: 18, mass: 0.9 });
  const transition = useMotionValue(0);

  const levelRef = useRef(0);
  const departedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const animRef = useRef<{ stop: () => void } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopTransition = useCallback(() => {
    animRef.current?.stop();
    animRef.current = null;
  }, []);

  const turn = useCallback(() => {
    if (departedRef.current) return;

    const next = Math.min(KNOB_MAX_LEVEL, levelRef.current + 1);
    levelRef.current = next;
    setLevel(next);
    clearTimer();

    if (next >= KNOB_MAX_LEVEL) {
      // 满档：加速发车 + 镜头拉近；过场结束后车速恢复基础速度（照片墙的轻松感）
      departedRef.current = true;
      setDeparted(true);
      speed.set(LEVEL_FACTORS[KNOB_MAX_LEVEL]);
      stopTransition();
      animRef.current = animate(transition, 1, {
        duration: DEPART_MS / 1000,
        ease: "easeInOut",
      });
      timerRef.current = window.setTimeout(() => {
        speed.set(LEVEL_FACTORS[0]);
        timerRef.current = null;
      }, DEPART_MS);
      return;
    }

    speed.set(LEVEL_FACTORS[next]);
    // 3 秒内没有继续旋转则平滑回退
    timerRef.current = window.setTimeout(() => {
      levelRef.current = 0;
      setLevel(0);
      speed.set(LEVEL_FACTORS[0]);
      timerRef.current = null;
    }, KNOB_RESET_MS);
  }, [clearTimer, speed, stopTransition, transition]);

  const exit = useCallback(() => {
    if (!departedRef.current) return;
    departedRef.current = false;
    setDeparted(false);
    levelRef.current = 0;
    setLevel(0);
    clearTimer();
    speed.set(LEVEL_FACTORS[0]);
    stopTransition();
    // 镜头拉远回到主界面
    animRef.current = animate(transition, 0, {
      duration: RETURN_MS / 1000,
      ease: "easeInOut",
    });
  }, [clearTimer, speed, stopTransition, transition]);

  useEffect(
    () => () => {
      clearTimer();
      stopTransition();
    },
    [clearTimer, stopTransition]
  );

  return (
    <SceneSpeedContext.Provider
      value={{ speed, transition, level, departed, turn, exit }}
    >
      {children}
    </SceneSpeedContext.Provider>
  );
}
