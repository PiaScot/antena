<script lang="ts">
import { page } from "$app/stores";

// 現在のパスをリアクティブに取得
$: currentPath = $page.url.pathname;
</script>

<div class="m-8"></div>

<header
  class="
    fixed left-0 z-20 flex h-16 w-full items-center justify-between
    px-4 py-4 
		bg-white/80 dark:bg-zinc-900/80
		border-t border-zinc-300 dark:border-zinc-700
		backdrop-blur-sm
    outline-black outline
    "
>
	<nav class="flex w-full items-center justify-between">
		{#if currentPath === "/"}
			<a href="/edit" class="dark:text-amber-800 text-zinc-700 hover:text-gray-300 transition-colors text-xl">編集</a>
			<span class="text-xl text-white text-center flex-1">カテゴリ一覧</span>
			<div class="w-8"></div>
		{:else}
			<button on:click={() => history.back()} class="dark:text-amber-800 text-zinc-700 hover:text-gray-300 transition-colors text-xl">
				戻る
			</button>
			<span class="dark:text-amber-800 text-zinc-700 text-center flex-1 text-xl">カテゴリ一覧</span>
			<a href="/edit" class="dark:text-amber-800 text-zinc-700 hover:text-gray-300 transition-colors text-right text-xl">編集</a>
		{/if}
	</nav>
</header>

