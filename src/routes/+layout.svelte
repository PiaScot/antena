<script lang="ts">
	// ★ 変更点: browser のインポートは不要になります
	import '../app.css';
	import { userSettings } from '$lib/stores/userSettingsStore';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ArticleModal from '$lib/components/ArticleModal.svelte';
	import { page } from '$app/stores';
	import {
		setCategories,
		setSuperCategoryGroups
	} from '$lib/stores/categoryStore';
	import type { Category, Site, SuperCategoryGroup } from '$lib/types';
	import type { Snippet } from 'svelte';
	import { setSites } from '$lib/stores/siteStore';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { styleManager } from '$lib/actions/styleManager';

	injectAnalytics();

	interface Props {
		data: {
			sites: Site[];
			categories: Category[];
			superCategoryGroups: SuperCategoryGroup[];
			error?: string;
		};
		children: Snippet;
	}

	const { data, children }: Props = $props();

	$effect(() => {
		if (data.categories) {
			setCategories(data.categories);
		}
		if (data.superCategoryGroups) {
			setSuperCategoryGroups(data.superCategoryGroups);
		}
		if (data.sites) {
			setSites(data.sites);
		}
	});

	const article = $derived.by(() => {
		const currentPage = $page;
		return currentPage.url.pathname.startsWith('/articles/') &&
			currentPage.data?.article
			? currentPage.data.article
			: null;
	});
</script>

<svelte:head>
	<script>
		if (
			localStorage.theme === 'dark' ||
			(!('theme' in localStorage) &&
				window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	</script>
</svelte:head>

<div
	use:styleManager
	class="flex h-screen flex-col overflow-hidden bg-gray-100 text-gray-800 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-200"
>
	<Header {article} />
	<main class="w-full flex-1 overflow-y-auto">
		{@render children()}
	</main>
	{#if !$page.url.pathname.startsWith('/articles/')}
		<Footer />
	{/if}
	<ArticleModal />
</div>
