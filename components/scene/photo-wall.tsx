"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { motion, useTransform } from "motion/react";

import { PhotoFrame } from "./photo-frame";
import { usePhotoWall } from "./photo-context";
import { enumerateSlots } from "./train-geometry";
import { useSceneSpeed } from "./speed-context";

interface Box {
  left: number;
  top: number;
  size: number;
}

interface Props {
  svgRef: RefObject<SVGSVGElement | null>;
  sceneRef: RefObject<HTMLDivElement | null>;
}

const WHEEL_FACTOR = 1; // 滚轮灵敏度
const DRAG_THRESHOLD = 6; // 拖拽判定阈值（px）
const VIEWBOX_WIDTH = 400;

/**
 * 照片墙叠加层（HTML）：仅提供每个窗户的透明点击热区 + 相框查看器。
 * 玻璃的视觉（简笔反光线条）由 SVG 在 train.tsx 中绘制，因此天然随车厢同频起伏、不存在前后图层问题。
 * 仅在发车过场到位（transition≈1）时显示；车厢可水平滚动（滚轮/拖拽/触摸）。
 */
export function PhotoWall({ svgRef, sceneRef }: Props) {
  const { transition, scroll } = useSceneSpeed();
  const { photos, openSlot, open, close, upload, remove, busy, error } = usePhotoWall();

  const [ready, setReady] = useState(false);
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [bx, setBx] = useState(1);
  const [maxScroll, setMaxScroll] = useState(0);

  const suppressClickRef = useRef(false);
  const slots = useMemo(() => enumerateSlots(), []);

  // 向右滚动 scroll 个单位 = 内容整体左移
  const scrollPx = useTransform(scroll, (s) => -s * bx);
  const progress = useTransform(scroll, (s) =>
    maxScroll > 0 ? Math.min(1, Math.max(0, s / maxScroll)) : 0
  );

  // 是否已进入照片墙（过场到位）
  useEffect(() => {
    const update = (v: number) => setReady(v >= 0.999);
    update(transition.get());
    return transition.on("change", update);
  }, [transition]);

  // 测量各窗户的屏幕位置（相对场景）与可滚动范围
  const measure = useCallback(() => {
    const svg = svgRef.current;
    const scene = sceneRef.current;
    if (!svg || !scene) return;
    const sr = svg.getBoundingClientRect();
    const sceneRect = scene.getBoundingClientRect();
    if (!sr.width) return;

    const unit = sr.width / VIEWBOX_WIDTH;
    setBx(unit);

    const next: Record<string, Box> = {};
    let maxRight = 0;
    svg.querySelectorAll<SVGRectElement>("[data-slot]").forEach((el) => {
      const id = el.getAttribute("data-slot");
      if (!id) return;
      const r = el.getBoundingClientRect();
      const box = {
        left: r.left - sceneRect.left,
        top: r.top - sceneRect.top,
        size: r.width,
      };
      next[id] = box;
      maxRight = Math.max(maxRight, box.left + box.size);
    });
    setBoxes(next);
    setMaxScroll(Math.max(0, (maxRight - sceneRect.width) / unit));
  }, [svgRef, sceneRef]);

  useEffect(() => {
    if (!ready) return;
    measure();
    const t = window.setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [ready, measure]);

  // 滚动交互：滚轮 / 拖拽 / 触摸 统一映射到 scroll（clamp 到 [0, maxScroll]）
  useEffect(() => {
    if (!ready) return;
    const scene = sceneRef.current;
    if (!scene) return;

    const unit = bx || 1;
    const clamp = (v: number) => Math.min(maxScroll, Math.max(0, v));

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-no-scroll]")) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();
      scroll.set(clamp(scroll.get() + (delta * WHEEL_FACTOR) / unit));
    };

    let dragging = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-no-scroll]")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      suppressClickRef.current = false;
      dragging = true;
      startX = e.clientX;
      startScroll = scroll.get();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) suppressClickRef.current = true;
      scroll.set(clamp(startScroll - dx / unit));
    };
    const onPointerUp = () => {
      dragging = false;
    };

    scene.addEventListener("wheel", onWheel, { passive: false });
    scene.addEventListener("pointerdown", onPointerDown);
    scene.addEventListener("pointermove", onPointerMove);
    scene.addEventListener("pointerup", onPointerUp);
    scene.addEventListener("pointercancel", onPointerUp);
    return () => {
      scene.removeEventListener("wheel", onWheel);
      scene.removeEventListener("pointerdown", onPointerDown);
      scene.removeEventListener("pointermove", onPointerMove);
      scene.removeEventListener("pointerup", onPointerUp);
      scene.removeEventListener("pointercancel", onPointerUp);
    };
  }, [ready, bx, maxScroll, scroll, sceneRef]);

  const handleWindowClick = useCallback(
    (slot: string) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      open(slot);
    },
    [open]
  );

  if (!ready) return null;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ x: scrollPx }}>
          {slots.map((slot) => {
            const box = boxes[slot.id];
            if (!box) return null;
            return (
              <button
                key={slot.id}
                type="button"
                aria-label={photos[slot.id] ? "查看照片" : "上传照片"}
                onClick={() => handleWindowClick(slot.id)}
                className="pw-window pointer-events-auto absolute"
                style={{
                  left: box.left + 2,
                  top: box.top + 2,
                  width: Math.max(0, box.size - 4),
                  height: Math.max(0, box.size - 4),
                }}
              />
            );
          })}
        </motion.div>
      </div>

      {maxScroll > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
          <div
            className="h-1 w-40 overflow-hidden rounded-full"
            style={{ backgroundColor: "rgba(43,43,43,0.15)" }}
          >
            <motion.div
              className="h-full w-full origin-left rounded-full"
              style={{ backgroundColor: "#2B2B2B", scaleX: progress }}
            />
          </div>
        </div>
      )}

      <PhotoFrame
        slot={openSlot}
        entry={openSlot ? photos[openSlot] : undefined}
        busy={busy}
        error={error}
        onClose={close}
        onUpload={upload}
        onRemove={remove}
      />
    </>
  );
}
