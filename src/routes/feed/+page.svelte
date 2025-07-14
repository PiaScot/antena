<script lang="ts">
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import type { PageData } from './$types';
	import { GalleryHorizontalEnd, List } from '@lucide/svelte';
	import type { ArticleFeedItem } from '$lib/types';

	const { data } = $props<{ data: PageData }>();
	const articlesPromise = data.streamed.articles as Promise<ArticleFeedItem[]>;

	let cardStyle = $state<'image' | 'simple'>('image');
</script>

<div
	class="ticky top-16 z-10 mx-auto max-w-2xl bg-emerald-400/10 py-1 backdrop-blur-sm dark:bg-slate-900/90"
>
	<div class="flex items-center justify-center gap-4 py-2">
		<button
			onclick={() => (cardStyle = 'image')}
			class="flex items-center justify-center rounded-full border-2 p-2 transition"
			aria-label="サムネイル表示"
			aria-pressed={cardStyle === 'image'}
			class:border-emerald-400={cardStyle === 'image'}
			class:border-transparent={cardStyle !== 'image'}
			class:hover:border-emerald-400={cardStyle !== 'image'}
			class:text-emerald-400={cardStyle === 'image'}
			class:text-slate-400={cardStyle !== 'image'}
		>
			<GalleryHorizontalEnd class="h-6 w-6" />
		</button>
		<button
			onclick={() => (cardStyle = 'simple')}
			class="flex items-center justify-center rounded-full border-2 p-2 transition"
			aria-label="リスト表示"
			aria-pressed={cardStyle === 'simple'}
			class:border-emerald-400={cardStyle === 'simple'}
			class:border-transparent={cardStyle !== 'simple'}
			class:hover:border-emerald-400={cardStyle !== 'simple'}
			class:text-emerald-400={cardStyle === 'simple'}
			class:text-slate-400={cardStyle !== 'simple'}
		>
			<List class="h-6 w-6" />
		</button>
	</div>
</div>

<div class="mx-auto max-w-2xl py-1">
	{#await articlesPromise}
		<p class="py-10 text-center text-slate-600 dark:text-slate-300">
			記事を取得中...
		</p>
	{:then articles}
		{#if articles.length === 0}
			<p class="text-center text-slate-600 dark:text-slate-300">
				表示する記事がありません
			</p>
		{:else}
			<div class="mx-auto w-full max-w-screen-lg px-1 sm:px-2">
				<div class="space-y-1">
					{#each articles as article (article.url)}
						<ArticleCard {article} withImage={cardStyle === 'image'} />
					{/each}
				</div>
			</div>
		{/if}
	{:catch error}
		<p class="text-center text-red-500">
			記事の取得に失敗しました: {error.message}
		</p>
	{/await}
</div>
