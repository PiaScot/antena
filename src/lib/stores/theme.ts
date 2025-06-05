import { browser } from "$app/environment";
import { writable } from "svelte/store";

type Theme = "light" | "dark";

function init(): Theme {
  if (!browser) return "light";
  return (localStorage.getItem("theme") as Theme) || "light";
}

export const theme = writable<Theme>(init());

// ストアが変わるたびに DOM / localStorage へ反映
if (browser) {
  theme.subscribe((val) => {
    document.documentElement.classList.toggle("dark", val === "dark");
    localStorage.setItem("theme", val);
  });
}

// フォントサイズの取りうる値を型として定義
export type FontSizeValue = "small" | "medium" | "large";

// フォントサイズのストア (初期値は 'medium')
export const fontSize = writable<FontSizeValue>("medium");

// フォントサイズの値と対応するTailwind CSSクラスのマッピング
export const fontSizeClassMap: Record<FontSizeValue, string> = {
  small: "text-xs", // 0.75rem (12px)
  medium: "text-sm", // 0.875rem (14px)
  large: "text-lg", // 1.125rem (18px)
};
