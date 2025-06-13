<script lang="ts">
import ArticleCard from "$lib/components/ArticleCard.svelte";
import type { ArticleWithSiteName } from "$lib/types";
import type { PageData } from "./$types";

const { data } = $props<PageData>();
const articles = $derived(data.items ?? []);
const error = $derived(data.error);
</script>

<div class="py-1">
	<h2 class="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mt-6 mb-4">
		ブックマーク記事
	</h2>

	{#if error}
		<p class="text-center text-red-600 dark:text-red-400">エラー: {error()}</p>
	{:else if articles.length === 0}
		<p class="text-center text-slate-600 dark:text-slate-300">ブックマークした記事がありません。</p>
	{:else}
		<div class="mx-auto w-full max-w-screen-lg px-1 sm:px-2">
			<div class="space-y-1">
				{#each articles as article (article.url)}
					<ArticleCard {article} />
				{/each}
			</div>
		</div>
	{/if}
</div>
