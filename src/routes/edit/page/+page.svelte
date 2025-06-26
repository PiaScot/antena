<script lang="ts">
import {
	Pen,
	Plus,
	Search,
	LoaderCircle,
	Trash2,
	Save,
	AlertTriangle,
	ExternalLink,
	AppWindow,
} from "@lucide/svelte";
import {
	sites as sitesStore,
	addSite,
	updateSite,
	removeSite,
} from "$lib/stores/siteStore";
import {
	categories as categoriesStore,
	addCategory,
} from "$lib/stores/categoryStore";
import type { Article, Category, Site } from "$lib/types";
import { getDomain } from "$lib/utils";
import dayjs from "dayjs";

const sites = $derived($sitesStore);
const categories = $derived($categoriesStore);

let displayCategories = $state<Category[]>([]);
let searchTerm = $state("");

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

let editState = $state<{
	editingSiteId: number | null;
	form: Site;
	isProcessing: boolean;
	error: string;
}>({ editingSiteId: null, form: {} as Site, isProcessing: false, error: "" });

let deleteConfirmState = $state<{
	show: boolean;
	site: Site | null;
	isProcessing: boolean;
}>({ show: false, site: null, isProcessing: false });

let categoryModalState = $state({
	show: false,
	newId: "",
	newLabel: "",
	error: "",
	isProcessing: false,
});

const filteredSites = $derived(() => {
	if (!Array.isArray(sites)) {
		return [];
	}

	if (!searchTerm) {
		return sites;
	}

	const lower = searchTerm.toLowerCase();
	return sites.filter(
		(s) =>
			s &&
			(s.title?.toLowerCase().includes(lower) ||
				s.url?.toLowerCase().includes(lower) ||
				s.rss?.toLowerCase().includes(lower) ||
				s.category?.toLowerCase().includes(lower)),
	);
});

// --- Effects ---
$effect(() => {
	displayCategories = JSON.parse(JSON.stringify(categories));
});

// --- Functions for Adding a New Site ---
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

function clearFetched() {
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
		clearFetched();
	} catch (e) {
		addSiteState.error = `サイトの追加に失敗しました: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		addSiteState.isProcessing = false;
	}
}

function startEdit(site: Site) {
	editState.editingSiteId = site.id;
	editState.form = { ...site };
}

function cancelEdit() {
	editState.editingSiteId = null;
}

function toggleDisplayMode() {
	if (!editState.form.scrape_options) {
		editState.form.scrape_options = { removeSelectorTags: [] };
	}

	const currentMode = editState.form.scrape_options.display_mode;

	if (currentMode === "direct_link") {
		editState.form.scrape_options.display_mode = "in_app";
	} else {
		editState.form.scrape_options.display_mode = "direct_link";
	}
}

async function commitEdit() {
	if (editState.editingSiteId === null) return;
	const originalSite = sites.find((s) => s.id === editState.editingSiteId);
	if (!originalSite) return;
	const payload: Site = {
		...originalSite,
		...editState.form,
		domain: getDomain(editState.form.url),
	};
	editState.isProcessing = true;
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
		alert(e instanceof Error ? e.message : String(e));
	} finally {
		editState.isProcessing = false;
	}
}

// --- Functions for Deleting a Site ---
function confirmDelete(site: Site) {
	deleteConfirmState.site = site;
	deleteConfirmState.show = true;
}

function cancelDelete() {
	deleteConfirmState.site = null;
	deleteConfirmState.show = false;
}

async function executeDelete() {
	if (!deleteConfirmState.site) return;
	const idToDelete = deleteConfirmState.site.id;
	deleteConfirmState.isProcessing = true;
	try {
		const res = await fetch(`/api/site?id=${idToDelete}`, { method: "DELETE" });
		if (!res.ok) {
			const resData = await res.json();
			throw new Error(resData.error || "サイトの削除に失敗しました。");
		}
		removeSite(idToDelete);
		cancelDelete();
	} catch (e) {
		alert(e instanceof Error ? e.message : "削除中にエラーが発生しました。");
	} finally {
		deleteConfirmState.isProcessing = false;
	}
}

// --- Functions for Category Modal ---
function openCategoryModal() {
	categoryModalState = {
		show: true,
		newId: "",
		newLabel: "",
		error: "",
		isProcessing: false,
	};
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
		if (editState.editingSiteId !== null) {
			editState.form.category = resData.category.id;
		} else {
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

	<div class="mb-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl shadow">
		<h3 class="text-lg font-semibold mb-3 text-slate-800 dark:text-white">新規サイト追加</h3>
		{#if addSiteState.successMsg}
			<div class="mb-2 p-3 rounded-lg bg-emerald-500/20 text-emerald-500 text-center">{addSiteState.successMsg}</div>
		{/if}
		{#if !addSiteState.previewSite}
			<div class="flex flex-col gap-3">
				<input class="px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400" type="url" placeholder="サイトURL (例: https://example.com)" bind:value={addSiteState.inputUrl} autocomplete="off" />
				<input class="px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400" type="url" placeholder="RSSフィードURL (例: https://example.com/rss)" bind:value={addSiteState.inputRssUrl} autocomplete="off" />
				<div class="flex items-center gap-2">
					<select class="flex-1 px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400" bind:value={addSiteState.inputCategory}>
						<option value="">カテゴリ選択</option>
						{#each categories as cat} <option value={cat.id}>{cat.label}</option> {/each}
					</select>
					<button onclick={openCategoryModal} type="button" class="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition" title="新規カテゴリ追加"><Plus class="w-5 h-5" /></button>
				</div>
				{#if addSiteState.error} <div class="text-red-500 text-sm mt-1">{addSiteState.error}</div> {/if}
				<button class="mt-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 flex items-center justify-center transition disabled:opacity-50" type="button" onclick={fetchSiteInfo} disabled={addSiteState.isProcessing}>
					{#if addSiteState.isProcessing}<LoaderCircle class="w-4 h-4 mr-2 animate-spin"/>{:else}<Search class="w-4 h-4 mr-2" />{/if}
					<span>{#if addSiteState.isProcessing}確認中...{:else}サイト情報を確認{/if}</span>
				</button>
			</div>
		{:else}
			<div class="bg-slate-200 dark:bg-slate-700 rounded-lg p-3 mb-3 space-y-1">
				<div><span class="font-semibold">サイト名:</span> {addSiteState.previewSite.title}</div>
				<div><span class="font-semibold">URL:</span> {addSiteState.previewSite.url}</div>
				<div><span class="font-semibold">RSS:</span> {addSiteState.previewSite.rss}</div>
				<div><span class="font-semibold">カテゴリ:</span> {categories.find(c => c.id === addSiteState.inputCategory)?.label}</div>
			</div>
			{#if addSiteState.previewArticles && addSiteState.previewArticles.length > 0}
				<div class="mt-4">
					<h4 class="font-semibold text-base mb-2 text-slate-800 dark:text-white">最新記事プレビュー (3件)</h4>
					<ul class="space-y-2">
						{#each addSiteState.previewArticles.slice(0, 3) as article}
							<li class="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm">
								<a href={article.url} target="_blank" rel="noopener noreferrer" class="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline block truncate" title={article.title}>{article.title}</a>
								<span class="text-xs text-slate-500 dark:text-slate-400">{dayjs(article.pub_date).format('YYYY/MM/DD HH:mm')}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			<div class="flex gap-2 mt-4">
				<button class="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold flex-1 disabled:opacity-50" type="button" onclick={registerSite} disabled={addSiteState.isProcessing}>このサイトを登録</button>
				<button class="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500 font-semibold flex-1" type="button" onclick={clearFetched}>キャンセル</button>
			</div>
		{/if}
	</div>

	{#if categoryModalState.show}
		<div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" onclick={() => categoryModalState.show = false}>
			<div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-sm w-full" onclick={(e) => e.stopPropagation()}>
				<h3 class="text-lg font-bold mb-4 text-slate-800 dark:text-white">新規カテゴリ追加</h3>
				{#if categoryModalState.error}<div class="mb-2 p-2 text-sm rounded bg-red-500/20 text-red-500">{categoryModalState.error}</div>{/if}
				<div class="flex flex-col gap-3">
					<input type="text" placeholder="カテゴリID (例: news)" bind:value={categoryModalState.newId} class="rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" disabled={categoryModalState.isProcessing} />
					<input type="text" placeholder="カテゴリ名 (例: まとめNEWS)" bind:value={categoryModalState.newLabel} class="rounded-lg px-3 py-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" disabled={categoryModalState.isProcessing} onkeydown={(e) => e.key === 'Enter' && addCategoryFromModal()} />
				</div>
				<div class="flex gap-2 mt-4">
					<button onclick={addCategoryFromModal} disabled={categoryModalState.isProcessing} class="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">追加</button>
					<button onclick={() => categoryModalState.show = false} class="flex-1 px-4 py-2 rounded-lg bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 dark:bg-gray-600 dark:text-white">キャンセル</button>
				</div>
			</div>
		</div>
	{/if}

	<div class="mt-8">
		<h2 class="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-white">登録済みサイト一覧・編集</h2>
		<div class="relative mb-4">
			<input type="search" bind:value={searchTerm} class="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 pl-10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" placeholder="サイト名、URL、カテゴリで検索" />
			<div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search class="w-5 h-5"/></div>
			{#if searchTerm}<button class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" onclick={() => searchTerm = ""}>×</button>{/if}
		</div>
		<div class="mt-4 space-y-3">
			{#if filteredSites().length === 0}
				<div class="text-center text-slate-500 dark:text-slate-300 py-8">該当するサイトがありません。</div>
			{:else}
				{#each filteredSites() as siteData (siteData.id)}
					{@const site = siteData as Site}
					<div class="rounded-xl bg-slate-100 dark:bg-slate-800 shadow p-4">
						{#if editState.editingSiteId === site.id}
              {@const currentMode = editState.form.scrape_options?.display_mode ?? 'in_app'}
							<div class="flex flex-col gap-2">
								<input type="text" bind:value={editState.form.title} class="block w-full rounded-lg border-emerald-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border" placeholder="サイト名" />
								<div class="flex items-center gap-2">
									<select bind:value={editState.form.category} class="flex-1 block w-full rounded-lg border-emerald-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border">
										<option value="">カテゴリ選択</option>
										{#each categories as cat} <option value={cat.id}>{cat.label}</option> {/each}
									</select>
									<button onclick={openCategoryModal} type="button" class="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition" title="新規カテゴリ追加"><Plus class="w-5 h-5" /></button>
								</div>
								<input type="text" bind:value={editState.form.url} class="block w-full rounded-lg border-emerald-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border" placeholder="URL" />
								<input type="text" bind:value={editState.form.rss} class="block w-full rounded-lg border-emerald-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border" placeholder="RSS" />

                <div class="flex items-center justify-between gap-2 p-2 rounded-lg border border-emerald-400 bg-white dark:bg-slate-700">
                  <label class="font-medium text-sm text-slate-700 dark:text-slate-300">表示モード:</label>
                  <button onclick={toggleDisplayMode} type="button" class="flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold transition {currentMode === 'direct_link' ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-300' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200'}">
                    {#if currentMode === 'direct_link'}
                      <ExternalLink class="w-4 h-4" />
                      <span>外部リンク</span>
                    {:else}
                      <AppWindow class="w-4 h-4" />
                      <span>アプリ内表示</span>
                    {/if}
                  </button>
                </div>

								<div class="flex gap-3 mt-2">
									<button onclick={() => confirmDelete(site)} class="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 font-semibold" aria-label="削除"><Trash2 class="w-5 h-5"/></button>
									<button onclick={commitEdit} class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex-1 font-semibold flex items-center justify-center" disabled={editState.isProcessing}>
										{#if editState.isProcessing}<LoaderCircle class="w-5 h-5 animate-spin"/>{:else}<Save class="w-5 h-5 mr-2"/>{/if}
										保存
									</button>
									<button onclick={cancelEdit} class="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-white flex-1 font-semibold">キャンセル</button>
								</div>
							</div>
						{:else}
							<div class="flex items-center justify-between gap-2">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1 flex-wrap">
										<div class="font-bold text-lg text-slate-900 dark:text-white truncate" title={site.title}>{site.title}</div>
										{#if site.category}
											{@const categoryLabel = categories.find(c => c.id === site.category)?.label || site.category}
											<span class="inline-block bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold align-middle whitespace-nowrap">{categoryLabel}</span>
										{/if}
									</div>
									<div class="text-sm mb-1 text-slate-600 dark:text-slate-300 break-all truncate">{site.url}</div>
									{#if site.rss} <div class="text-xs text-slate-500 dark:text-slate-400 break-all truncate">{site.rss}</div> {/if}
								</div>
								<div class="flex items-center flex-shrink-0">
									<button class="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 ml-2" title="編集" onclick={() => startEdit(site)}>
										<Pen class="w-5 h-5" />
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>

	{#if deleteConfirmState.show}
		<div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" onclick={cancelDelete}>
			<div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-sm w-full" onclick={(e) => e.stopPropagation()}>
				<div class="flex justify-center mb-4"><div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center"><AlertTriangle class="w-8 h-8 text-red-600 dark:text-red-400" /></div></div>
				<p class="mb-2 text-lg font-bold text-center text-slate-800 dark:text-white">本当にこのサイトを削除しますか？</p>
				<p class="text-center text-sm text-slate-600 dark:text-slate-400 mb-6">「{deleteConfirmState.site?.title}」を削除すると、関連する記事も全て削除され、この操作は元に戻せません。</p>
				<div class="flex justify-center gap-4">
					<button onclick={executeDelete} class="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition w-full disabled:opacity-50" disabled={deleteConfirmState.isProcessing}>
						{#if deleteConfirmState.isProcessing}<LoaderCircle class="w-5 h-5 animate-spin mx-auto"/>{:else}削除する{/if}
					</button>
					<button onclick={cancelDelete} class="px-5 py-2 rounded-lg bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 dark:bg-gray-600 dark:text-white transition w-full">キャンセル</button>
				</div>
			</div>
		</div>
	{/if}
</div>
