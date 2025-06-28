<script lang="ts">
import "../app.css";
import { theme, fontSize, fontSizeClassMap } from "$lib/stores/theme";
import Header from "$lib/components/Header.svelte";
import ArticleModal from "$lib/components/ArticleModal.svelte";
import Footer from "$lib/components/Footer.svelte";
import { page } from "$app/stores";
import {
	setCategories,
	setSuperCategoryGroups,
} from "$lib/stores/categoryStore";
import type { Category, Site, SuperCategoryGroup } from "$lib/types";
import { setSites } from "$lib/stores/siteStore";
import type { SvelteComponent } from "svelte";

const props = $props<{
	data: {
		sites: Site[];
		categories: Category[];
		superCategoryGroups: SuperCategoryGroup[];
		error?: string;
	};
	children: () => SvelteComponent;
}>();

const data = props.data;
const children = props.children;

if (data.categories) {
	setCategories(data.categories);
}

if (data.superCategoryGroups) {
	setSuperCategoryGroups(data.superCategoryGroups);
}

if (data.sites) {
	setSites(data.sites);
}

const article = $derived(() => {
	const currentPage = $page;
	return currentPage.url.pathname.startsWith("/articles/") &&
		currentPage.data?.article
		? currentPage.data.article
		: null;
});

$effect(() => {
	const currentTheme = $theme;
	const currentFontSize = $fontSize;

	if (typeof document !== "undefined") {
		const htmlEl = document.documentElement;
		htmlEl.classList.toggle("dark", currentTheme === "dark");
		for (const cls of Object.values(fontSizeClassMap)) {
			htmlEl.classList.remove(cls);
		}
		const sizeClass = fontSizeClassMap[currentFontSize];
		if (sizeClass) {
			htmlEl.classList.add(sizeClass);
		}
	}
});
</script>

<div
	class="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300"
>
	<Header {article} />
	<main class="flex-1 w-full">
		{@render children()}
	</main>
	{#if !$page.url.pathname.startsWith("/articles/")}
		<Footer />
	{/if}
  <ArticleModal />
</div>
