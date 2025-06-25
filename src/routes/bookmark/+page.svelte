<script lang="ts">
import ArticleCard from "$lib/components/ArticleCard.svelte";
import type { PageData } from "./$types";

const { data } = $props<{ data: PageData }>();
const articlesPromise = data.streamed.bookmarks;
</script>

<div class="py-1">
	<h2 class="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mt-6 mb-4">
		ブックマーク記事
	</h2>

	{#await articlesPromise}
		<p class="text-center text-slate-600 dark:text-slate-300 py-10">
			ブックマークした記事をを取得中...
    </p>
	{:then bookmarks}
  {#if bookmarks.length === 0}
    <p>ブックマークしている記事はありません。</p>
  {:else}
		<div class="mx-auto w-full max-w-screen-lg px-1 sm:px-2">
			<div class="space-y-1">
				{#each bookmarks as article (article.url)}
					<ArticleCard {article} />
				{/each}
			</div>
		</div>
  {/if}
  {:catch error}
		<p class="text-center text-red-500">
			記事の取得に失敗しました: {error.message}
		</p>
  {/await}
</div>
