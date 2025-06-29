<script lang="ts">
import "../app.css";
import { browser } from "$app/environment";
import { userSettings, fontSizeClassMap } from "$lib/stores/userSettingsStore";
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

import { injectAnalytics } from "@vercel/analytics/sveltekit";

// FOR ANALYSIS
injectAnalytics();

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
	if (browser) {
		const root = document.documentElement;

		// 1. テーマ（ダークモード）のクラスを適用
		root.classList.toggle("dark", $userSettings.theme === "dark");

		// 2. フォントサイズのクラスを適用
		// まず既存のフォントサイズクラスをすべて削除
		Object.values(fontSizeClassMap).forEach((className) => {
			root.classList.remove(className);
		});
		// 現在の選択に応じたクラスを追加
		root.classList.add(fontSizeClassMap[$userSettings.fontSize]);
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
