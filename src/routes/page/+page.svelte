<!-- src/routes/page/+page.svelte -->
<script lang="ts">
import { onMount, onDestroy, tick } from "svelte";
import { beforeNavigate } from "$app/navigation";
import { page } from "$app/stores";
import { get } from "svelte/store";
import SiteCard from "$lib/components/SiteCard.svelte";
import type { Site } from "$lib/types";

// スクロール位置を保持するストア（キーは href）
import { scrollPositions } from "$lib/stores/scrollStore";

let sites: Site[] = [];
let loading = true;
let error: string | null = null;

let currentFullUrl: string; // 現在のページの完全なURLを保持 (例: /feed?category=tech)
let pageStoreUnsubscribe: () => void; // $pageストアの購読解除用関数
let beforeNavigateUnsubscribe: () => void; // beforeNavigateの購読解除用関数

// $pageストアを購読し、現在のページのURLが変わるたびにcurrentFullUrlを更新
pageStoreUnsubscribe = page.subscribe((p) => {
	currentFullUrl = p.url.href; // hrefにはパスとクエリパラメータが含まれる
});

onMount(async () => {
	try {
		const res = await fetch("/api/page");
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json = await res.json();
		sites = json.sites;
	} catch (e: any) {
		console.error("サイト一覧取得エラー:", e);
		error = e.message;
	} finally {
		loading = false;
		// DOM 更新後に一度待ってから復元
		await tick();
		const posMap = get(scrollPositions);
		const y = posMap[currentFullUrl];
		if (typeof y === "number") {
			window.scrollTo(0, y);
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

{#if loading}
  <p class="text-white text-center">読み込み中...</p>
{:else if error}
  <p class="text-red-400 text-center">エラー: {error}</p>
{:else}
  <div class="p-2 grid grid-cols-2 gap-4">
    {#each sites as site}
      <SiteCard {site} />
    {/each}
  </div>
{/if}
