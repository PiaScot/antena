// src/lib/stores/persistentStore.ts

import { type Writable, writable } from "svelte/store";
import { browser } from "$app/environment";

/**
 * localStorageと連携するSvelteのwritableストアを作成します。
 * @param key localStorageに保存するためのキー
 * @param initialValue 初期値
 */
export function createPersistentStore<T>(
  key: string,
  initialValue: T,
): Writable<T> {
  // サーバーサイドではlocalStorageにアクセスできないため、何もしない
  if (!browser) {
    return writable(initialValue);
  }

  // ブラウザ側でのみ処理を続行
  const storedValue = localStorage.getItem(key);
  const data = storedValue ? (JSON.parse(storedValue) as T) : initialValue;

  const store = writable(data);

  // ストアの値が更新されたら、localStorageにも保存する
  store.subscribe((value) => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  return store;
}
