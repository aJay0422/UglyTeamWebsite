"use client";

import { useCallback, useEffect, useState } from "react";

export interface PhotoEntry {
  url: string;
  thumbUrl: string;
  updatedAt: number;
}

export type PhotoMap = Record<string, PhotoEntry>;

export function usePhotos() {
  const [photos, setPhotos] = useState<PhotoMap>({});

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/photos", { cache: "no-store" });
      if (res.ok) setPhotos((await res.json()) as PhotoMap);
    } catch {
      // 忽略网络错误
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = useCallback(async (slot: string, file: File) => {
    const fd = new FormData();
    fd.append("slot", slot);
    fd.append("file", file);
    const res = await fetch("/api/photos", { method: "POST", body: fd });
    if (!res.ok) throw new Error("上传失败");
    const data = (await res.json()) as { entry: PhotoEntry };
    setPhotos((prev) => ({ ...prev, [slot]: data.entry }));
  }, []);

  const remove = useCallback(async (slot: string) => {
    const res = await fetch(`/api/photos?slot=${encodeURIComponent(slot)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("删除失败");
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  }, []);

  return { photos, refresh, upload, remove };
}
