import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * 明信片留言的服务端存储（按窗户槽位分组）。
 * 与照片共用同一个数据根目录（env PHOTO_DATA_DIR，默认 <cwd>/data）。
 */

export interface Message {
  id: string;
  text: string;
  createdAt: number;
}

export type MessageMap = Record<string, Message[]>;

/** 单条留言最大字数 */
export const MESSAGE_MAX_LEN = 15;
/** 每个窗户最多保留的留言数 */
const MAX_PER_SLOT = 200;

const ROOT = process.env.PHOTO_DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(ROOT, "messages.json");

let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readMap(): Promise<MessageMap> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as { messages?: MessageMap };
    return parsed?.messages ?? {};
  } catch {
    return {};
  }
}

async function writeMap(map: MessageMap): Promise<void> {
  await fs.mkdir(ROOT, { recursive: true });
  const tmp = `${FILE}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ version: 1, messages: map }, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

export function listMessages(): Promise<MessageMap> {
  return serialize(readMap);
}

export function addMessage(slot: string, text: string): Promise<Message> {
  return serialize(async () => {
    const clean = text.trim().slice(0, MESSAGE_MAX_LEN);
    const map = await readMap();
    const list = map[slot] ?? [];
    const message: Message = {
      id: randomUUID().replace(/-/g, ""),
      text: clean,
      createdAt: Date.now(),
    };
    list.push(message);
    if (list.length > MAX_PER_SLOT) list.splice(0, list.length - MAX_PER_SLOT);
    map[slot] = list;
    await writeMap(map);
    return message;
  });
}

/** 删除某个窗户的全部留言（删除照片时一并调用） */
export function deleteMessages(slot: string): Promise<void> {
  return serialize(async () => {
    const map = await readMap();
    if (!map[slot]) return;
    delete map[slot];
    await writeMap(map);
  });
}
