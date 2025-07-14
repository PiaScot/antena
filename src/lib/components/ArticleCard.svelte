<script lang="ts">
	import { activeArticle } from '$lib/stores/activeArticle';
	import { LoaderCircle } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import { readArticles } from '$lib/stores/readArticlesStore';
	import type { ArticleFeedItem } from '$lib/types';

	const { article, withImage = false } = $props<{
		article: ArticleFeedItem;
		withImage?: boolean;
	}>();

	let isLoading = $state(false);
	const formattedDate = dayjs(article.pub_date).format('YYYY/MM/DD HH:mm');

	const isRead = $derived($readArticles.has(article.url));

	async function handleClick() {
		readArticles.markAsRead(article.url);

		if (article.site?.scrape_options?.display_mode === 'direct_link') {
			window.open(article.url, '_blank', 'noopener,noreferrer');
			return;
		}
		isLoading = true;
		try {
			const res = await fetch(`/api/articles/${article.id}`);
			if (!res.ok) {
				throw new Error(`Failed to fetch article content: ${res.statusText}`);
			}
			const fullArticleData = await res.json();
			activeArticle.set(fullArticleData);
		} catch (err) {
			console.error('Failed to open article modal:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
	class="group relative block w-full rounded-lg border p-1 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 {isRead
		? 'bg-slate-100 dark:bg-slate-700'
		: 'bg-white dark:bg-slate-800'}"
>
	<div class="flex items-start gap-4">
		{#if withImage}
			<img
				src={article.thumbnail
					? `/api/image-proxy?url=${encodeURIComponent(article.thumbnail)}`
					: '/favicon.png'}
				alt="サムネイル"
				class="h-20 w-20 flex-shrink-0 rounded-lg border-slate-200 object-cover dark:border-slate-600"
				loading="lazy"
			/>
		{/if}
		<div class="min-w-0 flex-1">
			<div
				class="mb-2 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400"
			>
				<span class="flex-shrink-0">{formattedDate}</span>
				{#if article.site?.title}
					<span
						class="min-w-0 flex-1 truncate text-right font-medium text-emerald-700 group-hover:underline dark:text-emerald-400"
						title={article.site.title}
					>
						{article.site.title}
					</span>
				{/if}
			</div>

			<h3
				class="relative line-clamp-2 min-h-[3rem] pl-4 text-base font-bold text-slate-800 dark:text-slate-100"
				title={article.title}
			>
				{#if !isRead}
					<span
						class="absolute top-1.5 left-0 h-2 w-2 rounded-full bg-emerald-500"
						title="未読"
					></span>
				{/if}
				{article.title || '記事タイトル'}
			</h3>
		</div>
	</div>

	{#if isLoading}
		<div
			class="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-800/50"
		>
			<LoaderCircle class="h-8 w-8 animate-spin text-white" />
		</div>
	{/if}
</div>
