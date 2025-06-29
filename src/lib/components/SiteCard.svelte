<script lang="ts">
import type { Site, Category } from "$lib/types";
import { categories as categoriesStore } from "$lib/stores/categoryStore";
import { updateSite, removeSite } from "$lib/stores/siteStore";
import { Pen, Save, Trash2, LoaderCircle, AlertTriangle } from "@lucide/svelte";

// --- Props ---
const { site } = $props<{ site: Site }>();

// --- State ---
let isEditing = $state(false);
let form = $state({ ...site });
let isProcessing = $state(false);
let error = $state("");
let showDeleteConfirm = $state(false);
const categories = $derived($categoriesStore);
const categoryLabel = $derived(
	categories.find((c) => c.id === site.category)?.label || site.category,
);

// --- Functions ---
function startEditing() {
	form = { ...site };
	error = "";
	isEditing = true;
}

function cancelEditing() {
	isEditing = false;
}

async function handleSave() {
	isProcessing = true;
	error = "";
	try {
		const res = await fetch("/api/site", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(form),
		});
		const resData = await res.json();
		if (!res.ok) {
			throw new Error(resData?.error || "サイト情報の更新に失敗しました。");
		}
		// ストアを更新
		updateSite(resData.site);
		// 編集フォームを閉じる
		isEditing = false;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	} finally {
		isProcessing = false;
	}
}

async function handleDelete() {
	isProcessing = true;
	error = "";
	try {
		// APIに削除リクエストを送信
		const res = await fetch(`/api/site?id=${site.id}`, { method: "DELETE" });
		if (!res.ok) {
			const resData = await res.json();
			throw new Error(resData?.error || "サイトの削除に失敗しました。");
		}
		// ストアから削除
		// 削除が成功するとこのコンポーネント自体がリストから消える
		removeSite(site.id);
	} catch (e) {
		// エラーが発生した場合、確認ダイアログを閉じてフォームにエラーを表示
		showDeleteConfirm = false;
		error = e instanceof Error ? e.message : String(e);
	} finally {
		isProcessing = false;
	}
}
</script>

<div
	class="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-shadow hover:shadow-md"
>
	<div class="relative">
		<a
			href={`/feed?site=${site.id}`}
			class="block p-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-inset rounded-lg"
			aria-label="{site.title} の記事一覧へ"
		>
			<h2 class="text-base font-bold text-slate-900 dark:text-slate-100 break-all leading-tight pr-8">
				{site.title}
			</h2>
			<p class="text-xs text-slate-600 dark:text-slate-400 break-all leading-tight">
				{site.domain || 'No Domain'}
			</p>
			<div class="flex items-center justify-between mt-1">
				<span
					class="rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-[11px] text-blue-800 dark:text-blue-200"
					>{categoryLabel}</span
				>
				<span class="text-emerald-600 dark:text-emerald-400 text-xs font-semibold select-none"
					>記事一覧へ</span
				>
			</div>
		</a>

		<button
			onclick={startEditing}
			class="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
			title="このサイトを編集する"
		>
			<Pen class="w-4 h-4" />
		</button>
	</div>

	{#if isEditing}
		<div class="p-4 border-t border-slate-200 dark:border-slate-700">
			<div class="flex flex-col gap-3">
				<div>
					<label class="text-sm font-medium text-slate-600 dark:text-slate-300" for="title-{site.id}"
						>サイト名</label
					>
					<input
						id="title-{site.id}"
						type="text"
						bind:value={form.title}
						class="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
					/>
				</div>
				<div>
					<label class="text-sm font-medium text-slate-600 dark:text-slate-300" for="url-{site.id}"
						>URL</label
					>
					<input
						id="url-{site.id}"
						type="url"
						bind:value={form.url}
						class="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
					/>
				</div>
				<div>
					<label class="text-sm font-medium text-slate-600 dark:text-slate-300" for="rss-{site.id}"
						>RSS</label
					>
					<input
						id="rss-{site.id}"
						type="url"
						bind:value={form.rss}
						class="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
					/>
				</div>
				<div>
					<label
						class="text-sm font-medium text-slate-600 dark:text-slate-300"
						for="category-{site.id}">カテゴリ</label
					>
					<select
						id="category-{site.id}"
						bind:value={form.category}
						class="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
					>
						{#each categories as cat (cat.id)}
							<option value={cat.id}>{cat.label}</option>
						{/each}
					</select>
				</div>

				{#if error}
					<p class="text-sm text-red-500 mt-1">{error}</p>
				{/if}
			</div>

			<div class="flex items-center gap-2 mt-4">
				<button
					onclick={() => (showDeleteConfirm = true)}
					class="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
					disabled={isProcessing}
					title="削除"><Trash2 class="w-4 h-4" /></button
				>
				<div class="flex-grow"></div>
				<button
					onclick={cancelEditing}
					class="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50"
					disabled={isProcessing}>キャンセル</button
				>
				<button
					onclick={handleSave}
					class="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center min-w-[80px]"
					disabled={isProcessing}
				>
					{#if isProcessing}
						<LoaderCircle class="w-4 h-4 animate-spin" />
					{:else}
						<Save class="w-4 h-4 mr-2" />
						保存
					{/if}
				</button>
			</div>
		</div>
	{/if}

	{#if showDeleteConfirm}
		<div
			class="absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center p-4 rounded-lg"
			onclick={() => (showDeleteConfirm = false)}
			role="dialog"
			aria-modal="true"
		>
      <div
          class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 border dark:border-slate-700 max-w-sm"
          onclick={(event) => event.stopPropagation()}
      >
				<div class="flex justify-center mb-4">
					<div
						class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center"
					>
						<AlertTriangle class="w-8 h-8 text-red-600 dark:text-red-400" />
					</div>
				</div>
				<p class="mb-2 text-lg font-bold text-center text-slate-800 dark:text-white">
					サイトを削除しますか？
				</p>
				<p class="text-center text-sm text-slate-600 dark:text-slate-400 mb-6">
					「{site.title}」を削除すると元に戻せません。
				</p>
				<div class="flex justify-center gap-4">
					<button
						onclick={handleDelete}
						class="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition w-full disabled:opacity-50 flex justify-center"
						disabled={isProcessing}
					>
						{#if isProcessing}<LoaderCircle class="w-5 h-5 animate-spin" />{:else}削除する{/if}
					</button>
					<button
						onclick={() => (showDeleteConfirm = false)}
						class="px-5 py-2 rounded-lg bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 dark:bg-gray-600 dark:text-white transition w-full"
						disabled={isProcessing}>キャンセル</button
					>
				</div>
			</div>
		</div>
	{/if}
</div>
