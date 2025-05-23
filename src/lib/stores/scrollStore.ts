import { writable } from "svelte/store";

/**
 * 各ページのスクロール位置を保持するストア
 * キー: ページの完全なURL (例: '/feed?category=all')
 * 値: Y軸のスクロール位置 (ピクセル)
 */
export const scrollPositions = writable<{ [path: string]: number }>({});
