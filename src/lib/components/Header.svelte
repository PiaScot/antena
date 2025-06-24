<script lang="ts">
import { page } from "$app/stores";
import { ArrowLeft, Pencil } from "@lucide/svelte";
</script>

<div class="h-16" />

<header
	class="fixed left-0 top-0 z-30 flex h-16 w-full items-center justify-between px-4 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700 backdrop-blur-sm"
>
	<nav class="flex w-full items-center justify-between">
		<div class="w-24 flex justify-start">
			{#if $page.url.pathname === '/'}
				<a href="/edit/home" class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors" aria-label="編集">
					<Pencil class="w-5 h-5" />
					<span class="text-lg">編集</span>
				</a>
			{:else if $page.url.pathname === '/page'}
				<a href="/edit/page" class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors" aria-label="編集">
					<Pencil class="w-5 h-5" />
					<span class="text-lg">編集</span>
				</a>
			{:else if $page.url.pathname.startsWith('/edit/') || $page.url.pathname.startsWith('/feed')}
				<button onclick={() => history.back()} class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
					<ArrowLeft class="w-6 h-6" />
					<span class="text-lg">戻る</span>
				</button>
			{/if}
		</div>

		<span class="text-lg font-bold text-slate-800 dark:text-slate-100 text-center">
			{#if $page.url.pathname.startsWith('/feed')}
				フィード
			{:else if $page.url.pathname.startsWith('/bookmark')}
				ブックマーク
			{:else if $page.url.pathname === '/page'}
				サイト一覧
			{:else if $page.url.pathname.startsWith('/edit/home')}
				ホーム画面編集
			{:else if $page.url.pathname.startsWith('/edit/page')}
				サイト管理
			{:else}
				カテゴリ一覧
			{/if}
		</span>

		<div class="w-24"></div>
	</nav>
</header>
