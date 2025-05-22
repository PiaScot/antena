<script lang="ts">
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
			{ label: "ALL", cat: "art" },
			{ label: "REAL", cat: "real" },
			{ label: "2D", cat: "2d" },
		],
	},
];
</script>

{#each groups as group}
	<div class="outline outline-black">
		<p class="text-2xl text-center text-black dark:text-white">
			{group.title}
		</p>
	</div>

	<!-- ────── カテゴリー一覧 ────── -->
	<div class="grid grid-cols-2 outline outline-black">
		{#each group.items as item}
			<div class="flex h-18 items-center justify-center outline outline-black">
				<a
					href={"/feed?category=" + item.cat}
					class="flex w-full h-full items-center justify-center text-center text-3xl text-zinc-700 dark:text-amber-800"
				>
					{item.label}
				</a>
			</div>

			<div class="flex h-18 items-center justify-center outline outline-black"></div>
		{/each}
	</div>
{/each}
