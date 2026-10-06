/**
 * 火车车厢与车窗几何（单位：SVG viewBox 用户坐标）。
 * train.tsx（渲染车体/窗户）与 photo-wall.tsx（照片叠加层）共用，保证精确对齐。
 */

/** 车厢数量 */
export const CAR_COUNT = 10;
/** 每节车厢宽度（用户坐标） */
export const CAR_W = 268;
/** 车厢带起始 x（紧接车头右侧） */
export const CAR_START = 372;
/** 车厢带总跨度 */
export const CAR_SPAN = CAR_COUNT * CAR_W;

/** 车厢车身 */
export const CAR_BODY_Y = 150;
export const CAR_BODY_H = 86;

/** 每节车厢的窗户数 */
export const WINDOWS_PER_CAR = 6;
/** 正方形窗户边长 */
export const WINDOW_SIZE = 30;
/** 窗户上边缘 y */
export const WINDOW_Y = 168;
/** 每节第一扇窗相对节起点的 x 偏移 */
export const WINDOW_X0 = 18;
/** 窗间距（步长） */
export const WINDOW_STEP = 40;

/** viewBox 参数（与 train.tsx 的 svg viewBox 一致） */
export const VIEWBOX_WIDTH = 400;
export const VIEWBOX_HEIGHT = 280;
export const VIEWBOX_MIN_X = -14;
export const VIEWBOX_MIN_Y = 0;

/** 发车过场缩放支点（车厢起点 + 地面接触点） */
export const PIVOT_X = 372;
export const PIVOT_Y = 280;
/** 发车过场结束时的镜头拉近倍率 */
export const DEPART_ZOOM = 3.0;

export interface WindowSlot {
  id: string;
  k: number;
  i: number;
  /** 用户坐标（左上角）与外框尺寸 */
  ux: number;
  uy: number;
  uw: number;
  uh: number;
}

export function slotId(k: number, i: number): string {
  return `w-${k}-${i}`;
}

export function windowUserX(k: number, i: number): number {
  return CAR_START + k * CAR_W + WINDOW_X0 + i * WINDOW_STEP;
}

/** 枚举全部窗户槽位（车厢从左到右，节内窗户从左到右） */
export function enumerateSlots(): WindowSlot[] {
  const slots: WindowSlot[] = [];
  for (let k = 0; k < CAR_COUNT; k++) {
    for (let i = 0; i < WINDOWS_PER_CAR; i++) {
      slots.push({
        id: slotId(k, i),
        k,
        i,
        ux: windowUserX(k, i),
        uy: WINDOW_Y,
        uw: WINDOW_SIZE,
        uh: WINDOW_SIZE,
      });
    }
  }
  return slots;
}
