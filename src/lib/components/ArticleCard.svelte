<script lang="ts">
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ArticleWithSiteName } from "$lib/types";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

export let article: ArticleWithSiteName;
export let withImage = true;

const formattedDate = dayjs(article.pub_date).tz().format("YYYY/MM/DD HH:mm");
</script>

{#if withImage}
<!-- サムネイル付きバージョン -->
<a href={`/articles/${article.id}`} rel="noopener noreferrer"
  class="w-full text-left flex items-center gap-3 bg-slate-200 dark:bg-slate-700 rounded-lg p-3 shadow hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
>
  <img src={article.thumbnail || '/favicon.png'} alt="thumb" class="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
  <div class="flex min-w-0 flex-1 flex-col p-1.5 text-sm">
    <div class="flex items-center gap-x-2 gap-y-1 text-xs mb-1 w-full min-w-0">
      <span class="text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">{formattedDate}</span>
      {#if article.site_title}
        <span
          class="truncate max-w-[8rem] sm:max-w-[12rem] whitespace-nowrap rounded-full bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
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
{:else}
<!-- サムネイル無しバージョン（よりシンプル） -->
<div
  class="block w-full rounded-lg border border-gray-300 dark:border-slate-600 shadow hover:shadow-lg transition bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
>
  <a href={`/articles/${article.id}`} rel="noopener noreferrer" class="flex flex-col px-3 py-2 gap-1">
    <div class="flex items-center gap-2 text-xs mb-1">
      <span class="text-slate-500 dark:text-slate-400">{formattedDate}</span>
      {#if article.site_title}
        <span
          class="rounded-full bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]"
          title={article.site_title}
        >
          {article.site_title}
        </span>
      {/if}
    </div>
    <h3
      class="text-base font-semibold text-slate-800 dark:text-slate-100 line-clamp-2"
      title={article.title}
    >
      {article.title || "タイトルなし"}
    </h3>
  </a>
</div>
{/if}
