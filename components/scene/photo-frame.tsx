"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { INK } from "./scene-config";
import type { PhotoEntry } from "./use-photos";
import { MESSAGE_MAX_LEN, useMessages } from "./use-messages";

interface Props {
  /** 当前打开的窗户槽位；为空表示关闭 */
  slot: string | null;
  entry: PhotoEntry | undefined;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onUpload: (slot: string, file: File) => void;
  onRemove: (slot: string) => void;
}

const PAPER_SOFT = "#FBF6EC";
const DANGER = "#D2655A";

/** 简笔画按钮：手绘抖动描边 + 手写体文字 */
function SketchButton({
  onClick,
  disabled,
  tone = "ink",
  size = "lg",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tone?: "ink" | "danger";
  size?: "lg" | "md";
  children: ReactNode;
}) {
  const stroke = tone === "danger" ? DANGER : INK;
  const sizeCls = size === "lg" ? "px-9 py-3 text-2xl" : "px-5 py-1.5 text-lg";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center disabled:opacity-50",
        sizeCls
      )}
    >
      <svg
        aria-hidden
        className="sketchy pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 120 48"
        preserveAspectRatio="none"
        fill={PAPER_SOFT}
        stroke={stroke}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="114" height="42" rx="14" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="pw-hand relative" style={{ color: stroke }}>
        {children}
      </span>
    </button>
  );
}

/** 照片四角的“胶带” */
function Tape({ style }: { style: CSSProperties }) {
  return <span aria-hidden className="pw-tape" style={style} />;
}

/**
 * 明信片查看器：左照片、右留言（一行行横线），中间竖线分隔。
 * 尺寸随照片比例自适应；照片有灰色边框并四角贴“胶带”；竖线/横线/输入框均内缩不顶边。
 * 右侧下方输入框（最多 15 字），发送后写到横线上；留言多时可滚动。
 * 未上传照片时，左侧照片位显示一个手写感“+”，点击上传。
 */
export function PhotoFrame({
  slot,
  entry,
  busy,
  error,
  onClose,
  onUpload,
  onRemove,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [aspect, setAspect] = useState(4 / 3);
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  const { messages, sending, add } = useMessages(slot);

  useEffect(() => {
    if (!slot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slot, onClose]);

  // 新留言写入后滚到底部
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!entry) setAspect(4 / 3);
  }, [entry]);

  if (!slot) return null;

  // ---- 尺寸计算（随照片比例自适应） ----
  const PAD = 36; // 照片四周留白
  const DIVIDER = 4; // 竖线宽度
  const maxCardH = Math.min(vp.h * 0.74, 660);
  const maxCardW = Math.min(vp.w * 0.92, 1180);
  const rightW = Math.min(Math.max(maxCardW * 0.34, 300), 430);
  const leftMaxW = maxCardW - DIVIDER - rightW;

  let leftW = leftMaxW;
  let cardH = maxCardH;
  let photoW = 0;
  let photoH = 0;
  if (entry) {
    const availH = maxCardH - PAD * 2;
    const availW = leftMaxW - PAD * 2;
    photoH = availH;
    photoW = photoH * aspect;
    if (photoW > availW) {
      photoW = availW;
      photoH = photoW / aspect;
    }
    leftW = photoW + PAD * 2;
    cardH = photoH + PAD * 2;
  }
  const cardW = leftW + DIVIDER + rightW;

  const pickFile = () => fileRef.current?.click();
  const send = () => {
    const t = text.trim();
    if (!t || sending) return;
    void add(t);
    setText("");
  };

  return (
    <div
      data-no-scroll
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 p-6"
    >
      {/* 背景遮罩：仅此处注册关闭 */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* 明信片 */}
        <div
          className="flex overflow-hidden rounded-xl border-2 shadow-2xl"
          style={{ borderColor: INK, backgroundColor: PAPER_SOFT, width: cardW, height: cardH }}
        >
          {/* 左：照片 / 上传“+” */}
          <div
            className="relative flex shrink-0 items-center justify-center"
            style={{ width: leftW, padding: PAD }}
          >
            {entry ? (
              <div className="relative" style={{ width: photoW, height: photoH }}>
                <img
                  src={entry.url}
                  alt=""
                  onLoad={(e) =>
                    setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)
                  }
                  className="block h-full w-full object-cover"
                  style={{ border: "2px solid #9a9a9a", borderRadius: 2 }}
                />
                <Tape style={{ left: -28, top: -9, transform: "rotate(-45deg)" }} />
                <Tape style={{ left: photoW - 28, top: -9, transform: "rotate(45deg)" }} />
                <Tape style={{ left: -28, top: photoH - 9, transform: "rotate(45deg)" }} />
                <Tape style={{ left: photoW - 28, top: photoH - 9, transform: "rotate(-45deg)" }} />
              </div>
            ) : (
              <button
                type="button"
                onClick={pickFile}
                aria-label="上传照片"
                className="flex h-full w-full items-center justify-center"
              >
                <span
                  className="pw-hand"
                  style={{ fontSize: "min(16vh, 15vw)", lineHeight: 1, color: INK }}
                >
                  +
                </span>
              </button>
            )}
          </div>

          {/* 中：竖线（内缩，不顶上下边） */}
          <div className="flex shrink-0 items-center justify-center" style={{ width: DIVIDER }}>
            <div
              style={{ width: DIVIDER, height: "78%", backgroundColor: INK, borderRadius: 4 }}
            />
          </div>

          {/* 右：留言横线 + 输入 */}
          <div className="flex flex-col" style={{ width: rightW }}>
            <div
              ref={listRef}
              className="min-h-0 flex-1 overflow-y-auto"
              style={{ padding: "16px 22px 6px" }}
            >
              <div className="pw-ruled min-h-full">
                {messages.map((m) => (
                  <div key={m.id} className="pw-line-row pw-hand" style={{ color: INK }}>
                    {m.text}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{ margin: "0 20px", height: 0, borderTop: `2px solid ${INK}`, opacity: 0.45 }}
            />

            <div className="flex items-center gap-2" style={{ padding: "14px 22px" }}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MESSAGE_MAX_LEN))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    send();
                  }
                }}
                maxLength={MESSAGE_MAX_LEN}
                placeholder="写下想说的话…"
                className="pw-hand min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:opacity-40"
                style={{ color: INK }}
              />
              <SketchButton size="md" onClick={send} disabled={sending || !text.trim()}>
                发送
              </SketchButton>
            </div>
          </div>
        </div>

        {entry && (
          <div className="flex items-center gap-5">
            <SketchButton onClick={pickFile} disabled={busy}>
              替换
            </SketchButton>
            <SketchButton tone="danger" onClick={() => onRemove(slot)} disabled={busy}>
              删除
            </SketchButton>
          </div>
        )}

        {error && (
          <p className="pw-hand text-lg" style={{ color: DANGER }}>
            {error}
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && slot) onUpload(slot, f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
