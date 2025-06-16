<script lang="ts">
import ArticleCard from "$lib/components/ArticleCard.svelte";
import type { ArticleWithSiteName } from "$lib/types";
import { GalleryHorizontalEnd, List } from "@lucide/svelte";

const { data } = $props<{
	data: {
		streamed: {
			articles: Promise<ArticleWithSiteName[]>;
		};
		category: string;
		site: string | null;
	};
}>();

const { articles: articlesPromise } = data.streamed;

let cardStyle = $state<"image" | "simple">("image");
</script>

<div class="bg-emerald-400/10 dark:bg-slate-900/90 max-w-2xl mx-auto py-3 px-3">
  <div class="flex justify-center items-center gap-4 py-2">
    <button
      onclick={() => cardStyle = "image"}
      class="rounded-full p-2 flex items-center justify-center
      transition border-2 border-transparent hover:border-emerald-400
      focus-visible:ring-2 focus-visible:ring-emerald-500
      bg-slate-800 dark:bg-slate-700 text-emerald-400"
      aria-label="サムネイル表示"
      aria-pressed={cardStyle === "image"}
      style={cardStyle === "image" ? "background: #10b98122; border-color: #10b981;" : ""}
    >
      <GalleryHorizontalEnd class="w-6 h-6" />
    </button>
    <button
      onclick={() => cardStyle = "simple"}
      class="rounded-full p-2 flex items-center justify-center
      transition border-2 border-transparent hover:border-emerald-400
      focus-visible:ring-2 focus-visible:ring-emerald-500
      bg-slate-800 dark:bg-slate-700 text-emerald-400"
      aria-label="リスト表示"
      aria-pressed={cardStyle === "simple"}
      style={cardStyle === "simple" ? "background: #10b98122; border-color: #10b981;" : ""}
    >
      <List class="w-6 h-6" />
    </button>
  </div>
</div>
<div class="max-w-2xl mx-auto py-3 px-1">
  {#await articlesPromise}
    <p class="text-center text-slate-600 dark:text-slate-300 py-10">
      記事を取得中...
    </p>
  {:then articles}
    {#if articles.length === 0}
      <p class="text-center text-slate-600 dark:text-slate-300">表示する記事がありません</p>
    {:else}
      <div class="mx-auto w-full max-w-screen-lg px-1 sm:px-2">
        <div class="space-y-3">
          {#each articles as article (article.url)}
            <ArticleCard {article} withImage={cardStyle === "image"} />
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
