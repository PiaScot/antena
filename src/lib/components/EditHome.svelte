<script lang="ts">
import { dndzone, type DndEvent } from "svelte-dnd-action";
import { onMount } from "svelte";
import { Check, X, GripVertical } from "lucide-svelte";

// 型
type Category = {
	id: string;
	label: string;
	visible: boolean;
};

const defaultCategories: Category[] = [
	{ id: "news", label: "まとめNEWS", visible: true },
	{ id: "chat", label: "雑談", visible: true },
	{ id: "it", label: "IT・ガジェット", visible: true },
	{ id: "orckt", label: "面白・衝撃", visible: true },
	{ id: "all", label: "ALL", visible: true },
	{ id: "real", label: "REAL", visible: true },
	{ id: "2d", label: "2D", visible: true },
];

let categories: Category[] = [...defaultCategories];
let originalCategories: Category[] = [];
let gridCols: number = 2;

// 変更前の状態を保存
onMount(() => {
	originalCategories = JSON.parse(JSON.stringify(categories));
});

// 並び替え
function handleDnd(event: CustomEvent<{ items: Category[] }>) {
	categories = event.detail.items;
}

// カテゴリ表示/非表示
function toggleVisible(idx: number) {
	categories = categories.map((cat, i) =>
		i === idx ? { ...cat, visible: !cat.visible } : cat,
	);
}

// 列数変更
function setGridCols(cols: number) {
	gridCols = cols;
}

// 保存
function saveEdit() {
	originalCategories = JSON.parse(JSON.stringify(categories));
	alert("保存しました（ダミー）");
}

// キャンセル
function cancelEdit() {
	categories = JSON.parse(JSON.stringify(originalCategories));
	gridCols = 2;
}
</script>

<div class="max-w-xl mx-auto p-4">
  <h2 class="text-2xl font-bold mb-6 text-center text-slate-800 dark:text-white">ホームカテゴリ編集</h2>

  <!-- レイアウトコントロール -->
  <div class="flex justify-center items-center gap-4 mb-6">
    <span class="text-slate-700 dark:text-slate-200 font-semibold">グリッド列数</span>
    <div class="flex gap-1">
      {#each [1, 2, 3, 4] as n}
        <button
          type="button"
          class={`w-9 h-9 flex items-center justify-center rounded-full border transition
            ${gridCols === n ? 'bg-emerald-500 text-white border-emerald-600 shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'}
          `}
          aria-label={n + "カラム"}
          on:click={() => setGridCols(n)}
        >{n}</button>
      {/each}
    </div>
  </div>

  <!-- 並び替え & 表示切替 -->
  <ul
    use:dndzone={{ items: categories, flipDurationMs: 200 }}
    on:consider={handleDnd}
    class={`grid gap-3 mb-8`}
    style={`grid-template-columns: repeat(${gridCols}, minmax(0, 1fr));`}
  >
    {#each categories as cat, idx (cat.id)}
      <li>
        <div
          class={`relative flex items-center px-3 py-4 rounded-xl border-2 shadow group transition-all select-none cursor-pointer
            ${cat.visible
              ? "bg-emerald-500/90 border-emerald-400 text-white"
              : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 opacity-60"}
          `}
          tabindex="0"
          aria-pressed={cat.visible}
          on:click={() => toggleVisible(idx)}
        >
          <span class="absolute left-2 top-2 opacity-60 cursor-grab group-hover:opacity-100" title="ドラッグで移動" aria-hidden="true">
            <GripVertical class="w-5 h-5" />
          </span>
          <span class="flex-1 text-xl font-semibold flex items-center justify-center">{cat.label}</span>
          <span class="absolute right-2 top-2">
            {#if cat.visible}
              <Check class="w-5 h-5" />
            {:else}
              <X class="w-5 h-5" />
            {/if}
          </span>
        </div>
      </li>
    {/each}
  </ul>

  <!-- 保存・キャンセル -->
  <div class="flex gap-4 justify-center mt-6">
    <button type="button" on:click={saveEdit} class="bg-emerald-600 text-white px-5 py-2 rounded hover:bg-emerald-700">保存</button>
    <button type="button" on:click={cancelEdit} class="bg-gray-300 text-gray-700 px-5 py-2 rounded hover:bg-gray-400 dark:bg-gray-500 dark:text-white dark:hover:bg-gray-600">キャンセル</button>
  </div>
</div>

<style>
/* ドラッグハンドルをアイコンで表示 */
[aria-pressed="true"] { outline: none; }
</style>
