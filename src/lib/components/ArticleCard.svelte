<script lang="ts">
import type { ArticleWithSiteName } from "$lib/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

export let article: ArticleWithSiteName;
const formattedDate = dayjs(article.pub_date).tz().format("YYYY/MM/DD HH:mm");
</script>

<a href={article.url} rel="noopener noreferrer"
	class="w-full text-left flex items-center gap-3 bg-slate-200 dark:bg-slate-700 rounded-lg p-3 shadow hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
>
	<img src={article.thumbnail || '/favicon.png'} alt="thumb" class="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
  <div class="flex min-w-0 flex-1 flex-col p-1.5 text-sm">
    <div class="flex items-center gap-x-2 gap-y-1 text-xs mb-1 w-full min-w-0">
      <span class="text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">{formattedDate}</span>
        <span
          class="whitespace-nowrap rounded-full bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
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
