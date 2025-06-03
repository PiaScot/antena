<script lang="ts">
import Footer from "$lib/components/Footer.svelte";

function generateId() {
	return crypto.randomUUID
		? crypto.randomUUID()
		: Math.random().toString(36).slice(2);
}

const categories = [
	{ id: generateId(), label: "まとめNEWS", cat: "news", visible: true },
	{ id: generateId(), label: "雑談", cat: "chat", visible: true },
	{ id: generateId(), label: "IT・ガジェット", cat: "it", visible: true },
	{ id: generateId(), label: "面白・衝撃", cat: "orckt", visible: true },
	{ id: generateId(), label: "ALL", cat: "all", visible: true },
	{ id: generateId(), label: "REAL", cat: "real", visible: true },
	{ id: generateId(), label: "2D", cat: "2d", visible: true },
];
</script>

<div class="max-w-2xl mx-auto">
  <div class="grid grid-cols-2 gap-2 mt-8 mx-4">
    {#each categories.filter(c => c.visible) as cat}
      <a
        href={"/feed?category=" + cat.cat}
        class="rounded-xl shadow bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-800 
        flex items-center justify-center h-16 md:h-20 text-2xl font-semibold text-emerald-700 dark:text-emerald-300
        transition-colors duration-150"
      >
        {cat.label}
      </a>
    {/each}
  </div>
</div>

<Footer />
