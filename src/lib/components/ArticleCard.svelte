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

<div
  class="block w-full rounded-lg border border-gray-300 dark:border-slate-600 shadow-md hover:shadow-lg h-20 md:h-24 transition-shadow duration-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
>
  <a href={`${article.url}`} rel="noopener noreferrer" class="flex w-full h-full min-w-0 overflow-hidden text-sm no-underline">
    <div class="h-full w-20 md:w-24 flex-none overflow-hidden bg-slate-100 dark:bg-slate-700 rounded-l-lg flex items-center justify-center">
      <img
        class="h-full w-full object-cover rounded-l-lg"
        src={article.thumbnail || '/favicon.png'}
        alt={article.title || '記事サムネイル'}
        referrerpolicy="no-referrer"
        loading="lazy"
      />
    </div>
    <div class="flex min-w-0 flex-1 flex-col p-1.5 text-sm">
      <div class="flex items-center gap-x-2 gap-y-1 text-xs mb-1 w-full min-w-0">
        <span class="text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">{formattedDate}</span>
        {#if article.site_title}
          <span
            class="whitespace-nowrap truncate max-w-[120px] rounded-full bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
            title={article.site_title}
          >
            {article.site_title}
          </span>
        {/if}
      </div>
      <h3
        class="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2"
        title={article.title}
      >
        {article.title || "タイトルなし"}
      </h3>
    </div>
  </a>
</div>
