<script lang="ts">
import { categories } from "$lib/stores/categoryStore";
import { derived } from "svelte/store";

const visibleCategories = derived(categories, ($cats) =>
	$cats.filter((c) => c.visible),
);
</script>

<div class="max-w-2xl mx-auto">
  <div class="grid grid-cols-2 gap-2 mt-8 mx-4">
    {#each $visibleCategories as cat}
      <a
        href={"/feed?category=" + cat.id}
        class="rounded-xl shadow bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-800 
        flex items-center justify-center h-16 md:h-20 text-2xl font-semibold text-emerald-700 dark:text-emerald-300
        transition-colors duration-150"
      >
        {cat.label}
      </a>
    {/each}
  </div>
</div>
