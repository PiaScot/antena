<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import {
		userSettings,
		fontSizeClassMap
	} from '$lib/stores/userSettingsStore';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';
	import {
		setCategories,
		setSuperCategoryGroups
	} from '$lib/stores/categoryStore';
	import type { Category, Site, SuperCategoryGroup } from '$lib/types';
	import { setSites } from '$lib/stores/siteStore';

	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import type { Snippet } from 'svelte';

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

	// データをDBから受け取ったらストアにセットする
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

	$effect(() => {
		if (browser) {
			const root = document.documentElement;

			root.classList.toggle('dark', $userSettings.theme === 'dark');

			Object.values(fontSizeClassMap).forEach((className) => {
				root.classList.remove(className);
			});
			root.classList.add(fontSizeClassMap[$userSettings.fontSize]);
		}
	});
</script>

<div
	class="flex min-h-screen flex-col bg-gray-100 text-gray-800 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-200"
>
	<Header />
	<main class="w-full flex-1">
		{@render children()}
	</main>
	{#if !$page.url.pathname.startsWith('/articles/')}
		<Footer />
	{/if}
</div>
