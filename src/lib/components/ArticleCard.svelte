<script lang="ts">
import type { Article } from "$lib/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

export let article: Article & { site_title: string };
const formattedDate = dayjs(article.pub_date).tz().format("YYYY/MM/DD HH:mm");
</script>

<a
	href={`/articles/${article.id}`}
	rel="noopener noreferrer"
	class="block w-full rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
>
	<div class="flex w-full min-w-0 overflow-hidden">
		<div class="w-20 md:w-24 flex-none overflow-hidden bg-slate-100 dark:bg-slate-700">
			<img
				class="h-full w-full object-cover aspect-[4/3]"
				src={article.thumbnail || '/favicon.png'}
				alt="{article.title || '記事サムネイル'}"
        referrerpolicy="no-referrer"
				loading="lazy"
			/>
		</div>

		<div class="flex min-w-0 flex-1 flex-col p-3 text-sm">
			<div class="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
				<span class="text-slate-500 dark:text-slate-400 whitespace-nowrap">
					{formattedDate}
				</span>
				
				{#if article.site_title}
				<span
					class="whitespace-nowrap rounded-full bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300 truncate"
					title={article.site_title}
				>
					{article.site_title}
				</span>
				{/if}
			</div>

			<h3 
				class="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1 line-clamp-2 h-12" 
				title={article.title}
			>
				{article.title || "タイトルなし"}
			</h3>
			
		</div>
	</div>
</a>
