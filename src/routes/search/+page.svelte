<script lang="ts">
import { onMount, tick, onDestroy } from "svelte";
import { beforeNavigate } from "$app/navigation";
import { page } from "$app/stores";
import { get } from "svelte/store";
import { scrollPositions } from "$lib/stores/scrollStore";
import { goto } from "$app/navigation";
import ArticleCard from "$lib/components/ArticleCard.svelte";
import type { ArticleWithSiteName } from "$lib/types";
import dayjs from "dayjs";

let articles: ArticleWithSiteName[] = [];
let filteredArticles: ArticleWithSiteName[] = [];
let searchTerm = "";
let isLoading = true;

let currentFullUrl: string;
let pageStoreUnsubscribe: () => void;
let beforeNavigateUnsubscribe: () => void;

// 現在ページの完全なURL（パス＋クエリ）を保存
pageStoreUnsubscribe = page.subscribe((p) => {
	currentFullUrl = p.url.href;
});

// 記事データ取得＆スクロール復元
onMount(async () => {
	isLoading = true;
	const res = await fetch("/api/feed?category=all");
	const data = await res.json();
	articles = data.articles ?? [];
	isLoading = false;
	await tick();
	const savedScrollY = get(scrollPositions)?.[currentFullUrl];
	if (typeof savedScrollY === "number") {
		window.scrollTo(0, savedScrollY);
	}
});

// 検索
$: filteredArticles = !searchTerm
	? articles
	: articles.filter(
			(a) =>
				(a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
				(a.site_title?.toLowerCase().includes(searchTerm.toLowerCase()) ??
					false) ||
				(a.url?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false),
		);

// 記事詳細へジャンプ
// function openArticle(article: ArticleWithSiteName) {
// goto(article.url);
// }

// 離脱時にスクロール位置保存
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

// アンマウント時にunsubscribe
onDestroy(() => {
	if (pageStoreUnsubscribe) pageStoreUnsubscribe();
	if (beforeNavigateUnsubscribe) beforeNavigateUnsubscribe();
});

const formattedDate = (rawData: string) => {
	return dayjs(rawData).tz().format("YYYY/MM/DD HH:mm");
};
</script>


<div class="max-w-2xl mx-auto py-6 px-3">
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
			<button class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" on:click={() => searchTerm = ""}>×</button>
		{/if}
	</div>

	<div class="mt-4">
		{#if isLoading}
			<div class="text-center text-slate-500 dark:text-slate-300">読み込み中…</div>
		{:else if filteredArticles.length === 0}
			<div class="text-center text-slate-500 dark:text-slate-300">該当する記事がありません。</div>
		{:else}
			<ul class="space-y-3">
				{#each filteredArticles as article (article.id)}
					<li>
            <a href={article.url} rel="noopener noreferrer"
							class="w-full text-left flex items-center gap-3 bg-slate-200 dark:bg-slate-700 rounded-lg p-3 shadow hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
						>
								<img src={article.thumbnail || '/favicon.png'} alt="thumb" class="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                <div class="flex min-w-0 flex-1 flex-col p-1.5 text-sm">
                  <div class="flex items-center gap-x-2 gap-y-1 text-xs mb-1 w-full min-w-0">
                    <span class="text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">{formattedDate(article.pub_date)}</span>
                      <span
                        class="whitespace-nowrap truncate max-w-[120px] rounded-full bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                        title={article.site_title}
                      >
                        {article.site_title}
                      </span>
                  </div>
                  <h3
                    class="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2"
                    title={article.title}
                  >
                    {article.title || "タイトルなし"}
                  </h3>
                </div>
              </a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
