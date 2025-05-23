<!-- src/routes/feed/+page.svelte -->
<script lang="ts">
import { onMount, onDestroy, tick } from "svelte";
import { beforeNavigate } from "$app/navigation";
import { page } from "$app/stores";
import { get } from "svelte/store";
import ArticleCard from "$lib/components/ArticleCard.svelte";
import type { Article } from "$lib/types";

// スクロール位置を保持するストア (キーは href)
import { scrollPositions } from "$lib/stores/scrollStore";

let articles: Article[] = [];
let loading = true;
let errorMessage: string | null = null;

// クエリから取ってくる値
let categoryFromQuery = "all";
let siteFromQuery: string | null = null;

let currentFullUrl: string; // 現在のページの完全なURLを保持 (例: /feed?category=tech)
let pageStoreUnsubscribe: () => void; // $pageストアの購読解除用関数
let beforeNavigateUnsubscribe: () => void; // beforeNavigateの購読解除用関数

// $pageストアを購読し、現在のページのURLが変わるたびにcurrentFullUrlを更新
pageStoreUnsubscribe = page.subscribe((p) => {
	currentFullUrl = p.url.href; // hrefにはパスとクエリパラメータが含まれる
});

onMount(async () => {
	// query 取得
	const params = new URLSearchParams(window.location.search);
	categoryFromQuery = params.get("category") || "all";
	siteFromQuery = params.get("site");

	loading = true;
	errorMessage = null;

	try {
		let res: Response;

		// site パラメータがあれば優先、なければ category
		if (siteFromQuery) {
			res = await fetch(`/api/feed?site=${siteFromQuery}`);
		} else {
			res = await fetch(`/api/feed?category=${categoryFromQuery}`);
		}

		if (!res.ok) {
			const errData = await res
				.json()
				.catch(() => ({ message: res.statusText }));
			throw new Error(errData.message || `HTTP error! status: ${res.status}`);
		}

		const json = await res.json();
		articles = json.articles || [];
	} catch (e: any) {
		console.error("読み込みエラー:", e);
		errorMessage = e.message || "記事の読み込み中にエラーが発生しました。";
	} finally {
		loading = false;
		// DOMの更新が完了するのを待つ
		await tick();

		// 3. スクロール位置の復元
		// $scrollPositions ストアから現在のURLに対応するスクロール位置を取得
		const savedScrollY = $scrollPositions[currentFullUrl];
		if (typeof savedScrollY === "number") {
			// console.log(Restoring scroll for ${currentFullUrl} to ${savedScrollY});
			window.scrollTo(0, savedScrollY);

			// オプション: 一度復元したらストアから削除する場合
			// scrollPositions.update(positions => {
			//   delete positions[currentFullUrl];
			//   return positions;
			// });
		}
	}
});

// 2. スクロール位置の保存
// このページから離れる直前に呼び出される
beforeNavigateUnsubscribe = beforeNavigate(({ from, to, type }) => {
	// from が存在し、かつ from.url.href が現在のページのURLと一致する場合に保存
	// (つまり、このページから実際に離脱しようとしている場合)
	if (from && from.url.href === currentFullUrl) {
		// to が存在し、かつ移動先が現在のページと異なる場合
		// または to がなく、'leave' タイプの場合 (外部サイトへの遷移など)
		if ((to && to.url.href !== currentFullUrl) || (!to && type === "leave")) {
			const scrollY = window.scrollY;
			// console.log(Saving scroll for ${currentFullUrl} as ${scrollY});
			scrollPositions.update((positions) => {
				positions[currentFullUrl] = scrollY;
				return positions;
			});
		}
	}
});

onDestroy(() => {
	// コンポーネントが破棄される際に、購読を解除してメモリリークを防ぐ
	if (pageStoreUnsubscribe) {
		pageStoreUnsubscribe();
	}
	if (beforeNavigateUnsubscribe) {
		beforeNavigateUnsubscribe();
	}
});
</script>

<div class="py-1">
  {#if loading}
    <p class="text-center text-slate-600 dark:text-slate-300">読み込み中...</p>
  {:else if errorMessage}
    <p class="text-center text-red-600 dark:text-red-400">エラー: {errorMessage}</p>
  {:else if articles.length === 0}
    <p class="text-center text-slate-600 dark:text-slate-300">記事が見つかりません。</p>
  {:else}
    <div class="mx-auto w-full max-w-screen-lg px-1 sm:px-2">
      <div class="space-y-1">
        {#each articles as article (article.url)}
          <ArticleCard {article} />
        {/each}
      </div>
    </div>
  {/if}
</div>
