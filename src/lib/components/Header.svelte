<script lang="ts">
	import { page } from '$app/stores';
	import { isLayoutEditMode } from '$lib/stores/uiStore';
	import { pageContext } from '$lib/stores/pageContextStore';
	import {
		ArrowLeft,
		LayoutDashboard,
		Check,
		Bookmark,
		BookmarkCheck, // ブックマーク済みアイコン
		LoaderCircle,
		X,
		Home,
		ExternalLink
	} from '@lucide/svelte';

	let article = $derived($pageContext.article);
	let isBookmarked = $derived($pageContext.isBookmarked);
	let bookmarkLoading = $state(false);

	async function toggleBookmark() {
		if (!article?.id) return;
		bookmarkLoading = true;
		try {
			const method = isBookmarked ? 'DELETE' : 'POST';
			const body = isBookmarked
				? undefined
				: JSON.stringify({ articleId: article.id });
			const url = isBookmarked
				? `/api/bookmark?id=${article.id}`
				: '/api/bookmark';
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body
			});
			if (response.ok) {
				pageContext.update((ctx) => ({
					...ctx,
					isBookmarked: !ctx.isBookmarked
				}));
			}
		} catch (error) {
			console.error('Error toggling bookmark:', error);
		} finally {
			bookmarkLoading = false;
		}
	}
</script>

<div class="h-16"></div>
<header
	class="fixed top-0 left-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90"
>
	{#if article}
		<div class="flex w-full flex-col gap-2">
			<div class="flex items-center justify-between gap-3">
				<button
					onclick={() => history.back()}
					aria-label="閉じる"
					class="rounded-full p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
				>
					<X class="h-5 w-5" />
				</button>
				<h1
					class="flex-1 truncate text-center text-base font-bold text-slate-800 dark:text-slate-100"
					title={article.title}
				>
					{article.title}
				</h1>
				<button
					class="flex h-8 w-8 items-center justify-center"
					aria-label={isBookmarked
						? 'ブックマークから削除'
						: 'ブックマークに追加'}
					disabled={bookmarkLoading}
					onclick={toggleBookmark}
				>
					{#if bookmarkLoading}
						<LoaderCircle class="h-6 w-6 animate-spin text-slate-400" />
					{:else if isBookmarked}
						<BookmarkCheck class="h-6 w-6 text-emerald-500" />
					{:else}
						<Bookmark class="h-6 w-6 text-slate-400" />
					{/if}
				</button>
			</div>
			<div class="flex items-center justify-between text-xs">
				{#if article.site?.title}
					<a
						href={`/feed?site=${article.site_id}`}
						class="flex items-center gap-1.5 text-slate-500 hover:underline dark:text-slate-400"
					>
						<Home class="h-3 w-3" />
						<span>{article.site.title}</span>
					</a>
				{/if}
				<a
					href={article.url}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-1.5 text-slate-500 hover:underline dark:text-slate-400"
				>
					<span>元記事を開く</span>
					<ExternalLink class="h-3 w-3" />
				</a>
			</div>
		</div>
	{:else}
		<nav class="flex h-full w-full items-center">
			<div class="flex w-24 shrink-0 justify-start">
				{#if $page.url.pathname.startsWith('/edit/') || $page.url.pathname.startsWith('/feed')}
					<button
						onclick={() => history.back()}
						class="flex items-center gap-1 text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
					>
						<ArrowLeft class="h-6 w-6" />
						<span class="text-lg">戻る</span>
					</button>
				{/if}
			</div>
			<div class="flex-1 truncate px-2 text-center">
				<span class="text-lg font-bold text-slate-800 dark:text-slate-100">
					{#if $page.url.pathname === '/'}
						ホーム
					{:else if $page.url.pathname.startsWith('/feed')}
						フィード
					{:else if $page.url.pathname.startsWith('/bookmark')}
						ブックマーク
					{:else if $page.url.pathname.startsWith('/page')}
						サイト一覧
					{:else if $page.url.pathname.startsWith('/edit/home')}
						レイアウト管理
					{:else if $page.url.pathname.startsWith('/edit/page')}
						サイト管理
					{:else}
						カテゴリ一覧
					{/if}
				</span>
			</div>
			<div class="flex w-24 shrink-0 justify-end">
				{#if $page.url.pathname === '/'}
					<button
						class="flex items-center gap-1 font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
						onclick={() => isLayoutEditMode.update((current) => !current)}
					>
						{#if $isLayoutEditMode}
							<Check class="h-5 w-5" />
							<span class="text-lg">完了</span>
						{:else}
							<LayoutDashboard class="h-5 w-5" />
							<span class="text-lg">編集</span>
						{/if}
					</button>
				{/if}
			</div>
		</nav>
	{/if}
</header>
