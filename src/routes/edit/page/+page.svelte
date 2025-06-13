<script lang="ts">
import { Pen, Plus, Search } from "@lucide/svelte";
import {
	sites as sitesStore,
	addSite,
	updateSite,
} from "$lib/stores/siteStore";
import {
	categories as categoriesStore,
	addCategory,
} from "$lib/stores/categoryStore";
import type { ArticleWithSiteName, Site, Category } from "$lib/types";
import { getDomain } from "$lib/utils";
import dayjs from "dayjs";

// --- State ---
const sites = $derived($sitesStore);
const categories = $derived($categoriesStore);

let searchTerm = $state("");

let editState = $state<{
	id: number | null;
	title: string;
	url: string;
	rss: string;
	category: string;
}>({ id: null, title: "", url: "", rss: "", category: "" });

let addSiteState = $state({
	inputUrl: "",
	inputCategory: "",
	fetchError: "",
	isFetching: false,
	addSuccessMsg: "",
	loadSite: null as Site | null,
	fetchedArticles: null as ArticleWithSiteName[] | null,
});

// 簡易カテゴリ追加モーダル用の状態
let categoryModalState = $state({
	show: false,
	newId: "",
	newLabel: "",
	error: "",
	isProcessing: false,
});

// --- Derived State ---
const filteredSites = $derived(() => {
	if (!searchTerm) return sites;
	const lower = searchTerm.toLowerCase();
	return sites.filter(
		(s) =>
			s.title?.toLowerCase().includes(lower) ||
			s.url?.toLowerCase().includes(lower) ||
			s.rss?.toLowerCase().includes(lower) ||
			s.category?.toLowerCase().includes(lower),
	);
});

// --- Functions ---

async function fetchSite() {
	addSiteState.fetchError = "";
	addSiteState.loadSite = null;
	addSiteState.addSuccessMsg = "";
	if (!addSiteState.inputUrl || !addSiteState.inputCategory) {
		addSiteState.fetchError = "URLとカテゴリを入力してください";
		return;
	}
	const domain = getDomain(addSiteState.inputUrl);
	if (sites.find((s) => getDomain(s.url) === domain)) {
		addSiteState.fetchError = "このサイトはすでに登録済みです";
		return;
	}
	addSiteState.isFetching = true;
	try {
		const res = await fetch("/api/site", {
			method: "POST",
			body: JSON.stringify({
				action: "fetch-site-info",
				url: addSiteState.inputUrl,
				category: addSiteState.inputCategory,
			}),
		});
		const resData = await res.json();
		if (!res.ok || resData.error) throw new Error(resData.error || "取得失敗");
		addSiteState.loadSite = resData.site;
		addSiteState.fetchedArticles = resData.articles;
	} catch (e) {
		addSiteState.fetchError = e instanceof Error ? e.message : String(e);
	} finally {
		addSiteState.isFetching = false;
	}
}

function clearFetched() {
	addSiteState.loadSite = null;
	addSiteState.fetchedArticles = null;
	addSiteState.inputUrl = "";
	addSiteState.inputCategory = "";
	addSiteState.fetchError = "";
}

async function registerSite() {
	if (!addSiteState.loadSite) return;
	try {
		const { id, ...sitePayload } = addSiteState.loadSite;
		const res = await fetch("/api/site", {
			method: "POST",
			body: JSON.stringify(sitePayload),
		});
		const resData = await res.json();
		if (!res.ok || !resData.site)
			throw new Error(resData?.error || "不明なエラー");

		addSite(resData.site);
		addSiteState.addSuccessMsg = "サイトを追加しました";
		clearFetched();
	} catch (e) {
		addSiteState.addSuccessMsg = `サイトの追加に失敗しました: ${e instanceof Error ? e.message : String(e)}`;
	}
}

function startEdit(site: Site) {
	editState = {
		id: site.id,
		title: site.title,
		url: site.url,
		rss: site.rss,
		category: site.category,
	};
}

function cancelEdit() {
	editState.id = null;
}

async function commitEdit() {
	const id = editState.id;
	if (id === null) return;

	const originalSite = sites.find((s) => s.id === id);
	if (!originalSite) return;

	const payload: Site = {
		...originalSite,
		title: editState.title,
		url: editState.url,
		rss: editState.rss,
		category: editState.category,
		domain: getDomain(editState.url),
	};

	try {
		const res = await fetch("/api/site", {
			method: "PATCH",
			body: JSON.stringify(payload),
		});
		const resData = await res.json();
		if (!res.ok) throw new Error(resData?.error || "更新失敗");

		updateSite(resData.site);
		cancelEdit();
	} catch (e) {
		console.error("Update failed", e);
		alert(e instanceof Error ? e.message : String(e));
	}
}

function openCategoryModal() {
	categoryModalState.error = "";
	categoryModalState.newId = "";
	categoryModalState.newLabel = "";
	categoryModalState.show = true;
}

async function addCategoryFromModal() {
	const id = categoryModalState.newId.trim();
	const label = categoryModalState.newLabel.trim();
	if (!id || !label) {
		categoryModalState.error = "IDとラベルの両方を入力してください。";
		return;
	}

	categoryModalState.isProcessing = true;
	categoryModalState.error = "";
	try {
		const res = await fetch("/api/category", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, label }),
		});
		const resData = await res.json();
		if (!res.ok)
			throw new Error(resData.error || "カテゴリの追加に失敗しました。");

		addCategory(resData.category);
		if (editState.id !== null) {
			// サイト編集中なら、編集中のカテゴリを今追加したものに設定
			editState.category = resData.category.id;
		} else {
			// 新規サイト追加中なら、そちらのカテゴリを設定
			addSiteState.inputCategory = resData.category.id;
		}
		categoryModalState.show = false;
	} catch (e) {
		categoryModalState.error = e instanceof Error ? e.message : String(e);
	} finally {
		categoryModalState.isProcessing = false;
	}
}
</script>

<div class="max-w-xl mx-auto p-4">
	<h2 class="text-2xl font-bold mb-6 text-center text-slate-800 dark:text-white">サイトの追加と編集</h2>
	
	<!-- 新規サイト追加フォーム -->
	<div class="mb-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl shadow">
		<h3 class="text-lg font-semibold mb-3 text-slate-800 dark:text-white">新規サイト追加</h3>
		{#if addSiteState.addSuccessMsg}
			<div class="mb-2 p-3 rounded-lg bg-emerald-500/20 text-emerald-500 text-center">{addSiteState.addSuccessMsg}</div>
		{/if}
		{#if !addSiteState.loadSite}
			<div class="flex flex-col gap-3">
				<input class="px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400" type="text" placeholder="サイトURL" bind:value={addSiteState.inputUrl} autocomplete="off" />
				<div class="flex items-center gap-2">
					<select class="flex-1 px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400" bind:value={addSiteState.inputCategory}>
						<option value="">カテゴリ選択</option>
						{#each categories as cat}
							<option value={cat.id}>{cat.label}</option>
						{/each}
					</select>
					<button onclick={openCategoryModal} type="button" class="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition" title="新規カテゴリ追加">
						<Plus class="w-5 h-5" />
					</button>
				</div>
				{#if addSiteState.fetchError}
					<div class="text-red-500 text-sm mt-1">{addSiteState.fetchError}</div>
				{/if}
				<button class="mt-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 flex items-center justify-center transition" type="button" onclick={fetchSite} disabled={addSiteState.isFetching}>
					<Search class="w-4 h-4 mr-2" />
					{#if addSiteState.isFetching}
						<span>検索中...</span>
					{:else}
						<span>RSS情報を検索</span>
					{/if}
				</button>
			</div>
		{:else}
			<div class="bg-slate-200 dark:bg-slate-700 rounded-lg p-3 mb-3 space-y-1">
				<div><span class="font-semibold">サイト名:</span> {addSiteState.loadSite.title}</div>
				<div><span class="font-semibold">URL:</span> {addSiteState.loadSite.url}</div>
				<div><span class="font-semibold">RSS:</span> {addSiteState.loadSite.rss}</div>
				<div><span class="font-semibold">カテゴリ:</span> {addSiteState.loadSite.category}</div>
			</div>
			{#if addSiteState.fetchedArticles && addSiteState.fetchedArticles.length > 0}
				<div class="mt-4">
					<h4 class="font-semibold text-base mb-2 text-slate-800 dark:text-white">最新記事プレビュー (3件)</h4>
					<ul class="space-y-2">
						{#each addSiteState.fetchedArticles.slice(0, 3) as article}
							<li class="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm">
								<a href={article.url} target="_blank" rel="noopener noreferrer" class="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline block truncate" title={article.title}>
									{article.title}
								</a>
								<span class="text-xs text-slate-500 dark:text-slate-400">
									{dayjs(article.pub_date).format('YYYY/MM/DD HH:mm')}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			<div class="flex gap-2 mt-4">
				<button class="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold flex-1" type="button" onclick={registerSite}>このサイトを登録</button>
				<button class="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500 font-semibold flex-1" type="button" onclick={clearFetched}>キャンセル</button>
			</div>
		{/if}
	</div>

	<!-- 新規カテゴリ追加モーダル -->
	{#if categoryModalState.show}
		<div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onclick={() => categoryModalState.show = false}>
			<div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-sm w-full" onclick={(e) => e.stopPropagation()}>
				<h3 class="text-lg font-bold mb-4 text-slate-800 dark:text-white">新規カテゴリ追加</h3>
				{#if categoryModalState.error}
					<div class="mb-2 p-2 text-sm rounded bg-red-500/20 text-red-500">{categoryModalState.error}</div>
				{/if}
				<div class="flex flex-col gap-3">
					<input type="text" placeholder="カテゴリID (例: news)" bind:value={categoryModalState.newId} class="rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" disabled={categoryModalState.isProcessing} />
					<input type="text" placeholder="カテゴリ名 (例: まとめNEWS)" bind:value={categoryModalState.newLabel} class="rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" disabled={categoryModalState.isProcessing} />
				</div>
				<div class="flex gap-2 mt-4">
					<button onclick={addCategoryFromModal} disabled={categoryModalState.isProcessing} class="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">追加</button>
					<button onclick={() => categoryModalState.show = false} class="flex-1 px-4 py-2 rounded-lg bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 dark:bg-gray-600 dark:text-white">キャンセル</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- 登録済みサイト一覧 -->
	<div class="mt-8">
		<h2 class="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-white">登録済みサイト一覧・編集</h2>
		<div class="relative mb-4">
			<input type="search" bind:value={searchTerm} class="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 pl-10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" placeholder="サイト名、URL、カテゴリで検索" />
			<div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search class="w-5 h-5"/></div>
			{#if searchTerm}
				<button class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" onclick={() => searchTerm = ""}>×</button>
			{/if}
		</div>
		<div class="mt-4 space-y-3">
			{#if filteredSites().length === 0}
				<div class="text-center text-slate-500 dark:text-slate-300 py-8">該当するサイトがありません。</div>
			{:else}
				{#each filteredSites() as site (site.id)}
					<div class="rounded-xl bg-slate-100 dark:bg-slate-800 shadow p-4 relative">
						{#if editState.id === site.id}
							<!-- 編集フォーム -->
							<div class="flex flex-col gap-2">
								<input type="text" bind:value={editState.title} class="block w-full rounded-lg border-emerald-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border" placeholder="サイト名" />
								<div class="flex items-center gap-2">
									<select bind:value={editState.category} class="flex-1 block w-full rounded-lg border-emerald-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border">
										<option value="">カテゴリ選択</option>
										{#each categories as cat}
											<option value={cat.id}>{cat.label}</option>
										{/each}
									</select>
									<button onclick={openCategoryModal} type="button" class="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition" title="新規カテゴリ追加">
										<Plus class="w-5 h-5" />
									</button>
								</div>
								<input type="text" bind:value={editState.url} class="block w-full rounded-lg border-emerald-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border" placeholder="URL" />
								<input type="text" bind:value={editState.rss} class="block w-full rounded-lg border-emerald-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border" placeholder="RSS" />
								<div class="flex gap-3 mt-2">
									<button onclick={commitEdit} class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex-1 font-semibold">保存</button>
									<button onclick={cancelEdit} class="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-white flex-1 font-semibold">キャンセル</button>
								</div>
							</div>
						{:else}
							<!-- 表示モード -->
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1 flex-wrap">
										<div class="font-bold text-lg text-slate-900 dark:text-white truncate" title={site.title}>{site.title}</div>
										{#if site.category}
											{@const categoryLabel = categories.find(c => c.id === site.category)?.label || site.category}
											<span class="inline-block bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold align-middle whitespace-nowrap">
												{categoryLabel}
											</span>
										{/if}
									</div>
									<div class="text-sm mb-1 text-slate-600 dark:text-slate-300 break-all">{site.url}</div>
									{#if site.rss}
										<div class="text-xs text-slate-500 dark:text-slate-400 break-all">{site.rss}</div>
									{/if}
								</div>
								<button class="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 ml-2 flex-shrink-0" title="編集" onclick={() => startEdit(site)}>
									<Pen class="w-5 h-5" />
								</button>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
