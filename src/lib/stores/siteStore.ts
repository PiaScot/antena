import type { Site } from "$lib/types";
import { get, writable } from "svelte/store";

/**
 * サイト情報の一覧を管理するストア
 */
export const sites = writable<Site[]>([]);

/**
 * ストアにサイト一覧をセットする
 * @param newSites 新しいサイトの配列
 */
export function setSites(newSites: Site[]) {
  sites.set(newSites);
}

/**
 * ストアに新しいサイトを1件追加する（重複チェック付き）
 * @param newSite 追加するサイトオブジェクト
 */
export function addSite(newSite: Site) {
  sites.update((currentSites) => {
    if (!currentSites.some((site) => site.id === newSite.id)) {
      return [...currentSites, newSite];
    }
    return currentSites;
  });
}

/**
 * ストアから指定IDのサイトを削除する
 * @param id 削除するサイトのID
 */
export function removeSite(id: number) {
  sites.update((currentSites) => currentSites.filter((site) => site.id !== id));
}

/**
 * ストア内の指定IDのサイト情報を更新する
 * @param updatedSite 更新後のサイトオブジェクト
 */
export function updateSite(updatedSite: Site) {
  sites.update((currentSites) =>
    currentSites.map((
      site,
    ) => (site.id === updatedSite.id ? updatedSite : site))
  );
}

/**
 * 指定されたカテゴリIDを持つ全てのサイトから、カテゴリ情報をクリアする
 * @param categoryId クリア対象のカテゴリID
 */
export function clearCategoryFromSites(categoryId: string) {
  sites.update((currentSites) =>
    currentSites.map((site) =>
      site.category === categoryId
        ? { ...site, category: "" } // categoryを空文字列に
        : site
    )
  );
}

/**
 * ストアから指定IDのサイトを同期的に検索して返す
 * @param id 検索するサイトのID
 * @returns サイトオブジェクト、またはundefined
 */
export function findSite(id: number): Site | undefined {
  // ★ .subscribe() の代わりに get() を使ってシンプルに値を取得
  return get(sites).find((site) => site.id === id);
}

/**
 * ストアの現在のサイト一覧のスナップショット（コピー）を同期的に取得する
 * @returns サイトの配列
 */
export function getSitesSnapshot(): Site[] {
  return get(sites);
}
