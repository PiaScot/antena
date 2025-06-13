<script lang="ts">
import {
	fontSize,
	type FontSizeValue,
	fontSizeClassMap,
	theme,
} from "$lib/stores/theme";

const sizes: { label: string; value: FontSizeValue }[] = [
	{ label: "小", value: "small" },
	{ label: "中", value: "medium" },
	{ label: "大", value: "large" },
];
</script>

<section class="pt-4 p-2">
	<div
		class="p-2 w-full flex items-center justify-between bg-gray-100 dark:bg-gray-600 py-4 border shadow-sm mb-4"
	>
		<span class="text-gray-900 dark:text-gray-100 text-base">ダークモード</span>
		<label class="relative inline-flex items-center cursor-pointer">
			<input
				type="checkbox"
				class="sr-only peer"
        checked={$theme === "dark"}
				on:change={() => theme.set($theme === "dark" ? "light" : "dark")}
			/>
			<div
				class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 dark:bg-gray-600 peer-checked:bg-emerald-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
			></div>
		</label>
	</div>

	<div
		class="p-2 w-full flex items-center justify-between bg-white dark:bg-gray-800 py-4 border shadow-sm mb-4"
	>
		<span class="text-gray-900 dark:text-gray-100 text-base">文字サイズ</span>
		<div class="flex gap-2">
			{#each sizes as size}
				<button
					type="button"
					class="px-3 py-1 rounded-lg border text-sm transition-colors
						{ $fontSize === size.value
							? 'bg-emerald-500 text-white'
							: 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
						}"
					on:click={() => fontSize.set(size.value)}
				>
					{size.label}
				</button>
			{/each}
		</div>
	</div>
</section>
