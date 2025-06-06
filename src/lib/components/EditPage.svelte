<script lang="ts">
import { onMount } from "svelte";
import { Trash2, Plus, Pen, Search } from "lucide-svelte";
import type { ArticleWithSiteName, Site } from "$lib/types";

let sites: Site[] = [];
let filteredSites: Site[] = [];
let categories: string[] = [];
let searchTerm = "";
let isLoading = true;

// 編集用
let editIdx: number | null = null;
let editTitle = "";
let editUrl = "";
let editRss = "";
let editCategory = "";

// 新規追加用
let inputUrl = "";
let inputCategory = "";
let fetchError = "";
let fetchedSite: Site | null = null;
let fetchedArticles: ArticleWithSiteName[] | null = null;
let isFetching = false;
let addSuccessMsg = "";

// 新カテゴリ
let newCategory = "";
let showDeleteCatConfirm = false;
let deleteCatIdx: number | null = null;

async function fetchSites() {
	isLoading = true;
	const res = await fetch("/api/page");
	const data = await res.json();
	sites = data.sites ?? [];
	categories = Array.from(
		new Set(sites.map((s) => s.category).filter(Boolean)),
	);
	isLoading = false;
}

onMount(fetchSites);

// サイト検索→サイト情報取得API
async function fetchSiteInfo() {
	fetchError = "";
	fetchedSite = null;
	addSuccessMsg = "";
	if (!inputUrl || !inputCategory) {
		fetchError = "URL/RSSとカテゴリを入力してください";
		return;
	}
	isFetching = true;
	try {
		const res = await fetch("/api/fetch-site-info", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ url: inputUrl, category: inputCategory }),
		});
		const data = await res.json();

		if (!res.ok && data.error) {
			fetchError = data.error;
			isFetching = false;
			return;
		}

		fetchedSite = data.site;
		fetchedArticles = data.articles;
	} catch (e) {
		fetchError = e instanceof Error ? e.message : String(e);
	}
	isFetching = false;
}

// 新規取得内容をクリア
function clearFetched() {
	fetchedSite = null;
	inputUrl = "";
	inputCategory = "";
	fetchError = "";
}

async function addSite() {
	if (!fetchedSite) return;
	try {
		const { id, ...sitePayload } = fetchedSite;

		const res = await fetch("/api/register-site", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(sitePayload),
		});

		const data = await res.json();

		if (res.ok && data.ok) {
			addSuccessMsg = "サイトを追加しました";
			await fetchSites();
			clearFetched();

			// TODO
			// fetch("/api/crawl-articles-once", {
			// 	method: "POST",
			// 	headers: { "Content-Type": "application/json" },
			// 	body: JSON.stringify({ siteID: data.id, rawArticles: fetchedArticles }),
			// });
		} else {
			addSuccessMsg = `サイトの追加に失敗しました:   ${data?.error || "不明なエラー"}`;
		}
	} catch (e) {
		addSuccessMsg = `サイトの追加に失敗しました: ${e instanceof Error ? e.message : String(e)}`;
	}
}

function startEdit(idx: number) {
	editIdx = idx;
	const s = filteredSites[idx];
	editTitle = s.title;
	editUrl = s.url;
	editRss = s.rss;
	editCategory = s.category;
}

async function commitEdit(idx: number) {
	const res = await fetch("/api/", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			id: idx,
			title: editTitle,
			url: editUrl,
			rss: editRss,
			category: editCategory,
		}),
	});
	const data = await res.json();
	if (!res.ok) {
		alert(data?.error || "更新失敗");
		editIdx = null;
		return;
	}
	sites[i] = {
		...sites[i],
		title: editTitle,
		url: editUrl,
		rss: editRss,
		category: editCategory,
	};
	editIdx = null;
}

function cancelEdit() {
	editIdx = null;
}

// カテゴリ追加・削除
function addCategory() {
	const name = newCategory.trim();
	if (!name || categories.includes(name)) return;
	categories = [...categories, name];
	newCategory = "";
}
function confirmDeleteCategory(idx: number) {
	deleteCatIdx = idx;
	showDeleteCatConfirm = true;
}
function removeCategory() {
	if (deleteCatIdx !== null) {
		const cat = categories[deleteCatIdx];
		sites = sites.map((s) => (s.category === cat ? { ...s, category: "" } : s));
		categories = categories.filter((_, i) => i !== deleteCatIdx);
	}
	deleteCatIdx = null;
	showDeleteCatConfirm = false;
}
function cancelDelete() {
	showDeleteCatConfirm = false;
	deleteCatIdx = null;
}

// 検索用reactive
$: filteredSites = !searchTerm
	? sites
	: sites.filter(
			(s) =>
				s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				s.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				s.rss?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				s.category?.toLowerCase().includes(searchTerm.toLowerCase()),
		);
</script>

<div class="max-w-xl mx-auto p-4">
  <!-- 新規サイト追加 -->
  <div class="mb-6 p-4 bg-slate-800 rounded-xl shadow max-w-xl mx-auto">
    <h3 class="text-lg font-semibold mb-2 text-white">新規サイト追加</h3>
    {#if addSuccessMsg}
      <div class="mb-2 text-green-500">{addSuccessMsg}</div>
    {/if}
    {#if !fetchedSite}
      <div class="flex flex-col gap-2">
        <input
          class="px-3 py-2 rounded border focus:outline-none"
          type="text"
          placeholder="サイトURL または RSS URL"
          bind:value={inputUrl}
          autocomplete="off"
        />
        <select
          style="background-color: #232946; color: #fff;"
          class="px-3 py-2 rounded border focus:outline-none"
          bind:value={inputCategory}
        >
          <option value="">カテゴリ選択</option>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
        {#if fetchError}
          <div class="text-red-500 text-sm">{fetchError}</div>
        {/if}
        <button
          class="mt-2 px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center"
          type="button"
          on:click={fetchSiteInfo}
          disabled={isFetching}
        >
          <Search class="w-4 h-4 mr-2" />
          検索
        </button>
      </div>
    {:else}
      <div class="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 mb-2">
        <div class="mb-1"><span class="font-semibold">サイト名:</span> {fetchedSite.title}</div>
        <div class="mb-1"><span class="font-semibold">URL:</span> {fetchedSite.url}</div>
        <div class="mb-1"><span class="font-semibold">RSS:</span> {fetchedSite.rss}</div>
        <div class="mb-1"><span class="font-semibold">カテゴリ:</span> {fetchedSite.category}</div>
        <div class="mb-1"><span class="font-semibold">ドメイン:</span> {fetchedSite.domain}</div>
        <div class="mb-1"><span class="font-semibold">更新間隔:</span> {fetchedSite.duration_access} 秒</div>
      {#if fetchedArticles && fetchedArticles.length > 0}
              <div class="mb-2 mt-4">
                <div class="font-semibold text-base mb-1 text-slate-800 dark:text-white">最新記事</div>
                <ul class="list-disc ml-4">
                  {#each fetchedArticles.slice(0,5) as article}
                    <li class="mb-1">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-500"
                      >
                        {article.title}
                      </a>
                      <span class="ml-2 text-xs text-slate-600 dark:text-slate-300">
                        {article.pub_date}
                      </span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
        <div class="flex gap-2 mt-4">
          <button
            class="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
            type="button"
            on:click={addSite}
          >追加</button>
          <button
            class="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-600"
            type="button"
            on:click={clearFetched}
          >キャンセル</button>
        </div>
      </div>
    {/if}
  </div>

  <h2 class="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-white">サイト一覧・カテゴリ編集</h2>

  <!-- カテゴリ操作 -->
  <div class="mb-2 flex items-center gap-3">
    <span class="font-bold text-emerald-600 dark:text-emerald-400 text-xl">カテゴリ</span>
    <input
      type="text"
      placeholder="カテゴリ新規追加"
      bind:value={newCategory}
      class="rounded px-2 py-1 border border-emerald-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
      on:keydown={(e) => e.key === 'Enter' && addCategory()}
    />
    <button
      class="bg-emerald-500 text-white rounded px-2 py-1 flex items-center gap-1"
      on:click={addCategory}
    ><Plus class="w-4 h-4" />追加</button>
  </div>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each categories as cat, idx}
      <span class="inline-flex items-center bg-emerald-100 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200 px-3 py-1 rounded-full font-bold text-base">
        {cat}
        <button class="ml-2 hover:bg-red-100 dark:hover:bg-red-600 p-1 rounded" title="カテゴリ削除" on:click={() => confirmDeleteCategory(idx)}>
          <Trash2 class="w-4 h-4 text-red-500" />
        </button>
      </span>
    {/each}
  </div>
  <!-- 削除確認 -->
  {#if showDeleteCatConfirm && deleteCatIdx !== null}
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-sm w-full">
        <p class="mb-6 text-lg font-bold text-center text-red-600">本当にこのカテゴリを削除しますか？</p>
        <div class="flex justify-center gap-6">
          <button on:click={removeCategory} class="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-700">削除</button>
          <button on:click={cancelDelete} class="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-600">キャンセル</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- 検索窓 -->
  <div class="relative mb-4">
    <input
      type="search"
      bind:value={searchTerm}
      class="w-full rounded-lg border border-emerald-400 px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400"
      placeholder="🔍 サイト名、URL、カテゴリで検索"
      autocomplete="off"
    />
    {#if searchTerm}
      <button class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" on:click={() => searchTerm = ""}>×</button>
    {/if}
  </div>

  <div class="mt-4">
    <h3 class="font-bold text-lg text-slate-800 dark:text-white mb-2">サイト一覧</h3>
    {#if isLoading}
      <div class="text-center text-slate-500 dark:text-slate-300">読み込み中…</div>
    {:else if filteredSites.length === 0}
      <div class="text-center text-slate-500 dark:text-slate-300">該当するサイトがありません。</div>
    {:else}
      {#each filteredSites as site, idx (site.id)}
        <div class="mb-4 rounded-xl bg-slate-200 dark:bg-slate-700 shadow px-4 py-3 relative">
          {#if editIdx === idx}
            <input
              type="text"
              bind:value={editTitle}
              class="block w-full mb-2 rounded border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-1 border focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="サイト名"
              autocomplete="off"
            />
            <select
              style="background-color: #232946; color: #fff;"
              bind:value={editCategory}
              class="block w-full mb-2 rounded border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-1 border"
            >
              <option value="">カテゴリ選択</option>
              {#each categories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
            <input
              type="text"
              bind:value={editUrl}
              class="block w-full mb-2 rounded border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-1 border"
              placeholder="URL"
            />
            <input
              type="text"
              bind:value={editRss}
              class="block w-full mb-2 rounded border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-1 border"
              placeholder="RSS"
            />
            <div class="flex gap-3">
              <button on:click={() => commitEdit(idx)} class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex-1">√ 保存</button>
              <button on:click={cancelEdit} class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-white flex-1">✕ キャンセル</button>
            </div>
          {:else}
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <div class="font-bold text-xl text-slate-900 dark:text-white">{site.title}</div>
                  {#if site.category}
                    <span class="inline-block bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold align-middle">
                      {site.category}
                    </span>
                  {/if}
                </div>
                <div class="text-base mb-1 text-slate-700 dark:text-slate-200 break-all">{site.url}</div>
                <div class="text-sm mb-1 text-slate-500 dark:text-slate-400 break-all">{site.rss}</div>
              </div>
              <button
                class="bg-blue-500 hover:bg-blue-700 text-white rounded-full p-2 ml-2"
                title="編集"
                on:click={() => startEdit(idx)}
              >
                <Pen class="w-5 h-5" />
              </button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>
