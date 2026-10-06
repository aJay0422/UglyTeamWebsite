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

import { usePhotos, type PhotoMap } from "./use-photos";

/** 玻璃开启动画时长（毫秒）；与 globals.css 的 pw-glass-open 保持一致 */
export const OPEN_MS = 420;

interface PhotoWallContextValue {
  /** 已被占用的窗户槽位 -> 图片 */
  photos: PhotoMap;
  /** 正在播放开启动画的槽位 */
  opening: string | null;
  /** 相框查看器打开的槽位 */
  openSlot: string | null;
  busy: boolean;
  error: string | null;
  /** 点击窗户：先播放开启动画，再打开相框 */
  open: (slot: string) => void;
  close: () => void;
  upload: (slot: string, file: File) => Promise<void>;
  remove: (slot: string) => Promise<void>;
}

const PhotoWallContext = createContext<PhotoWallContextValue | null>(null);

export function usePhotoWall() {
  const ctx = useContext(PhotoWallContext);
  if (!ctx) throw new Error("usePhotoWall 必须在 <PhotoWallProvider> 内使用");
  return ctx;
}

/**
 * 照片墙共享状态：供 SVG（绘制玻璃线条）与 HTML 叠加层（点击热区 / 相框）共用。
 */
export function PhotoWallProvider({ children }: { children: ReactNode }) {
  const { photos, upload: uploadRaw, remove: removeRaw } = usePhotos();
  const [opening, setOpening] = useState<string | null>(null);
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const open = useCallback((slot: string) => {
    setOpening(slot);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setOpening((cur) => (cur === slot ? null : cur));
      setOpenSlot(slot);
      timerRef.current = null;
    }, OPEN_MS);
  }, []);

  const close = useCallback(() => {
    setOpenSlot(null);
    setError(null);
  }, []);

  const upload = useCallback(
    async (slot: string, file: File) => {
      setBusy(true);
      setError(null);
      try {
        await uploadRaw(slot, file);
      } catch {
        setError("上传失败，请重试");
      } finally {
        setBusy(false);
      }
    },
    [uploadRaw]
  );

  const remove = useCallback(
    async (slot: string) => {
      setBusy(true);
      setError(null);
      try {
        await removeRaw(slot);
      } catch {
        setError("删除失败，请重试");
      } finally {
        setBusy(false);
      }
    },
    [removeRaw]
  );

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  return (
    <PhotoWallContext.Provider
      value={{ photos, opening, openSlot, busy, error, open, close, upload, remove }}
    >
      {children}
    </PhotoWallContext.Provider>
  );
}
