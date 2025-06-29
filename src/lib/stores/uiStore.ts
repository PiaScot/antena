import { writable } from "svelte/store";

/**
 * trueならレイアウト編集モード、falseなら閲覧モード。
 */
export const isLayoutEditMode = writable<boolean>(false);
