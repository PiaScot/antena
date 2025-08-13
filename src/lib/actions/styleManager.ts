import { userSettings, fontSizeClassMap } from '$lib/stores/userSettingsStore';
import type { Action } from 'svelte/action';

/**
 * userSettingsストアを購読し、<html>要素にテーマとフォントサイズのクラスを動的に適用するSvelteアクション
 */
export const styleManager: Action = () => {
  // userSettingsストアの変更を監視
  const unsubscribe = userSettings.subscribe((settings) => {
    const root = document.documentElement;

    // 1. テーマ管理
    root.classList.toggle('dark', settings.theme === 'dark');

    // 2. フォントサイズ管理
    // 一旦すべてのフォントサイズクラスを削除
    Object.values(fontSizeClassMap).forEach((className) => {
      root.classList.remove(className);
    });
    // 現在設定されているクラスを追加
    root.classList.add(fontSizeClassMap[settings.fontSize]);
  });

  // アクションが破棄されるときに、ストアの購読を解除する
  return {
    destroy() {
      unsubscribe();
    }
  };
};
