<script lang="ts">
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import type { ArticleFeedItem, Article } from '$lib/types';
	import type { PageData } from './$types';

	const { data } = $props<{ data: PageData }>();
	const articlesPromise = data.streamed.articles;

	let searchTerm = $state('');
	let filteredArticles = $state<Article>();

	$inspect(filteredArticles);

	function matchesSearch(article: ArticleFeedItem, term: string) {
		if (!term) return true;
		const lower = term.toLowerCase();
		return (
			article.title?.toLowerCase().includes(lower) ||
			article.site?.title?.toLowerCase().includes(lower) ||
			article.url?.toLowerCase().includes(lower)
		);
	}

	function isExcludedCategory(article: ArticleFeedItem) {
		return article.category === '2D' || article.category === 'REAL';
	}
</script>

<div class="mx-auto max-w-2xl px-1 py-10">
	<h2
		class="mb-4 text-center text-2xl font-bold text-slate-800 dark:text-white"
	>
		記事検索
	</h2>

	<div class="relative mb-6">
		<input
			type="search"
			bind:value={searchTerm}
			class="w-full rounded-lg border border-emerald-400 bg-white px-4 py-2 text-slate-800 shadow-inner
			       focus:ring-2 focus:ring-emerald-400 focus:outline-none
			       dark:bg-slate-800 dark:text-white"
			placeholder="🔍 記事タイトルやサイト名で検索"
			autocomplete="off"
		/>
		{#if searchTerm}
			<button
				class="absolute top-1/2 right-3 -translate-y-1/2 text-2xl font-bold text-slate-500
				       hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
				onclick={() => (searchTerm = '')}
				aria-label="検索語をクリア"
			>
				×
			</button>
		{/if}
	</div>

	{#await articlesPromise}
		<p class="py-10 text-center text-slate-600 dark:text-slate-300">
			全記事を取得中...
		</p>
	{:then articles}
		{@const filteredArticles = articles.filter(
			(a: Article) => matchesSearch(a, searchTerm) && !isExcludedCategory(a)
		)}

		{#if filteredArticles.length === 0}
			<div class="py-10 text-center text-slate-500 dark:text-slate-300">
				{#if searchTerm}
					<p>「{searchTerm}」に一致する記事はありませんでした。</p>
				{:else}
					<p>表示できる記事がありません。</p>
				{/if}
			</div>
		{:else}
			<ul>
				{#each filteredArticles as article (article.id)}
					<li><ArticleCard {article} /></li>
				{/each}
			</ul>
		{/if}
	{:catch error}
		<p class="text-center text-red-500">
			記事の取得に失敗しました: {error.message}
		</p>
	{/await}
</div>
