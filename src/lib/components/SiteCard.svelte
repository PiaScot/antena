<script lang="ts">
	import type { Site } from '$lib/types';
	import { categories as categoriesStore } from '$lib/stores/categoryStore';
	import { updateSite, removeSite } from '$lib/stores/siteStore';
	import {
		Pen,
		Save,
		Trash2,
		LoaderCircle,
		AlertTriangle
	} from '@lucide/svelte';

	// --- Props ---
	const { site } = $props<{ site: Site }>();

	// --- State ---
	let isEditing = $state(false);
	let form = $state({ ...site });
	let isProcessing = $state(false);
	let error = $state('');
	let showDeleteConfirm = $state(false);
	const categories = $derived($categoriesStore);
	const categoryLabel = $derived(
		categories.find((c) => c.id === site.category)?.label || site.category
	);

	// --- Functions ---
	function startEditing() {
		form = { ...site };
		error = '';
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
	}

	async function handleSave() {
		isProcessing = true;
		error = '';
		try {
			const res = await fetch('/api/site', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			const resData = await res.json();
			if (!res.ok) {
				throw new Error(resData?.error || 'サイト情報の更新に失敗しました。');
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
		error = '';
		try {
			// APIに削除リクエストを送信
			const res = await fetch(`/api/site?id=${site.id}`, { method: 'DELETE' });
			if (!res.ok) {
				const resData = await res.json();
				throw new Error(resData?.error || 'サイトの削除に失敗しました。');
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
	class="rounded-lg border border-slate-300 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
>
	<div class="relative">
		<a
			href={`/feed?site=${site.id}`}
			class="block rounded-lg p-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-inset"
			aria-label="{site.title} の記事一覧へ"
		>
			<h2
				class="pr-8 text-base leading-tight font-bold break-all text-slate-900 dark:text-slate-100"
			>
				{site.title}
			</h2>
			<p
				class="text-xs leading-tight break-all text-slate-600 dark:text-slate-400"
			>
				{site.domain || 'No Domain'}
			</p>
			<div class="mt-1 flex items-center justify-between">
				<span
					class="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-800 dark:bg-blue-900 dark:text-blue-200"
					>{categoryLabel}</span
				>
				<span
					class="text-xs font-semibold text-emerald-600 select-none dark:text-emerald-400"
					>記事一覧へ</span
				>
			</div>
		</a>

		<button
			onclick={startEditing}
			class="absolute top-2 right-2 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
			title="このサイトを編集する"
		>
			<Pen class="h-4 w-4" />
		</button>
	</div>

	{#if isEditing}
		<div class="border-t border-slate-200 p-4 dark:border-slate-700">
			<div class="flex flex-col gap-3">
				<div>
					<label
						class="text-sm font-medium text-slate-600 dark:text-slate-300"
						for="title-{site.id}">サイト名</label
					>
					<input
						id="title-{site.id}"
						type="text"
						bind:value={form.title}
						class="mt-1 w-full rounded-md border-slate-300 bg-white px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700"
					/>
				</div>
				<div>
					<label
						class="text-sm font-medium text-slate-600 dark:text-slate-300"
						for="url-{site.id}">URL</label
					>
					<input
						id="url-{site.id}"
						type="url"
						bind:value={form.url}
						class="mt-1 w-full rounded-md border-slate-300 bg-white px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700"
					/>
				</div>
				<div>
					<label
						class="text-sm font-medium text-slate-600 dark:text-slate-300"
						for="rss-{site.id}">RSS</label
					>
					<input
						id="rss-{site.id}"
						type="url"
						bind:value={form.rss}
						class="mt-1 w-full rounded-md border-slate-300 bg-white px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700"
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
						class="mt-1 w-full rounded-md border-slate-300 bg-white px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700"
					>
						{#each categories as cat (cat.id)}
							<option value={cat.id}>{cat.label}</option>
						{/each}
					</select>
				</div>

				{#if error}
					<p class="mt-1 text-sm text-red-500">{error}</p>
				{/if}
			</div>

			<div class="mt-4 flex items-center gap-2">
				<button
					onclick={() => (showDeleteConfirm = true)}
					class="rounded-md bg-red-600 p-2 text-white hover:bg-red-700 disabled:opacity-50"
					disabled={isProcessing}
					title="削除"><Trash2 class="h-4 w-4" /></button
				>
				<div class="flex-grow"></div>
				<button
					onclick={cancelEditing}
					class="rounded-md bg-slate-200 px-4 py-2 text-slate-800 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
					disabled={isProcessing}>キャンセル</button
				>
				<button
					onclick={handleSave}
					class="flex min-w-[80px] items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
					disabled={isProcessing}
				>
					{#if isProcessing}
						<LoaderCircle class="h-4 w-4 animate-spin" />
					{:else}
						<Save class="mr-2 h-4 w-4" />
						保存
					{/if}
				</button>
			</div>
		</div>
	{/if}

	{#if showDeleteConfirm}
		<div
			class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 p-4 dark:bg-slate-900/80"
			onclick={() => (showDeleteConfirm = false)}
			onkeydown={(e) => e.key === 'Escape' && (showDeleteConfirm = false)}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div
				class="max-w-sm rounded-lg border bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800"
				role="document"
				tabindex="-1"
			>
				<div class="mb-4 flex justify-center">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50"
					>
						<AlertTriangle class="h-8 w-8 text-red-600 dark:text-red-400" />
					</div>
				</div>
				<p
					class="mb-2 text-center text-lg font-bold text-slate-800 dark:text-white"
				>
					サイトを削除しますか？
				</p>
				<p class="mb-6 text-center text-sm text-slate-600 dark:text-slate-400">
					「{site.title}」を削除すると元に戻せません。
				</p>
				<div class="flex justify-center gap-4">
					<button
						onclick={handleDelete}
						class="flex w-full justify-center rounded-lg bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
						disabled={isProcessing}
					>
						{#if isProcessing}<LoaderCircle
								class="h-5 w-5 animate-spin"
							/>{:else}削除する{/if}
					</button>
					<button
						onclick={() => (showDeleteConfirm = false)}
						class="w-full rounded-lg bg-gray-300 px-5 py-2 font-semibold text-gray-700 transition hover:bg-gray-400 dark:bg-gray-600 dark:text-white"
						disabled={isProcessing}>キャンセル</button
					>
				</div>
			</div>
		</div>
	{/if}
</div>
