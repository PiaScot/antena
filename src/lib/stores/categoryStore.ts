// src/lib/stores/categoryStore.ts
import type { Category, SuperCategoryGroup } from '$lib/types';
import { get, writable } from 'svelte/store';

/**
 * カテゴリ情報の一覧を管理するストア
 */
export const categories = writable<Category[]>([]);

/**
 * ストアにカテゴリ一覧をセットする
 * @param cats 新しいカテゴリの配列
 */
export function setCategories(cats: Category[]) {
	categories.set(cats);
}

export const superCategoryGroups = writable<SuperCategoryGroup[]>([]);

/**
 * ストアに大カテゴリの階層化リストをセットする
 * @param groups 新しい大カテゴリグループの配列
 */
export function setSuperCategoryGroups(groups: SuperCategoryGroup[]) {
	superCategoryGroups.set(groups);
}

/**
 * ストアに新しいカテゴリを1件追加する（重複チェック付き）
 * @param newCat 追加するカテゴリオブジェクト
 */
export function addCategory(newCat: Category) {
	categories.update((currentCats) => {
		if (!currentCats.some((cat) => cat.id === newCat.id)) {
			return [...currentCats, newCat];
		}
		return currentCats;
	});
}

/**
 * ストアから指定IDのカテゴリを削除する
 * @param id 削除するカテゴリのID
 */
export function removeCategory(id: string) {
	categories.update((currentCats) =>
		currentCats.filter((cat) => cat.id !== id)
	);
}

/**
 * ストア内の指定IDのカテゴリ情報を更新する
 * ID自体が変更される可能性に対応
 * @param originalId - 変更前のカテゴリID
 * @param updatedCat - 更新後のカテゴリデータ
 */
export function updateCategory(originalId: string, updatedCat: Category) {
	categories.update((currentCats) =>
		currentCats.map((cat) => (cat.id === originalId ? updatedCat : cat))
	);
}

/**
 * ストア内のカテゴリの表示・非表示を切り替える
 * @param id - 対象のカテゴリID
 * @param visible - 新しい表示状態 (true/false)
 */
export function setCategoryVisible(id: string, visible: boolean) {
	categories.update((cats) =>
		cats.map((cat) => (cat.id === id ? { ...cat, visible } : cat))
	);
}

/**
 * ストアから指定IDのカテゴリを同期的に検索して返す
 * @param id 検索するカテゴリのID
 * @returns カテゴリオブジェクト、またはundefined
 */
export function findCategory(id: string): Category | undefined {
	// ★ .subscribe() の代わりに get() を使ってシンプルに値を取得
	return get(categories).find((cat) => cat.id === id);
}

/**
 * ストアの現在のカテゴリ一覧のスナップショット（コピー）を同期的に取得する
 * @returns カテゴリの配列
 */
export function getCategoriesSnapshot(): Category[] {
	return get(categories);
}
