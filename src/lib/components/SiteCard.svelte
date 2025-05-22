<script lang="ts">
type Site = {
	url: string;
	domain: string;
	title: string;
	category: string;
	last_access: string;
};

export let site: Site;
</script>

<div class="rounded-lg border dark:bg-white bg-zinc-300 p-4 shadow">
  <h2 class="mb-2 text-xl font-bold dark:text-black text-wrap break-all">{site.title}</h2>
  <p class="mb-2 text-sm text-gray-600 text-wrap break-all text-clip">{site.domain || "No Domain"}</p>
  <div class="mt-2 flex items-center justify-between">
    <span class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800 text-wrap">{site.category}</span>
    <a href={site.url} target="_blank" class="text-blue-500 hover:underline text-wrap">サイトへ</a>
  </div>
</div>
