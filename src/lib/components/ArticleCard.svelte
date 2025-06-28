<script lang="ts">
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ArticleFeedItem, FullArticleData } from "$lib/types";
import { activeArticle } from "$lib/stores/activeArticle";
import { LoaderCircle } from "@lucide/svelte";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

const { article, withImage = true } = $props<{
	article: ArticleFeedItem;
	withImage?: boolean;
}>();

let isLoading = $state(false);

const formattedDate = $derived(
	dayjs(article.pub_date).tz().format("YYYY/MM/DD HH:mm"),
);

async function handleClick() {
	// window.open(article.url, "_blank", "noopener,noreferrer");
	if (article.site?.scrape_options?.display_mode === "direct_link") {
		window.open(article.url, "_blank", "noopener,noreferrer");
		return;
	}
	isLoading = true;
	try {
		const res = await fetch(`/api/articles/${article.id}`);
		if (!res.ok) {
			throw new Error(`Failed to fetch article content: ${res.statusText}`);
		}
		const fullArticleData: FullArticleData = await res.json();
		activeArticle.set(fullArticleData);
	} catch (err) {
		console.error("Failed to open article modal:", err);
	} finally {
		isLoading = false;
	}
}
</script>

<div
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
	class="group relative block w-full text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
>
	<div class="flex items-start gap-4">
		{#if withImage}
			<img
        src={article.thumbnail ? `/api/image-proxy?url=${encodeURIComponent(article.thumbnail)}` : '/favicon.png'}
				alt="サムネイル"
				class="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-600"
				loading="lazy"
			/>
		{/if}
		<div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 mb-2">
				<span class="flex-shrink-0">{formattedDate}</span>
				{#if article.site?.title}
					<span class="font-medium text-emerald-700 dark:text-emerald-400 truncate text-right flex-1 min-w-0 group-hover:underline" title={article.site.title}>
						{article.site.title}
					</span>
				{/if}
			</div>
            <h3
				class="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[3rem]"
				title={article.title}
			>
				{article.title || '記事タイトル'}
			</h3>
		</div>
	</div>

	{#if isLoading}
		<div class="absolute inset-0 bg-slate-800/50 flex items-center justify-center rounded-xl">
			<LoaderCircle class="w-8 h-8 text-white animate-spin" />
		</div>
	{/if}
</div>
