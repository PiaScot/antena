<script lang="ts">
import { page } from "$app/stores";
import { Bookmark, BookmarkCheck } from "lucide-svelte";

export let article: any = null; // 記事詳細ページなら全データ

let currentPath = "";
let isBookmarked = false;
let bookmarkLoading = false;

// ページURL取得
$: currentPath = $page.url.pathname;

// 記事詳細ページだったらIDがあるか判定
function isArticleDetail() {
	// 例: /articles/123
	return /^\/articles\/\d+/.test(currentPath) && article?.id;
}

// --- ここが肝心！ ---
// articleが変わるたびに状態チェック
$: (async () => {
	if (isArticleDetail()) {
		try {
			const res = await fetch(`/api/bookmark?id=${article.id}`);
			const json = await res.json();
			isBookmarked = json.bookmarked ?? false;
		} catch {
			isBookmarked = false;
		}
	} else {
		isBookmarked = false;
	}
})();

// ブックマーク追加/削除
async function toggleBookmark() {
	if (!article?.id) return;
	bookmarkLoading = true;
	try {
		if (isBookmarked) {
			await fetch(`/api/bookmark?id=${article.id}`, { method: "DELETE" });
			isBookmarked = false;
		} else {
			await fetch(`/api/bookmark`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(article),
			});
			isBookmarked = true;
		}
	} finally {
		bookmarkLoading = false;
	}
}
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
      <a href="/edit?from=home" class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-xl">編集</a>
      <span class="text-xl font-bold text-slate-800 dark:text-slate-100 text-center flex-1">カテゴリ一覧</span>
      <div class="w-8"></div>
    {:else if currentPath === "/page"}
      <a href="/edit?from=page" class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-xl">編集</a>
      <span class="text-xl font-bold text-slate-800 dark:text-slate-100 text-center flex-1">カテゴリ一覧</span>
      <div class="w-8"></div>
    {:else if isArticleDetail()}
      <button
        on:click={() => history.back()}
        class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-xl"
      >
        戻る
      </button>
      <span class="text-xl font-bold text-slate-800 dark:text-slate-100 text-center flex-1">記事詳細</span>
      <button
        class="ml-auto text-emerald-500 dark:text-emerald-300 text-2xl p-1"
        aria-label="ブックマーク"
        disabled={bookmarkLoading}
        on:click={toggleBookmark}
      >
        {#if isBookmarked}
          <BookmarkCheck class="w-7 h-7" />
        {:else}
          <Bookmark class="w-7 h-7" />
        {/if}
      </button>
    {:else}
      <button
        on:click={() => history.back()}
        class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-xl"
      >
        戻る
      </button>
      <span class="text-xl font-bold text-slate-800 dark:text-slate-100 text-center flex-1">カテゴリ一覧</span>
      <div class="w-8"></div>
    {/if}
  </nav>
</header>
