<script lang="ts">
	import { page } from '$app/stores';
	import { isLayoutEditMode } from '$lib/stores/uiStore';
	import { ArrowLeft, LayoutDashboard, Check } from '@lucide/svelte';
	import type { Article } from '$lib/types';

	const { article } = $props<{ article: Article | null }>();
</script>

<div class="h-16"></div>

<header
	class="fixed top-0 left-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90"
>
	<nav class="flex w-full items-center justify-between">
		<div class="flex w-24 justify-start">
			{#if article || $page.url.pathname.startsWith('/edit/') || $page.url.pathname.startsWith('/feed')}
				<button
					onclick={() => history.back()}
					class="flex items-center gap-1 text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
				>
					<ArrowLeft class="h-6 w-6" />
					<span class="text-lg">戻る</span>
				</button>
			{/if}
		</div>

		<div class="truncate px-2 text-center">
			<span class="text-lg font-bold text-slate-800 dark:text-slate-100">
				{#if article}
					{article.title}
				{:else if $page.url.pathname === '/'}
					ホーム
				{:else if $page.url.pathname.startsWith('/feed')}
					フィード
				{:else if $page.url.pathname.startsWith('/bookmark')}
					ブックマーク
				{:else if $page.url.pathname === '/page'}
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

		<div class="flex w-24 justify-end">
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
</header>
