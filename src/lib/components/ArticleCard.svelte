<script lang="ts">
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ArticleWithSiteName } from "$lib/types";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

const { article, withImage = true } = $props<{
	article: ArticleWithSiteName;
	withImage?: boolean;
}>();

const formattedDate = $derived(
	dayjs(article.pub_date).tz().format("YYYY/MM/DD HH:mm"),
);
</script>

<a 
  href={`${article.url}`}
  rel="noopener noreferrer"
  class="group block w-full text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
>
	<div class="flex items-start gap-4">
		{#if withImage}
			<img 
        src={article.thumbnail || '/favicon.png'} 
        alt="サムネイル"
        class="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-600" 
        loading="lazy"
      />
      <div class="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0 items-center justify-center text-slate-400 hidden">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" x2="23" y1="1" y2="23" /><path d="M21 21H3a2 2 0 0 1-2-2V8.828a2 2 0 0 1 .586-1.414l2.828-2.828a2 2 0 0 1 1.414-.586H19a2 2 0 0 1 2 2v4" /><path d="M14 14a3 3 0 1 1-3-3" /><path d="M7 21a3 3 0 0 0 3-3" /></svg>
      </div>
		{/if}

		<div class="flex-1 min-w-0">
			<div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
				<span>{formattedDate}</span>
				{#if article.site_title}
					<span class="font-medium text-emerald-700 dark:text-emerald-400 truncate group-hover:underline" title={article.site_title}>
						{article.site_title}
					</span>
				{/if}
			</div>
			<h3 class="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[3rem]" title={article.title}>
				{article.title || "記事タイトル"}
			</h3>
		</div>
	</div>
</a>
