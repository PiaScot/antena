<script lang="ts">
import ArticleCard from "$lib/components/ArticleCard.svelte";
import type { ArticleWithSiteName } from "$lib/types";
import type { PageData } from "./$types";

const { data } = $props<PageData>();

const articles = $derived(data.articles ?? []);
const error = $derived(data.error);

let searchTerm = $state("");

const filteredArticles = $derived(() => {
	if (!searchTerm) {
		return articles;
	}
	const lowerCaseSearchTerm = searchTerm.toLowerCase();
	return articles.filter(
		(a) =>
			a.title?.toLowerCase().includes(lowerCaseSearchTerm) ||
			a.site_title?.toLowerCase().includes(lowerCaseSearchTerm) ||
			a.url?.toLowerCase().includes(lowerCaseSearchTerm),
	);
});
</script>

<div class="max-w-2xl mx-auto py-3 px-1">
	<h2 class="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-white">記事タイトル検索</h2>
	<div class="relative mb-4">
		<input
			type="search"
			bind:value={searchTerm}
			class="w-full rounded-lg border border-emerald-400 px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400"
			placeholder="🔍 記事タイトルやサイト名で検索"
			autocomplete="off"
		/>
		{#if searchTerm}
			<button class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" onclick={() => searchTerm = ""}>×</button>
		{/if}
	</div>

	<div class="mt-4">
		{#if error}
			<div class="text-center text-red-500">記事の読み込みに失敗しました: {error}</div>
		{:else if filteredArticles().length === 0}
			<div class="text-center text-slate-500 dark:text-slate-300">
				{#if searchTerm}
					該当する記事がありません。
				{:else}
					表示できる記事がありません。
				{/if}
			</div>
		{:else}
			<ul class="space-y-3">
				{#each filteredArticles() as article (article.id)}
					<li>
						<ArticleCard {article} />
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
