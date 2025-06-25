<script lang="ts">
import { browser } from "$app/environment";
import SiteCard from "$lib/components/SiteCard.svelte";
import { sites as sitesStore } from "$lib/stores/siteStore";
// ★★★ 1. `categories` ストアを直接インポート ★★★
import { categories } from "$lib/stores/categoryStore";
import type { Site, Category } from "$lib/types";

// --- State ---
const sites = $derived($sitesStore);
// `const categories = $derived(...)` は不要なので削除

// ★★★ 2. 検索ロジックを修正 ★★★
const filteredAndGroupedSites = $derived(() => {
	const groups: Record<string, Site[]> = {};
	if (!sites) return groups;

	const filteredSites = !searchTerm
		? sites
		: sites.filter((site) =>
				site.title.toLowerCase().includes(searchTerm.toLowerCase()),
			);

	for (const site of filteredSites) {
		const catId = site.category || "other";
		if (!groups[catId]) groups[catId] = [];
		groups[catId].push(site);
	}
	return groups;
});

let searchTerm = $state("");

const CATEGORY_STATE_KEY = "category_visible_state";

$effect(() => {
	if (!browser) return;

	const saved = sessionStorage.getItem(CATEGORY_STATE_KEY);
	if (saved) {
		try {
			const obj = JSON.parse(saved);
			// ★★★ 3. インポートした `categories` ストアオブジェクトの .update() を使用 ★★★
			categories.update((cats) =>
				cats.map((cat) =>
					obj[cat.id] !== undefined ? { ...cat, visible: obj[cat.id] } : cat,
				),
			);
		} catch {
			// ignore error
		}
	}
});

$effect(() => {
	if (!browser) return;

	// ★★★ 4. ストアの値を $categories で直接参照 ★★★
	if ($categories.length === 0) return;

	const vis = Object.fromEntries(
		$categories.map((cat) => [cat.id, cat.visible]),
	);
	sessionStorage.setItem(CATEGORY_STATE_KEY, JSON.stringify(vis));
});

function toggleCategory(categoryId: string) {
	// ★★★ 3. インポートした `categories` ストアオブジェクトの .update() を使用 ★★★
	categories.update((cats) =>
		cats.map((cat) =>
			cat.id === categoryId ? { ...cat, visible: !cat.visible } : cat,
		),
	);
}
</script>

<div
	class="top-16 z-10 border-b border-slate-200 bg-slate-50/90 px-2 py-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90"
>
	<div class="flex flex-wrap gap-2">
        {#each $categories || [] as cat}
			<button
				onclick={() => toggleCategory(cat.id)}
				class="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-150 {cat.visible
					? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-900'
					: 'bg-slate-200 text-slate-700 opacity-70 dark:bg-slate-700 dark:text-slate-200'}"
			>
				{cat.label}
			</button>
		{/each}
	</div>

	<div class="mt-3">
		<input
			type="search"
			bind:value={searchTerm}
			placeholder="サイト名で検索..."
			class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
		/>
	</div>
</div>

<div class="px-2 pb-32">
    {#each ($categories || []).filter((cat) => cat.visible) as cat}
		{@const sitesForCategory = filteredAndGroupedSites()[cat.id]}
		{#if sitesForCategory?.length > 0}
			<div class="mb-8">
				<div class="mb-2 flex items-center gap-2">
					<span class="text-lg font-bold text-emerald-700 dark:text-emerald-300">{cat.label}</span>
					<span class="text-xs text-slate-500 dark:text-slate-400">({sitesForCategory.length})</span>
				</div>
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
					{#each sitesForCategory as site (site.id)}
						<SiteCard {site} />
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>
