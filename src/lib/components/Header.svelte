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
    bg-slate-50/90 dark:bg-slate-900/90
    border-b border-slate-200 dark:border-slate-700
    backdrop-blur-sm
  "
>
  <nav class="flex w-full items-center justify-between">
    {#if currentPath === "/"}
      <a href="/edit" class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-xl">編集</a>
      <span class="text-xl font-bold text-slate-800 dark:text-slate-100 text-center flex-1">カテゴリ一覧</span>
      <div class="w-8"></div>
    {:else}
      <button on:click={() => history.back()} class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-xl">
        戻る
      </button>
      <span class="text-xl font-bold text-slate-800 dark:text-slate-100 text-center flex-1">カテゴリ一覧</span>
      <a href="/edit" class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-right text-xl">編集</a>
    {/if}
  </nav>
</header>
