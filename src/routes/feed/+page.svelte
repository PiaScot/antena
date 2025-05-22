<script lang="ts">
import { onMount } from "svelte";
import ArticleCard from "$lib/components/ArticleCard.svelte";
import type { Article } from "$lib/types";

let articles: Article[] = [];
let loading = true;
let errorMessage: string | null = null;
let category = "all";

onMount(async () => {
	const query = new URLSearchParams(window.location.search);
	category = query.get("category") || "all";

	try {
		const res = await fetch(`/api/feed?category=${category}`);
		if (!res.ok) {
			const errorData = await res
				.json()
				.catch(() => ({ message: "Failed to fetch data" }));
			throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
		}

		// console.log(res);

		const json = await res.json();
		articles = json.articles || [];
		if (articles.length === 0 && !json.articles) {
			// APIが空配列を返さない場合も考慮
			// articlesが空でもエラーではないが、該当データなしのケース
		}
	} catch (e: any) {
		console.error("読み込みエラー:", e);
		errorMessage = e.message || "記事の読み込み中にエラーが発生しました。";
	} finally {
		loading = false;
	}
});
</script>

<div class="py-1"> 
	{#if loading}
		<p class="text-center text-slate-600 dark:text-slate-300">読み込み中...</p>
	{:else if errorMessage}
		<p class="text-center text-red-600 dark:text-red-400">エラー: {errorMessage}</p>
	{:else if articles.length === 0}
		<p class="text-center text-slate-600 dark:text-slate-300">記事が見つかりません。</p>
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
