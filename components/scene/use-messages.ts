"use client";

import { useCallback, useEffect, useState } from "react";

export interface Message {
  id: string;
  text: string;
  createdAt: number;
}

/** 单条留言最大字数（与后端一致） */
export const MESSAGE_MAX_LEN = 15;

/** 拉取某个窗户的留言 + 追加留言 */
export function useMessages(slot: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!slot) {
      setMessages([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/messages?slot=${encodeURIComponent(slot)}`, {
          cache: "no-store",
        });
        const data = res.ok ? await res.json() : [];
        if (alive) setMessages(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setMessages([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slot]);

  const add = useCallback(
    async (text: string) => {
      if (!slot) return;
      const clean = text.trim().slice(0, MESSAGE_MAX_LEN);
      if (!clean) return;
      setSending(true);
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, text: clean }),
        });
        if (!res.ok) throw new Error("发送失败");
        const { message } = (await res.json()) as { message: Message };
        setMessages((prev) => [...prev, message]);
      } finally {
        setSending(false);
      }
    },
    [slot]
  );

  return { messages, sending, add };
}
