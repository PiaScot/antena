<!-- lib/components/SiteCard.svelte -->
<script lang="ts">
import type { Site } from "$lib/types/index.ts";

export let site: Site;
</script>

<div class="rounded-lg border dark:bg-white bg-zinc-300 p-4 shadow">
  <h2 class="mb-2 text-xl font-bold dark:text-black break-all">{site.title}</h2>
  <p class="mb-2 text-sm text-gray-600 break-all">{site.domain || "No Domain"}</p>
  <div class="mt-2 flex items-center justify-between">
    <span class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">{site.category}</span>
    <a
      href={`/feed?site=${site.id}`}
      class="text-blue-500 hover:underline"
    >
      記事一覧へ
    </a>
  </div>
</div>
