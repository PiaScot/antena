<script lang="ts">
import Footer from "$lib/components/Footer.svelte";

/** 見出しごとにまとめておく */
const groups = [
	{
		title: "新着エントリ",
		items: [
			{ label: "まとめNEWS", cat: "news" },
			{ label: "雑談", cat: "chat" },
			{ label: "IT・ガジェット", cat: "it" },
			{ label: "面白・衝撃", cat: "orckt" },
		],
	},
	{
		title: "芸術",
		items: [
			{ label: "ALL", cat: "all" },
			{ label: "REAL", cat: "real" },
			{ label: "2D", cat: "2d" },
		],
	},
];
</script>

{#each groups as group}
  <div class="rounded-lg shadow border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 mb-4 mt-6">
    <p class="text-2xl text-center font-bold text-emerald-700 dark:text-emerald-400 py-2">
      {group.title}
    </p>
  </div>
  <div class="grid grid-cols-2 gap-2 mb-4">
    {#each group.items as item}
      <a
        href={"/feed?category=" + item.cat}
        class="rounded-lg shadow bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-800 
        flex items-center justify-center h-16 md:h-20 text-2xl font-semibold text-emerald-700 dark:text-emerald-300
        transition-colors duration-150"
      >
        {item.label}
      </a>
    {/each}
  </div>
{/each}

<Footer />
