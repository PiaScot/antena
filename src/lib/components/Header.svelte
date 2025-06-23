<script lang="ts">
import { page } from "$app/stores";
import { Pencil } from "@lucide/svelte";
</script>

<div class="h-16"></div>

<header
	class="fixed left-0 top-0 z-30 flex h-16 w-full items-center justify-between px-4 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700 backdrop-blur-sm"
>
	<nav class="flex w-full items-center justify-between">
		<div class="w-[60px]">
			{#if $page.url.pathname === '/' || $page.url.pathname === '/page'}
				<a
					href={$page.url.pathname === '/' ? '/edit/home' : '/edit/page'}
					class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
					aria-label="編集"
				>
					<Pencil class="w-5 h-5" />
					<span class="text-lg">編集</span>
				</a>
			{/if}
		</div>

		<span class="text-lg font-bold text-slate-800 dark:text-slate-100">
			{#if $page.url.pathname.startsWith('/feed')}
				フィード
			{:else if $page.url.pathname.startsWith('/bookmark')}
				ブックマーク
			{:else}
				カテゴリ一覧
			{/if}
		</span>

		<div class="w-[60px]"></div>
	</nav>
</header>
