<script lang="ts">
import { onMount, onDestroy, tick } from "svelte";
import { beforeNavigate } from "$app/navigation";
import { page } from "$app/stores";
import { get } from "svelte/store";
import SiteCard from "$lib/components/SiteCard.svelte";
import type { Site } from "$lib/types";
import { scrollPositions } from "$lib/stores/scrollStore";

let sites: Site[] = [];
let loading = true;
let error: string | null = null;

// カテゴリグループ
let groupedSites: Record<string, Site[]> = {};
let allCategories: string[] = [];
let visibleCategories: Record<string, boolean> = {};

let currentFullUrl: string;
let pageStoreUnsubscribe: () => void;
let beforeNavigateUnsubscribe: () => void;

// データ取得＆グルーピング
async function fetchSites() {
	loading = true;
	error = null;
	try {
		const res = await fetch("/api/page");
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json = await res.json();
		sites = json.sites;

		groupSites();
		initializeVisibleCategories();
	} catch (e: any) {
		error = e.message;
	} finally {
		loading = false;
		await tick();
		const posMap = get(scrollPositions);
		const y = posMap[currentFullUrl];
		if (typeof y === "number") window.scrollTo(0, y);
	}
}

function groupSites() {
	groupedSites = {};
	allCategories = [];
	for (const site of sites) {
		const cat = site.category || "その他";
		if (!groupedSites[cat]) groupedSites[cat] = [];
		groupedSites[cat].push(site);
	}
	allCategories = Object.keys(groupedSites);
}

function initializeVisibleCategories() {
	visibleCategories = {};
	for (const cat of allCategories) {
		visibleCategories[cat] = true;
	}
}

pageStoreUnsubscribe = page.subscribe((p) => {
	currentFullUrl = p.url.href;
});

onMount(() => {
	fetchSites();
});

beforeNavigateUnsubscribe = beforeNavigate(({ from, to, type }) => {
	if (from && from.url.href === currentFullUrl) {
		if ((to && to.url.href !== currentFullUrl) || (!to && type === "leave")) {
			const scrollY = window.scrollY;
			scrollPositions.update((positions) => {
				positions[currentFullUrl] = scrollY;
				return positions;
			});
		}
	}
});

onDestroy(() => {
	if (pageStoreUnsubscribe) pageStoreUnsubscribe();
	if (beforeNavigateUnsubscribe) beforeNavigateUnsubscribe();
});
</script>

{#if loading}
  <p class="text-slate-800 dark:text-slate-200 text-center py-8">読み込み中...</p>
{:else if error}
  <p class="text-red-400 text-center py-8">エラー: {error}</p>
{:else}
  <!-- カテゴリフィルタボタン：Headerの下にsticky配置 -->
  <div class="flex gap-2 overflow-x-auto px-2 py-3 bg-slate-50 dark:bg-slate-900 sticky top-16 z-10 border-b border-slate-200 dark:border-slate-700">
    {#each allCategories as cat}
      <button
        on:click={() => visibleCategories[cat] = !visibleCategories[cat]}
        class="px-3 py-1 rounded-full font-semibold text-sm transition-colors duration-150
          {visibleCategories[cat]
            ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-900'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 opacity-70'}"
      >
        {cat}
      </button>
    {/each}
  </div>

  <!-- サイトカード（カテゴリごと） -->
  <div class="px-2 pb-32">
    {#each allCategories as cat}
      {#if visibleCategories[cat]}
        <div class="mb-8">
          <div class="mb-2 flex items-center gap-2">
            <span class="text-lg font-bold text-emerald-700 dark:text-emerald-300">{cat}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">({groupedSites[cat].length})</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each groupedSites[cat] as site}
              <SiteCard {site} />
            {/each}
          </div>
        </div>
      {/if}
    {/each}
  </div>
{/if}
