<script lang="ts">
import SiteCard from "$lib/components/SiteCard.svelte";
import { sites as sitesStore, addSite } from "$lib/stores/siteStore";
import {
	categories as categoriesStore,
	addCategory,
} from "$lib/stores/categoryStore";
import type { Article, Site } from "$lib/types";
import {
	Plus,
	Search,
	LoaderCircle,
	AlertTriangle,
	ChevronDown,
	ChevronUp,
} from "@lucide/svelte";
import dayjs from "dayjs";
import { getDomain } from "$lib/utils";

// --- Stores ---
const sites = $derived($sitesStore);
const categories = $derived($categoriesStore);

// --- Page State ---
let searchTerm = $state("");
let showAddSiteForm = $state(false);

// --- Add Site Form State ---
let addSiteState = $state({
	inputUrl: "",
	inputRssUrl: "",
	inputCategory: "",
	error: "",
	isProcessing: false,
	successMsg: "",
	previewSite: null as Omit<Site, "id"> | null,
	previewArticles: null as Article[] | null,
});

// --- Category Modal State ---
let categoryModalState = $state({
	show: false,
	newId: "",
	newLabel: "",
	error: "",
	isProcessing: false,
});

// --- Derived State for Displaying Sites ---
const filteredAndGroupedSites = $derived(() => {
	const groups: Record<string, Site[]> = {};
	if (!sites) return groups;

	// Filter by search term first
	const filtered = !searchTerm
		? sites
		: sites.filter(
				(site) =>
					(site.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
					(site.url || "").toLowerCase().includes(searchTerm.toLowerCase()),
			);

	// Then, group by category
	for (const site of filtered) {
		const catId = site.category || "other";
		if (!groups[catId]) groups[catId] = [];
		groups[catId].push(site);
	}
	return groups;
});

// --- Functions ---

function toggleCategoryVisibility(categoryId: string) {
	categoriesStore.update((cats) =>
		cats.map((cat) =>
			cat.id === categoryId ? { ...cat, visible: !cat.visible } : cat,
		),
	);
}

function resetAddSiteState() {
	addSiteState = {
		inputUrl: "",
		inputRssUrl: "",
		inputCategory: "",
		error: "",
		isProcessing: false,
		successMsg: "",
		previewSite: null,
		previewArticles: null,
	};
}

function toggleAddSiteForm() {
	showAddSiteForm = !showAddSiteForm;
	// フォームを閉じるときに内容をリセット
	if (!showAddSiteForm) {
		resetAddSiteState();
	}
}

async function fetchSiteInfo() {
	addSiteState.error = "";
	addSiteState.previewSite = null;
	addSiteState.successMsg = "";
	if (
		!addSiteState.inputUrl ||
		!addSiteState.inputRssUrl ||
		!addSiteState.inputCategory
	) {
		addSiteState.error =
			"サイトURL, RSSフィードURL, カテゴリを全て入力してください";
		return;
	}
	const domain = getDomain(addSiteState.inputUrl);
	if (sites.find((s) => getDomain(s.url) === domain)) {
		addSiteState.error = "このサイトは既に登録済みです";
		return;
	}
	addSiteState.isProcessing = true;
	try {
		const res = await fetch("/api/site", {
			method: "POST",
			body: JSON.stringify({
				action: "fetch-site-info",
				url: addSiteState.inputUrl,
				rssUrl: addSiteState.inputRssUrl,
				category: addSiteState.inputCategory,
			}),
		});
		const resData = await res.json();
		if (!res.ok || resData.error)
			throw new Error(resData.error || "情報の取得に失敗しました");
		addSiteState.previewSite = resData.site;
		addSiteState.previewArticles = resData.articles;
	} catch (e) {
		addSiteState.error = e instanceof Error ? e.message : String(e);
	} finally {
		addSiteState.isProcessing = false;
	}
}

async function registerSite() {
	if (!addSiteState.previewSite) return;
	addSiteState.isProcessing = true;
	try {
		const payload = {
			site: {
				...addSiteState.previewSite,
				category: addSiteState.inputCategory,
			},
			articles: addSiteState.previewArticles,
		};
		const res = await fetch("/api/site", {
			method: "POST",
			body: JSON.stringify(payload),
		});
		const resData = await res.json();
		if (!res.ok || !resData.site)
			throw new Error(resData?.error || "不明なエラー");
		addSite(resData.site);
		addSiteState.successMsg = `サイト「${resData.site.title}」を追加しました`;
		resetAddSiteState();
		// 成功したらフォームを閉じる
		setTimeout(() => {
			showAddSiteForm = false;
		}, 2000);
	} catch (e) {
		addSiteState.error = `サイトの追加に失敗しました: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		addSiteState.isProcessing = false;
	}
}

function openCategoryModal() {
	categoryModalState.show = true;
	categoryModalState.newId = "";
	categoryModalState.newLabel = "";
	categoryModalState.error = "";
	categoryModalState.isProcessing = false;
}

async function addCategoryFromModal() {
	const { newId, newLabel } = categoryModalState;
	if (!newId.trim() || !newLabel.trim()) {
		categoryModalState.error = "IDとラベルの両方を入力してください。";
		return;
	}
	categoryModalState.isProcessing = true;
	categoryModalState.error = "";
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
		// 新規サイト追加フォームのカテゴリに自動で設定
		addSiteState.inputCategory = resData.category.id;
		categoryModalState.show = false;
	} catch (e) {
		categoryModalState.error = e instanceof Error ? e.message : String(e);
	} finally {
		categoryModalState.isProcessing = false;
	}
}
</script>

<!-- Header Section with Filters and Add Button -->
<div
	class="border-b border-slate-200 bg-slate-50/80 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80"
>
	<!-- Category Filters -->
	<div class="flex flex-wrap gap-2">
		{#each categories as cat}
			<button
				onclick={() => toggleCategoryVisibility(cat.id)}
				class="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-150 {cat.visible
					? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-900'
					: 'bg-slate-200 text-slate-700 opacity-70 hover:opacity-100 dark:bg-slate-700 dark:text-slate-200'}"
			>
				{cat.label}
			</button>
		{/each}
	</div>

	<!-- Search and Add Site Section -->
	<div class="mt-4 flex flex-col sm:flex-row items-center gap-4">
		<div class="relative w-full flex-grow">
			<input
				type="search"
				bind:value={searchTerm}
				placeholder="サイト名やURLで検索..."
				class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pl-10 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
			/>
			<div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
				<Search class="h-5 w-5" />
			</div>
		</div>
		<button
			onclick={toggleAddSiteForm}
			class="flex w-full sm:w-auto flex-shrink-0 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
		>
			{#if showAddSiteForm}
				<ChevronUp class="h-5 w-5" />
				<span>フォームを閉じる</span>
			{:else}
				<Plus class="h-5 w-5" />
				<span>新規サイトを追加</span>
			{/if}
		</button>
	</div>
</div>

{#if showAddSiteForm}
	<div class="p-4">
		<div class="mx-auto max-w-xl rounded-xl bg-slate-100 p-4 shadow-md dark:bg-slate-800">
			<h3 class="mb-3 text-lg font-semibold text-slate-800 dark:text-white">新規サイト追加</h3>
			{#if addSiteState.successMsg}
				<div class="mb-2 rounded-lg bg-emerald-500/20 p-3 text-center text-emerald-500">
					{addSiteState.successMsg}
				</div>
			{/if}
			{#if !addSiteState.previewSite}
				<div class="flex flex-col gap-3">
					<input
						class="rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:ring-emerald-400 dark:border-slate-600 dark:bg-slate-700"
						type="url"
						placeholder="サイトURL (例: https://example.com)"
						bind:value={addSiteState.inputUrl}
						autocomplete="off"
					/>
					<input
						class="rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:ring-emerald-400 dark:border-slate-600 dark:bg-slate-700"
						type="url"
						placeholder="RSSフィードURL (例: https://example.com/rss)"
						bind:value={addSiteState.inputRssUrl}
						autocomplete="off"
					/>
					<div class="flex items-center gap-2">
						<select
							class="flex-1 rounded-lg border bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
							bind:value={addSiteState.inputCategory}
						>
							<option value="">カテゴリ選択</option>
							{#each categories as cat}
								<option value={cat.id}>{cat.label}</option>
							{/each}
						</select>
						<button
							onclick={openCategoryModal}
							type="button"
							class="rounded-lg bg-emerald-500 p-2 text-white transition hover:bg-emerald-600"
							title="新規カテゴリ追加"><Plus class="h-5 w-5" /></button
						>
					</div>
					{#if addSiteState.error}
						<div class="mt-1 text-sm text-red-500">{addSiteState.error}</div>
					{/if}
					<button
						class="mt-1 flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
						type="button"
						onclick={fetchSiteInfo}
						disabled={addSiteState.isProcessing}
					>
						{#if addSiteState.isProcessing}
							<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
						{:else}<Search class="mr-2 h-4 w-4" />
						{/if}
						<span>{#if addSiteState.isProcessing}確認中...{:else}サイト情報を確認{/if}</span>
					</button>
				</div>
			{:else}
				<!-- Preview Section -->
				<div class="space-y-4">
					<div class="rounded-lg bg-slate-200 p-3 text-sm dark:bg-slate-700">
						<div><span class="font-semibold">サイト名:</span> {addSiteState.previewSite.title}</div>
						<div><span class="font-semibold">URL:</span> {addSiteState.previewSite.url}</div>
						<div><span class="font-semibold">RSS:</span> {addSiteState.previewSite.rss}</div>
						<div>
							<span class="font-semibold">カテゴリ:</span>
							{categories.find((c) => c.id === addSiteState.inputCategory)?.label}
						</div>
					</div>
					{#if addSiteState.previewArticles && addSiteState.previewArticles.length > 0}
						<div>
							<h4 class="mb-2 text-base font-semibold text-slate-800 dark:text-white">
								最新記事プレビュー (3件)
							</h4>
							<ul class="space-y-2">
								{#each addSiteState.previewArticles.slice(0, 3) as article}
									<li class="rounded-lg bg-slate-200 p-2 text-sm dark:bg-slate-700">
										<a
											href={article.url}
											target="_blank"
											rel="noopener noreferrer"
											class="block truncate font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
											title={article.title}>{article.title}</a
										>
										<span class="text-xs text-slate-500 dark:text-slate-400"
											>{dayjs(article.pub_date).format('YYYY/MM/DD HH:mm')}</span
										>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
					<div class="flex gap-2">
						<button
							class="flex-1 rounded-lg bg-gray-400 px-4 py-2 font-semibold text-white hover:bg-gray-500"
							type="button"
							onclick={resetAddSiteState}>やり直す</button
						>
						<button
							class="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
							type="button"
							onclick={registerSite}
							disabled={addSiteState.isProcessing}>このサイトを登録</button
						>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Category Modal (for adding new categories) -->
{#if categoryModalState.show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		role="dialog"
		aria-modal="true"
		onclick={() => (categoryModalState.show = false)}
	>
		<div
			class="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="mb-4 text-lg font-bold text-slate-800 dark:text-white">新規カテゴリ追加</h3>
			{#if categoryModalState.error}
				<div class="mb-2 rounded bg-red-500/20 p-2 text-sm text-red-500">
					{categoryModalState.error}
				</div>
			{/if}
			<div class="flex flex-col gap-3">
				<input
					type="text"
					placeholder="カテゴリID (例: news)"
					bind:value={categoryModalState.newId}
					class="rounded-lg border bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
					disabled={categoryModalState.isProcessing}
				/>
				<input
					type="text"
					placeholder="カテゴリ名 (例: まとめNEWS)"
					bind:value={categoryModalState.newLabel}
					class="rounded-lg border bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
					disabled={categoryModalState.isProcessing}
					onkeydown={(e) => e.key === 'Enter' && addCategoryFromModal()}
				/>
			</div>
			<div class="mt-4 flex gap-2">
				<button
					onclick={addCategoryFromModal}
					disabled={categoryModalState.isProcessing}
					class="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
					>追加</button
				>
				<button
					onclick={() => (categoryModalState.show = false)}
					class="flex-1 rounded-lg bg-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-white"
					>キャンセル</button
				>
			</div>
		</div>
	</div>
{/if}

<!-- Main Content: Site List -->
<div class="p-4">
	{#each (categories || []).filter((cat) => cat.visible) as cat}
		{@const sitesForCategory = filteredAndGroupedSites()[cat.id]}
		{#if sitesForCategory?.length > 0}
			<div class="mb-8">
				<div class="mb-3 flex items-center gap-2">
					<span class="text-xl font-bold text-emerald-700 dark:text-emerald-300">{cat.label}</span>
					<span class="text-sm text-slate-500 dark:text-slate-400"
						>({sitesForCategory.length})</span
					>
				</div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each sitesForCategory as site (site.id)}
						<SiteCard {site} />
					{/each}
				</div>
			</div>
		{/if}
	{/each}

	{#if sites.length === 0}
		<div class="py-16 text-center text-slate-500 dark:text-slate-400">
			<p>サイトがまだ登録されていません。</p>
			<p>上の「新規サイトを追加」ボタンから最初のサイトを登録しましょう。</p>
		</div>
	{/if}
</div>
