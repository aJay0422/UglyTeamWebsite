import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * 照片墙的服务端存储：图片存文件系统，窗户 -> 图片 映射存 JSON。
 * 数据根目录由 env PHOTO_DATA_DIR 指定（默认 <cwd>/data）。
 */

export interface PhotoEntry {
  file: string;
  thumb?: string;
  updatedAt: number;
}

export type PhotoMap = Record<string, PhotoEntry>;

export interface SaveInput {
  buffer: Buffer;
  ext: string;
}

const ROOT = process.env.PHOTO_DATA_DIR || path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const META_FILE = path.join(ROOT, "photos.json");

/** 串行化写操作，避免并发写坏 JSON */
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

async function readMap(): Promise<PhotoMap> {
  try {
    const raw = await fs.readFile(META_FILE, "utf8");
    const parsed = JSON.parse(raw) as { photos?: PhotoMap };
    return parsed?.photos ?? {};
  } catch {
    return {};
  }
}

async function writeMap(map: PhotoMap): Promise<void> {
  await ensureDirs();
  const tmp = `${META_FILE}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ version: 1, photos: map }, null, 2), "utf8");
  await fs.rename(tmp, META_FILE);
}

async function removeFiles(entry: PhotoEntry): Promise<void> {
  for (const f of [entry.file, entry.thumb]) {
    if (!f) continue;
    try {
      await fs.unlink(path.join(UPLOAD_DIR, f));
    } catch {
      // 文件可能已不存在，忽略
    }
  }
}

export function uploadsDir(): string {
  return UPLOAD_DIR;
}

export function listPhotos(): Promise<PhotoMap> {
  return serialize(readMap);
}

export function savePhoto(
  slot: string,
  original: SaveInput,
  thumb?: SaveInput
): Promise<PhotoEntry> {
  return serialize(async () => {
    await ensureDirs();
    const map = await readMap();
    const id = randomUUID().replace(/-/g, "");

    const file = `${id}${original.ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, file), original.buffer);

    let thumbFile: string | undefined;
    if (thumb) {
      thumbFile = `${id}.thumb${thumb.ext}`;
      await fs.writeFile(path.join(UPLOAD_DIR, thumbFile), thumb.buffer);
    }

    const entry: PhotoEntry = { file, thumb: thumbFile, updatedAt: Date.now() };
    const old = map[slot];
    map[slot] = entry;
    await writeMap(map);
    if (old) await removeFiles(old);
    return entry;
  });
}

export function deletePhoto(slot: string): Promise<void> {
  return serialize(async () => {
    const map = await readMap();
    const old = map[slot];
    if (!old) return;
    delete map[slot];
    await writeMap(map);
    await removeFiles(old);
  });
}
