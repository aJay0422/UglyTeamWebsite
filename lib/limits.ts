/** 单张图片上传大小上限（字节）。前后端共用。 */
export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

/** 上限对应的 MB（用于提示文案） */
export const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
