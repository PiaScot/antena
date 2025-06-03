<!-- src/routes/feed/+page.svelte -->
<script lang="ts">
import { onMount, onDestroy, tick } from "svelte";
import { beforeNavigate } from "$app/navigation";
import { page } from "$app/stores";
import { get } from "svelte/store";
import ArticleCard from "$lib/components/ArticleCard.svelte";
import ArticleCardSimple from "$lib/components/ArticleCardSimple.svelte";
import type { Article } from "$lib/types";
import { GalleryHorizontalEnd, List } from "lucide-svelte";

import { scrollPositions } from "$lib/stores/scrollStore";

let articles: Article[] = [];
let loading = true;
let errorMessage: string | null = null;

// クエリから取ってくる値
let categoryFromQuery = "all";
let siteFromQuery: string | null = null;

let currentFullUrl: string;
let pageStoreUnsubscribe: () => void;
let beforeNavigateUnsubscribe: () => void;

let cardStyle: "image" | "simple" = "image";

pageStoreUnsubscribe = page.subscribe((p) => {
	currentFullUrl = p.url.href;
});

onMount(async () => {
	const params = new URLSearchParams(window.location.search);
	categoryFromQuery = params.get("category") || "all";
	siteFromQuery = params.get("site");

	loading = true;
	errorMessage = null;

	try {
		let res: Response;

		if (siteFromQuery) {
			res = await fetch(`/api/feed?site=${siteFromQuery}`);
		} else {
			res = await fetch(`/api/feed?category=${categoryFromQuery}`);
		}

		if (!res.ok) {
			const errData = await res
				.json()
				.catch(() => ({ message: res.statusText }));
			throw new Error(errData.message || `HTTP error! status: ${res.status}`);
		}

		const json = await res.json();
		articles = json.articles || [];
	} catch (e: any) {
		console.error("読み込みエラー:", e);
		errorMessage = e.message || "記事の読み込み中にエラーが発生しました。";
	} finally {
		loading = false;
		await tick();

		const savedScrollY = $scrollPositions[currentFullUrl];
		if (typeof savedScrollY === "number") {
			window.scrollTo(0, savedScrollY);

			// オプション: 一度復元したらストアから削除する場合
			// scrollPositions.update((positions) => {
			// 	delete positions[currentFullUrl];
			// 	return positions;
			// });
		}
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
	if (pageStoreUnsubscribe) {
		pageStoreUnsubscribe();
	}
	if (beforeNavigateUnsubscribe) {
		beforeNavigateUnsubscribe();
	}
});
</script>

<div class="sticky top-[56px] bg-emerald-400/10 dark:bg-slate-900/90 max-w-2xl mx-auto py-3 px-3">
  <div class="flex justify-center items-center gap-4 py-2">
    <button
      on:click={() => cardStyle = "image"}
      class="rounded-full p-2 flex items-center justify-center
      transition border-2
      border-transparent
      hover:border-emerald-400
      focus-visible:ring-2 focus-visible:ring-emerald-500
      bg-slate-800 dark:bg-slate-700
      text-emerald-400"
      aria-label="サムネイル表示"
      aria-pressed={cardStyle === "image"}
      style={cardStyle === "image" ? "background: #10b98122; border-color: #10b981;" : ""}
    >
      <GalleryHorizontalEnd class="w-6 h-6" />
    </button>
    <button
      on:click={() => cardStyle = "simple"}
      class="rounded-full p-2 flex items-center justify-center
      transition border-2
      border-transparent
      hover:border-emerald-400
      focus-visible:ring-2 focus-visible:ring-emerald-500
      bg-slate-800 dark:bg-slate-700
      text-emerald-400"
      aria-label="リスト表示"
      aria-pressed={cardStyle === "simple"}
      style={cardStyle === "simple" ? "background: #10b98122; border-color: #10b981;" : ""}
    >
      <List class="w-6 h-6" />
    </button>
  </div>
</div>

<!-- 記事リスト -->
<div class="max-w-2xl mx-auto py-6 px-3">
  {#if loading}
    <p class="text-center text-slate-600 dark:text-slate-300">読み込み中...</p>
  {:else if errorMessage}
    <p class="text-center text-red-600 dark:text-red-400">エラー: {errorMessage}</p>
  {:else if articles.length === 0}
    <p class="text-center text-slate-600 dark:text-slate-300">記事が見つかりません。</p>
  {:else}
    <div class="mx-auto w-full max-w-screen-lg px-1 sm:px-2">
      <div class="space-y-3">
        {#each articles as article (article.url)}
          {#if cardStyle === "image"}
            <ArticleCard {article} />
          {:else}
            <ArticleCardSimple {article} />
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
