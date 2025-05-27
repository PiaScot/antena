<script lang="ts">
import type { Site } from "$lib/types/index.ts";
export let site: Site;
</script>

<div class="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow flex flex-col gap-1 min-h-0">
  <h2 class="text-base font-bold text-slate-900 dark:text-slate-100 break-all leading-tight">{site.title}</h2>
  <p class="text-xs text-slate-600 dark:text-slate-400 break-all leading-tight">{site.domain || "No Domain"}</p>
  <div class="flex items-center justify-between mt-1">
    <span class="rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-[11px] text-blue-800 dark:text-blue-200">{site.category}</span>
    <a
      href={`/feed?site=${site.id}`}
      class="text-emerald-600 dark:text-emerald-400 hover:underline text-xs"
    >
      記事一覧へ
    </a>
  </div>
</div>
