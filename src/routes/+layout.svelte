<script lang="ts">
import "../app.css";

import { theme } from "$lib/stores/theme";
import { fontSize, fontSizeClassMap } from "$lib/stores/theme";
import Header from "$lib/components/Header.svelte";
import Footer from "$lib/components/Footer.svelte";
</script>

<svelte:head>
	{#if typeof document !== 'undefined'}
		{@const applyHtmlClasses = () => {
			const htmlEl = document.documentElement;

			if ($theme === 'dark') {
				htmlEl.classList.add('dark');
			} else {
				htmlEl.classList.remove('dark');
			}

			if (fontSizeClassMap && typeof fontSizeClassMap === 'object') {
				Object.values(fontSizeClassMap).forEach(cls => {
					if (typeof cls === 'string' && htmlEl.classList.contains(cls)) {
						htmlEl.classList.remove(cls);
					}
				});
			}
			if ($fontSize && fontSizeClassMap && fontSizeClassMap[$fontSize]) {
				htmlEl.classList.add(fontSizeClassMap[$fontSize]);
			}
		}}

		{$theme, $fontSize, (() => {
			if (typeof window !== 'undefined') {
				requestAnimationFrame(applyHtmlClasses);
			}
		})()}
	{/if}
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
	<Header />

	<main class="flex-1 w-full">
		<slot />
	</main>

	<Footer />
</div>
