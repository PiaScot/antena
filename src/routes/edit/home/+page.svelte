<script lang="ts">
import { droppable, draggable, type DragDropState } from "@thisux/sveltednd";
import { Check, X, Plus, Trash2, Save, LoaderCircle } from "@lucide/svelte";
import {
	sites as sitesStore,
	clearCategoryFromSites,
} from "$lib/stores/siteStore";
import {
	categories as categoriesStore,
	addCategory,
	removeCategory as removeCategoryFromStore,
	setCategories,
	updateCategory as updateCategoryInStore,
} from "$lib/stores/categoryStore";
import type { Category } from "$lib/types";

const categories = $derived($categoriesStore);
let displayCategories = $state<Category[]>([]);
let gridCols = $state(2);

let categoryState = $state({
	newId: "",
	newLabel: "",
	selectedIdForEdit: "",
	editForm: { id: "", label: "" },
	originalId: "",
	deleteIdx: null as number | null,
	showConfirm: false,
	error: "",
	isProcessing: false,
});

$effect(() => {
	displayCategories = JSON.parse(JSON.stringify(categories));
});

function handleDrop(state: DragDropState<Category>) {
	const { draggedItem, targetContainer } = state;
	const items = displayCategories;
	const dragIndex = items.findIndex((item) => item.id === draggedItem.id);
	const dropIndex = Number.parseInt(targetContainer ?? dragIndex.toString());

	if (dragIndex !== -1 && !Number.isNaN(dropIndex)) {
		const [reorderedItem] = items.splice(dragIndex, 1);
		items.splice(dropIndex, 0, reorderedItem);
	}
}

function toggleVisible(id: string) {
	const index = displayCategories.findIndex((c) => c.id === id);
	if (index > -1) {
		displayCategories[index].visible = !displayCategories[index].visible;
	}
}

async function saveHomepageSettings() {
	categoryState.isProcessing = true;
	try {
		// TODO: この変更をDBに保存するためのAPIエンドポイントを作成・呼び出し
		// 例: PATCH /api/settings/categories
		// const res = await fetch('/api/settings/categories', {
		// 	method: 'PATCH',
		// 	body: JSON.stringify(displayCategories)
		// });
		// if (!res.ok) throw new Error("設定の保存に失敗しました。");

		setCategories(displayCategories);
		alert(
			"ホームページの設定を保存しました（現在はフロントエンドのみの反映です）",
		);
	} catch (e) {
		alert(e instanceof Error ? e.message : "保存に失敗しました。");
	} finally {
		categoryState.isProcessing = false;
	}
}

function cancelHomepageSettings() {
	displayCategories = JSON.parse(JSON.stringify(categories));
}

function handleCategorySelect(e: Event) {
	const target = e.target as HTMLSelectElement;
	const id = target.value;
	categoryState.selectedIdForEdit = id;
	categoryState.error = "";

	if (id) {
		const catToEdit = categories.find((c) => c.id === id);
		if (catToEdit) {
			categoryState.editForm = { ...catToEdit };
			categoryState.originalId = catToEdit.id;
		}
	} else {
		categoryState.editForm = { id: "", label: "" };
		categoryState.originalId = "";
	}
}

async function updateCategoryHandler() {
	if (!categoryState.originalId) return;
	const { id, label } = categoryState.editForm;
	if (!id.trim() || !label.trim()) {
		categoryState.error = "IDとラベルの両方を入力してください。";
		return;
	}
	categoryState.isProcessing = true;
	categoryState.error = "";
	try {
		const res = await fetch("/api/category", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ originalId: categoryState.originalId, id, label }),
		});
		const resData = await res.json();
		if (!res.ok)
			throw new Error(resData.error || "カテゴリの更新に失敗しました。");
		updateCategoryInStore(categoryState.originalId, resData.category);
		categoryState.selectedIdForEdit = "";
	} catch (e) {
		categoryState.error = e instanceof Error ? e.message : JSON.stringify(e);
	} finally {
		categoryState.isProcessing = false;
	}
}

async function addCategoryHandler() {
	const { newId, newLabel } = categoryState;
	if (!newId.trim() || !newLabel.trim()) {
		categoryState.error = "IDとラベルの両方を入力してください。";
		return;
	}
	categoryState.isProcessing = true;
	categoryState.error = "";
	try {
		const res = await fetch("/api/category", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: newId.trim(), label: newLabel.trim() }),
		});
		const resData = await res.json();
		if (!res.ok)
			throw new Error(resData.error || "カテゴリの追加に失敗しました。");
		addCategory(resData.category);
		categoryState.newId = "";
		categoryState.newLabel = "";
	} catch (e) {
		categoryState.error = e instanceof Error ? e.message : String(e);
	} finally {
		categoryState.isProcessing = false;
	}
}

function confirmDeleteCategory(idx: number) {
	categoryState.deleteIdx = idx;
	categoryState.showConfirm = true;
}

async function removeCategoryHandler() {
	if (categoryState.deleteIdx === null) return;
	const catToRemove = categories[categoryState.deleteIdx];
	if (!catToRemove) return;

	categoryState.isProcessing = true;
	categoryState.error = "";
	try {
		const res = await fetch(`/api/category?id=${catToRemove.id}`, {
			method: "DELETE",
		});
		if (!res.ok) {
			const resData = await res.json();
			throw new Error(resData.error || "カテゴリの削除に失敗しました。");
		}
		removeCategoryFromStore(catToRemove.id);
		clearCategoryFromSites(catToRemove.id);
		cancelDelete();
	} catch (e) {
		categoryState.error = e instanceof Error ? e.message : String(e);
		alert(categoryState.error);
	} finally {
		categoryState.isProcessing = false;
	}
}

function cancelDelete() {
	categoryState.showConfirm = false;
	categoryState.deleteIdx = null;
}
</script>

<div class="max-w-xl mx-auto p-4">
	<h2 class="text-2xl font-bold mb-6 text-center text-slate-800 dark:text-white">
		ホームページ・カテゴリ管理
	</h2>

	<div class="mb-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl shadow">
		<h3 class="text-lg font-semibold mb-3 text-slate-800 dark:text-white">表示設定</h3>
		<p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
			ホームページに表示するカテゴリの順番と表示/非表示を編集します。矢印ボタンで並び替え、クリックで表示を切り替えられます。
		</p>
		
		<div class="flex justify-center items-center gap-4 mb-6">
		</div>

    <div
      class="grid gap-3 mb-6"
        style="grid-template-columns: repeat({gridCols}, minmax(0, 1fr));"
      >
      {#each displayCategories as cat, index (cat.id)}
      <div
        use:draggable={{
          container: index.toString(),
          dragData: cat,
          interactive: ['[data-delete-btn]', '[data-select-btn]', '.interactive'],
        }}
        use:droppable={{
          container: index.toString(),
          callbacks: { onDrop: handleDrop }
        }}
        class="relative flex items-center pr-10 pl-4 h-16 rounded-xl border-2 shadow select-none cursor-grab {cat.visible
          ? 'bg-emerald-500/90 border-emerald-400 text-white'
          : 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 opacity-60'}"
        tabindex="0"
      >
        <button
          data-select-btn
          class="flex-1 h-full text-lg font-semibold text-center"
          onclick={() => toggleVisible(cat.id)}
        >
          {cat.label}
        </button>

        <span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {#if cat.visible}
            <Check class="w-5 h-5" />
          {:else}
            <X class="w-5 h-5" />
        {/if}
        </span>
      </div>
      {/each}
    </div>
		<div class="flex gap-4 justify-center">
			<button type="button" onclick={saveHomepageSettings} class="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 font-semibold flex-1">この表示設定を保存</button>
			<button type="button" onclick={cancelHomepageSettings} class="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-white flex-1 font-semibold">キャンセル</button>
		</div>
	</div>

	<div class="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl shadow">
		<h3 class="text-lg font-semibold mb-3 text-slate-800 dark:text-white">カテゴリの編集</h3>
		<select onchange={handleCategorySelect} value={categoryState.selectedIdForEdit} class="w-full rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 mb-3">
			<option value="">-- 編集するカテゴリを選択 --</option>
			{#each categories as cat (cat.id)}
				<option value={cat.id}>{cat.label} ({cat.id})</option>
			{/each}
		</select>
		{#if categoryState.selectedIdForEdit}
			<div class="border border-dashed border-slate-400 dark:border-slate-600 rounded-lg p-4 transition">
				{#if categoryState.error}
					<div class="mb-2 p-2 text-sm rounded bg-red-500/20 text-red-500">{categoryState.error}</div>
				{/if}
				<div class="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
					<input type="text" placeholder="新しいカテゴリID" bind:value={categoryState.editForm.id} class="md:col-span-1 rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" disabled={categoryState.isProcessing} />
					<input type="text" placeholder="新しいカテゴリ名" bind:value={categoryState.editForm.label} class="md:col-span-2 rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" disabled={categoryState.isProcessing} />
				</div>
				<button class="w-full bg-blue-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 font-semibold hover:bg-blue-700 transition disabled:opacity-50" onclick={updateCategoryHandler} disabled={categoryState.isProcessing}>
					{#if categoryState.isProcessing}
						<LoaderCircle class="w-4 h-4 animate-spin"/>
					{:else}
						<Save class="w-4 h-4" />
					{/if}
					変更を保存
				</button>
			</div>
		{/if}
	</div>

	<div class="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl shadow">
		<h3 class="text-lg font-semibold mb-3 text-slate-800 dark:text-white">カテゴリの追加と削除</h3>
		{#if categoryState.error && !categoryState.selectedIdForEdit}
			<div class="mb-2 p-2 text-sm rounded bg-red-500/20 text-red-500">{categoryState.error}</div>
		{/if}
		<div class="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
			<input type="text" placeholder="カテゴリID (例: news)" bind:value={categoryState.newId} class="md:col-span-1 rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" disabled={categoryState.isProcessing} />
			<input type="text" placeholder="カテゴリ名 (例: まとめNEWS)" bind:value={categoryState.newLabel} class="md:col-span-2 rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" onkeydown={(e) => e.key === 'Enter' && addCategoryHandler()} disabled={categoryState.isProcessing} />
		</div>
		<button class="w-full bg-emerald-500 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 font-semibold hover:bg-emerald-600 transition disabled:opacity-50" onclick={addCategoryHandler} disabled={categoryState.isProcessing}>
			{#if categoryState.isProcessing}
				<LoaderCircle class="w-4 h-4 animate-spin"/>
			{:else}
				<Plus class="w-4 h-4" />
			{/if}
			新しいカテゴリを追加
		</button>
		<div class="flex flex-wrap gap-2 mt-4">
			{#each categories as cat, idx}
				<span class="inline-flex items-center bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 px-3 py-1 rounded-full font-medium text-sm">
					{cat.label} ({cat.id})
					<button class="ml-2 -mr-1 hover:bg-red-500/20 p-0.5 rounded-full" title="カテゴリ削除" onclick={() => confirmDeleteCategory(idx)}>
						<Trash2 class="w-4 h-4 text-red-500" />
					</button>
				</span>
			{/each}
		</div>
	</div>

	{#if categoryState.showConfirm}
		<div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onclick={cancelDelete}>
			<div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-sm w-full" onclick={(event) => event.stopPropagation()}>
				<p class="mb-4 text-lg font-bold text-center text-slate-800 dark:text-white">本当にこのカテゴリを削除しますか？</p>
				<p class="text-center text-sm text-slate-600 dark:text-slate-400 mb-6">このカテゴリに属するサイトは「カテゴリなし」になります。</p>
				<div class="flex justify-center gap-4">
					<button onclick={removeCategoryHandler} class="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition w-full disabled:opacity-50" disabled={categoryState.isProcessing}>
						{#if categoryState.isProcessing}
							<LoaderCircle class="w-5 h-5 animate-spin"/>
						{:else}
							削除する
						{/if}
					</button>
					<button onclick={cancelDelete} class="px-5 py-2 rounded-lg bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 dark:bg-gray-600 dark:text-white transition w-full">キャンセル</button>
				</div>
			</div>
		</div>
	{/if}
</div>
