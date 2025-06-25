<script lang="ts">
import ArticleCard from "$lib/components/ArticleCard.svelte";
import type { ArticleFeedItem } from "$lib/types";
import type { PageData } from "./$types";

const { data } = $props<{ data: PageData }>();
const articlesPromise = data.streamed.articles;

let searchTerm = $state("");
</script>

<div class="max-w-2xl mx-auto py-10 px-1">
	<h2 class="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-white">記事検索</h2>
	<div class="relative mb-6">
		<input
			type="search"
			bind:value={searchTerm}
			class="w-full rounded-lg border border-emerald-400 px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400"
			placeholder="🔍 記事タイトルやサイト名で検索"
			autocomplete="off"
		/>
		{#if searchTerm}
			<button
				class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 text-2xl font-bold"
				onclick={() => searchTerm = ""}
				aria-label="検索語をクリア"
			>×</button>
		{/if}
	</div>

	{#await articlesPromise}
		<p class="text-center text-slate-600 dark:text-slate-300 py-10">
			全記事を取得中...
		</p>
	{:then articles}
		{@const lowerCaseSearchTerm = searchTerm.toLowerCase()}
		{@const filteredArticles = searchTerm.length < 1
			? articles
			: articles.filter(
					(a: ArticleFeedItem) =>
						a.title?.toLowerCase().includes(lowerCaseSearchTerm) ||
						a.site?.title?.toLowerCase().includes(lowerCaseSearchTerm) ||
						a.url?.toLowerCase().includes(lowerCaseSearchTerm)
				)}

		{#if filteredArticles.length === 0}
			<div class="text-center text-slate-500 dark:text-slate-300 py-10">
				{#if searchTerm}
					<p>「{searchTerm}」に一致する記事はありませんでした。</p>
				{:else}
					<p>表示できる記事がありません。</p>
				{/if}
			</div>
		{:else}
			<ul>
				{#each filteredArticles as article (article.id)}
					<li>
						<ArticleCard {article} />
					</li>
				{/each}
			</ul>
		{/if}
	{:catch error}
		<p class="text-center text-red-500">
			記事の取得に失敗しました: {error.message}
		</p>
	{/await}
</div>
