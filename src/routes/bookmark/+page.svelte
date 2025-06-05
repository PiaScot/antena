<script lang="ts">
import { onMount, tick, onDestroy } from "svelte";
import { beforeNavigate } from "$app/navigation";
import { page } from "$app/stores";
import ArticleCard from "$lib/components/ArticleCard.svelte";
import type { ArticleWithSiteName } from "$lib/types";
import { scrollPositions } from "$lib/stores/scrollStore";

//サーバーサイドからdataオブジェクトとして受け取る
export let data: { articles: ArticleWithSiteName[]; error?: string };

// dataオブジェクトからarticlesとerrorを取り出す
$: articles = data.articles || [];
$: error = data.error;

let loading = false;
let currentFullUrl: string;
let pageStoreUnsubscribe: () => void;
let beforeNavigateUnsubscribe: () => void;

pageStoreUnsubscribe = page.subscribe((p) => {
	currentFullUrl = p.url.href;
});

onMount(async () => {
	await tick();
	const savedScrollY = $scrollPositions?.[currentFullUrl];
	if (typeof savedScrollY === "number") {
		window.scrollTo(0, savedScrollY);
	}
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

// $: errorMessage = error ? error : null; // error をそのまま使えば良い
</script>

<div class="py-1">
  <h2 class="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mt-6 mb-4">
    ブックマーク記事
  </h2>
  {#if loading} <p class="text-center text-slate-600 dark:text-slate-300">読み込み中...</p>
  {:else if error}
    <p class="text-center text-red-600 dark:text-red-400">エラー: {error}</p>
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
