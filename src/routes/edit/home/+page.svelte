<script lang="ts">
import { dndzone } from "svelte-dnd-action";
import { Check, X, GripVertical, Plus, Trash2 } from "@lucide/svelte";
import { sites as sitesStore } from "$lib/stores/siteStore";
import {
	categories as categoriesStore,
	addCategory,
	removeCategory as removeCategoryFromStore,
	setCategories,
} from "$lib/stores/categoryStore";
import type { Category } from "$lib/types";

// --- State ---
// ストアから直接リアクティブな値を参照
const categories = $derived($categoriesStore);

// このページ固有の状態
let displayCategories = $state<Category[]>([]); // 表示・並び替え用のローカルコピー
let gridCols = $state(2);
let categoryState = $state({
	newId: "",
	newLabel: "",
	deleteIdx: null as number | null,
	showConfirm: false,
	error: "",
	isProcessing: false,
});

// --- Effects ---
// ストアのカテゴリ情報が変更されたら、このページの表示用データも更新する
$effect(() => {
	// ディープコピーして、ストア自体を変更しないようにする
	displayCategories = JSON.parse(JSON.stringify(categories));
});

// --- Functions ---

function handleDnd(event: CustomEvent<{ items: Category[]; final?: boolean }>) {
	// dndzoneが並び替えた結果をローカルの表示用データに反映
	displayCategories = event.detail.items;
}

function toggleVisible(id: string) {
	const index = displayCategories.findIndex((c) => c.id === id);
	if (index > -1) {
		displayCategories[index].visible = !displayCategories[index].visible;
	}
}

async function saveHomepageSettings() {
	// TODO: この変更をDBに保存するためのAPIエンドポイントを作成する必要があります。
	// 例: PATCH /api/categories/settings
	try {
		// alert(`保存処理を実装する必要があります: ${JSON.stringify(displayCategories)}`);
		// API呼び出しが成功したら、グローバルなストアも更新
		setCategories(displayCategories);
		alert("ホームページの設定を保存しました（ダミー）");
	} catch (e) {
		alert("保存に失敗しました。");
	}
}

function cancelHomepageSettings() {
	// ストアの現在の値に戻す
	displayCategories = JSON.parse(JSON.stringify(categories));
}

async function addCategoryHandler() {
	const id = categoryState.newId.trim();
	const label = categoryState.newLabel.trim();
	if (!id || !label) {
		categoryState.error = "IDとラベルの両方を入力してください。";
		return;
	}

	categoryState.isProcessing = true;
	categoryState.error = "";
	try {
		const res = await fetch("/api/category", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, label }),
		});
		const resData = await res.json();
		if (!res.ok)
			throw new Error(resData.error || "カテゴリの追加に失敗しました。");

		// APIから返された新しいカテゴリをストアに追加（UIが自動で更新される）
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
	// displayCategoriesから削除対象を取得
	const catToRemove = displayCategories[categoryState.deleteIdx];
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

		// ストアからカテゴリを削除
		removeCategoryFromStore(catToRemove.id);
		// 該当カテゴリを使用していたサイトのカテゴリを空にする
		sitesStore.update((currentSites) =>
			currentSites.map((s) =>
				s.category === catToRemove.id ? { ...s, category: "" } : s,
			),
		);
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
	<h2 class="text-2xl font-bold mb-6 text-center text-slate-800 dark:text-white">ホームページ・カテゴリ管理</h2>

	<!-- ホームページ表示設定 -->
	<div class="mb-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl shadow">
		<h3 class="text-lg font-semibold mb-3 text-slate-800 dark:text-white">表示設定</h3>
		<p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
			ホームページに表示するカテゴリの順番と表示/非表示を編集します。ドラッグ＆ドロップで並び替え、クリックで表示を切り替えられます。
		</p>
		<div class="flex justify-center items-center gap-4 mb-6">
			<span class="text-slate-700 dark:text-slate-200 font-semibold">グリッド列数</span>
			<div class="flex gap-1">
				{#each [1, 2, 3, 4] as n}
					<button
						type="button"
						class={`w-9 h-9 flex items-center justify-center rounded-full border transition
							${gridCols === n ? 'bg-emerald-500 text-white border-emerald-600 shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'}
						`}
						aria-label={n + "カラム"}
						onclick={() => gridCols = n}
					>{n}</button>
				{/each}
			</div>
		</div>

		<!-- D&Dリスト -->
		<ul
			use:dndzone={{ items: displayCategories, flipDurationMs: 200 }}
			onconsider={handleDnd}
			class={`grid gap-3 mb-6`}
			style={`grid-template-columns: repeat(${gridCols}, minmax(0, 1fr));`}
		>
			{#each displayCategories as cat (cat.id)}
				<li>
					<div
						class={`relative flex items-center px-3 py-4 rounded-xl border-2 shadow group transition-all select-none cursor-pointer
							${cat.visible
								? "bg-emerald-500/90 border-emerald-400 text-white"
								: "bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 opacity-60"}
						`}
						tabindex="0"
						aria-pressed={cat.visible}
						onclick={() => toggleVisible(cat.id)}
					>
						<span class="absolute left-2 top-1/2 -translate-y-1/2 opacity-60 cursor-grab group-hover:opacity-100" title="ドラッグで移動">
							<GripVertical class="w-5 h-5" />
						</span>
						<span class="flex-1 text-lg font-semibold text-center">{cat.label}</span>
						<span class="absolute right-2 top-1/2 -translate-y-1/2">
							{#if cat.visible} <Check class="w-5 h-5" /> {:else} <X class="w-5 h-5" /> {/if}
						</span>
					</div>
				</li>
			{/each}
		</ul>
		<div class="flex gap-4 justify-center">
			<button type="button" onclick={saveHomepageSettings} class="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 font-semibold flex-1">この表示設定を保存</button>
			<button type="button" onclick={cancelHomepageSettings} class="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-white flex-1 font-semibold">キャンセル</button>
		</div>
	</div>

	<!-- カテゴリ管理 -->
	<div class="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl shadow">
		<h3 class="text-lg font-semibold mb-3 text-slate-800 dark:text-white">カテゴリの追加と削除</h3>
		{#if categoryState.error}
			<div class="mb-2 p-2 text-sm rounded bg-red-500/20 text-red-500">{categoryState.error}</div>
		{/if}
		<div class="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
			<input type="text" placeholder="カテゴリID (例: news)" bind:value={categoryState.newId} class="md:col-span-1 rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" disabled={categoryState.isProcessing} />
			<input type="text" placeholder="カテゴリ名 (例: まとめNEWS)" bind:value={categoryState.newLabel} class="md:col-span-2 rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" onkeydown={(e) => e.key === 'Enter' && addCategoryHandler()} disabled={categoryState.isProcessing} />
		</div>
		<button class="w-full bg-emerald-500 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 font-semibold hover:bg-emerald-600 transition disabled:opacity-50" onclick={addCategoryHandler} disabled={categoryState.isProcessing}>
			<Plus class="w-4 h-4" />新しいカテゴリを追加
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

	<!-- 削除確認モーダル -->
	{#if categoryState.showConfirm}
		<div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onclick={cancelDelete}>
			<div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-sm w-full" onclick={(event) => event.stopPropagation()}>
				<p class="mb-4 text-lg font-bold text-center text-slate-800 dark:text-white">本当にこのカテゴリを削除しますか？</p>
				<p class="text-center text-sm text-slate-600 dark:text-slate-400 mb-6">このカテゴリに属するサイトは「カテゴリなし」になります。</p>
				<div class="flex justify-center gap-4">
					<button onclick={removeCategoryHandler} class="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition w-full disabled:opacity-50" disabled={categoryState.isProcessing}>削除する</button>
					<button onclick={cancelDelete} class="px-5 py-2 rounded-lg bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 dark:bg-gray-600 dark:text-white transition w-full">キャンセル</button>
				</div>
			</div>
		</div>
	{/if}
</div>
