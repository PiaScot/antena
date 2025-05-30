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
