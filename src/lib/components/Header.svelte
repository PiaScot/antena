<script lang="ts">
import { page } from "$app/stores";
import { Bookmark, BookmarkCheck } from "@lucide/svelte";
import type { ArticleWithSiteName } from "$lib/types";

const { article } = $props<{ article: ArticleWithSiteName | null }>();
let isBookmarked = $state(false);
let bookmarkLoading = $state(false);

// ★★★ 修正点: `$props`の値`article`を`article()`として呼び出す ★★★
const isArticleDetail = $derived(
	/^\/articles\/\d+/.test($page.url.pathname) && article() != null,
);

$effect(() => {
	// ★★★ 修正点: `article`を`article()`として呼び出す ★★★
	const currentArticle = article();
	if (isArticleDetail && currentArticle?.id) {
		const checkStatus = async () => {
			bookmarkLoading = true;
			try {
				// ★★★ 修正点: IDも`currentArticle.id`から取得 ★★★
				const res = await fetch(`/api/bookmark?id=${currentArticle.id}`);
				if (res.ok) {
					const json = await res.json();
					isBookmarked = json.isBookmarked ?? false;
				} else {
					isBookmarked = false;
				}
			} catch (err) {
				console.error("Failed to check bookmark status:", err);
				isBookmarked = false;
			} finally {
				bookmarkLoading = false;
			}
		};
		checkStatus();
	} else {
		isBookmarked = false;
	}
});

async function toggleBookmark() {
	// ★★★ 修正点: `article`を`article()`として呼び出す ★★★
	const currentArticle = article();
	if (!currentArticle?.id) return;

	bookmarkLoading = true;
	const currentBookmarkState = isBookmarked;

	try {
		let response: Response;
		if (currentBookmarkState) {
			// ★★★ 修正点: IDも`currentArticle.id`から取得 ★★★
			response = await fetch(`/api/bookmark?id=${currentArticle.id}`, {
				method: "DELETE",
			});
		} else {
			// ★★★ 修正点: bodyに渡すのも`currentArticle`にする ★★★
			response = await fetch("/api/bookmark", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(currentArticle),
			});
		}

		if (response.ok) {
			isBookmarked = !currentBookmarkState;
		} else {
			console.error("Failed to toggle bookmark", await response.text());
		}
	} catch (error) {
		console.error("Error toggling bookmark:", error);
	} finally {
		bookmarkLoading = false;
	}
}
</script>

<div class="m-8"></div>
<header
	class="
    fixed left-0 top-0 z-20 flex h-16 w-full items-center justify-between
    px-4 py-4
    bg-slate-50/90 dark:bg-slate-900/90
    border-b border-slate-200 dark:border-slate-700
    backdrop-blur-sm
  "
>
	<nav class="flex w-full items-center justify-between">
		{#if $page.url.pathname === "/"}
			<a href="/edit/home" class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-xl">編集</a>
			<span class="text-xl font-bold text-slate-800 dark:text-slate-100 text-center flex-1">カテゴリ一覧</span>
			<div class="w-[44px]"></div>
		{:else if $page.url.pathname === "/page"}
			<a href="/edit/page" class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-xl">編集</a>
			<span class="text-xl font-bold text-slate-800 dark:text-slate-100 text-center flex-1">カテゴリ一覧</span>
			<div class="w-8"></div>
		{:else if isArticleDetail}
			<button
				onclick={() => history.back()}
				class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-xl"
			>
				戻る
			</button>
			<span class="text-xl font-bold text-slate-800 dark:text-slate-100 text-center flex-1">記事詳細</span>
			<button
				class="ml-auto text-emerald-500 dark:text-emerald-300 text-2xl p-1"
				aria-label="ブックマーク"
				disabled={bookmarkLoading}
				onclick={toggleBookmark}
			>
				{#if bookmarkLoading}
					<div class="w-7 h-7 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
				{:else if isBookmarked}
					<BookmarkCheck class="w-7 h-7" />
				{:else}
					<Bookmark class="w-7 h-7" />
				{/if}
			</button>
		{:else}
			<button
				onclick={() => history.back()}
				class="dark:text-emerald-400 text-emerald-700 hover:text-emerald-600 transition-colors text-xl"
			>
				戻る
			</button>
			<span class="text-xl font-bold text-slate-800 dark:text-slate-100 text-center flex-1">カテゴリ一覧</span>
			<div class="w-[44px]"></div>
		{/if}
	</nav>
</header>
