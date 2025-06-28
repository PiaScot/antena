import { writable } from "svelte/store";

/**
 * trueならレイアウト編集モード、falseなら閲覧モード。
 * アプリケーション全体でこの状態を共有する。
 */
export const isLayoutEditMode = writable<boolean>(false);
