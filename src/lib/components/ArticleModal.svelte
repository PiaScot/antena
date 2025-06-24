<script lang="ts">
import { activeArticle } from "$lib/stores/activeArticle";
import {
	Bookmark,
	BookmarkCheck,
	ExternalLink,
	Home,
	LoaderCircle,
	ArrowLeft,
	X,
} from "@lucide/svelte";
import { fade, fly } from "svelte/transition";
import { quintOut } from "svelte/easing";
import type { FullArticleData, ArticleFeedItem } from "$lib/types";

let currentArticle = $derived($activeArticle as FullArticleData | null);
let shadowHostElement = $state<HTMLDivElement | undefined>();
let isBookmarked = $state(false);
let bookmarkLoading = $state(false);
let showModal = $state(false);

$effect(() => {
	if (currentArticle) {
		showModal = true;
		checkBookmarkStatus(currentArticle);

		history.pushState({ modalOpen: true }, "");
		const handlePopState = () => closeModal();
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeModal();
		};
		window.addEventListener("popstate", handlePopState);
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("popstate", handlePopState);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}
});

$effect(() => {
	if (shadowHostElement && currentArticle?.content) {
		const shadowRoot =
			shadowHostElement.shadowRoot ||
			shadowHostElement.attachShadow({ mode: "open" });
		const forcedStyle = document.createElement("style");
		forcedStyle.textContent =
			":host { color: initial; background: white; } figure { margin: 0; }";

		shadowRoot.innerHTML = "";
		shadowRoot.appendChild(forcedStyle);

		const parser = new DOMParser();
		const doc = parser.parseFromString(currentArticle.content, "text/html");
		doc.head
			.querySelectorAll('style, link[rel="stylesheet"]')
			.forEach((node) => {
				shadowRoot.appendChild(node.cloneNode(true));
			});
		shadowRoot.append(...doc.body.childNodes);
	} else if (shadowHostElement?.shadowRoot) {
		shadowHostElement.shadowRoot.innerHTML = "";
	}
});

async function checkBookmarkStatus(article: FullArticleData | ArticleFeedItem) {
	if (!article.id) return;
	bookmarkLoading = true;
	try {
		const res = await fetch(`/api/bookmark?id=${article.id}`);
		if (res.ok) isBookmarked = (await res.json()).isBookmarked ?? false;
	} catch (err) {
		console.error("Failed to check bookmark status:", err);
	} finally {
		bookmarkLoading = false;
	}
}

async function toggleBookmark() {
	if (!currentArticle?.id) return;
	bookmarkLoading = true;
	try {
		const method = isBookmarked ? "DELETE" : "POST";
		const body = isBookmarked ? undefined : JSON.stringify(currentArticle);
		const url = isBookmarked
			? `/api/bookmark?id=${currentArticle.id}`
			: "/api/bookmark";
		const response = await fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			body,
		});
		if (response.ok) isBookmarked = !isBookmarked;
	} catch (error) {
		console.error("Error toggling bookmark:", error);
	} finally {
		bookmarkLoading = false;
	}
}

function closeModal() {
	showModal = false;
	setTimeout(() => {
		activeArticle.set(null);
	}, 300);
}
</script>

{#if currentArticle}
	{#if showModal}
		<div
			transition:fade={{ duration: 300 }}
			class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
			onclick={closeModal}
			role="presentation"
		></div>
	{/if}

	<div
		class="fixed inset-0 z-50 flex justify-end"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeModal();
		}}
		role="presentation"
	>
		<div
			class="bg-white dark:bg-slate-900 h-full w-screen shadow-2xl flex flex-col sm:w-full sm:max-w-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			transition:fly={{ x: '100%', duration: 300, easing: quintOut }}
			onclick={(event) => event.stopPropagation()}
		>
			<header
				class="flex flex-col gap-2 p-1 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 flex-shrink-0"
			>
				<div class="flex items-center justify-between gap-3">
					<button
						onclick={closeModal}
						aria-label="閉じる"
						class="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
					>
						<X class="w-5 h-5" />
					</button>
					<h2
						id="modal-title"
						class="text-base font-bold truncate text-slate-800 dark:text-slate-100 text-center flex-1"
						title={currentArticle.title}
					>
						{currentArticle.title}
					</h2>
					<button
						class="flex items-center justify-center w-8 h-8"
						aria-label="ブックマーク"
						disabled={bookmarkLoading}
						onclick={toggleBookmark}
					>
						{#if bookmarkLoading}
							<LoaderCircle class="w-6 h-6 animate-spin text-slate-400" />
						{:else if isBookmarked}
							<BookmarkCheck class="w-6 h-6 text-emerald-500" />
						{:else}
							<Bookmark class="w-6 h-6 text-slate-400" />
						{/if}
					</button>
				</div>
				<div class="flex items-center justify-between text-xs">
					{#if currentArticle.site}
						<a
							href={`/feed?site=${currentArticle.site_id}`}
							onclick={closeModal}
							class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:underline"
						>
							<Home class="w-3 h-3" />
							<span>{currentArticle.site.title}</span>
						</a>
					{/if}
					<a
						href={currentArticle.url}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:underline"
					>
						<span>元記事を開く</span>
						<ExternalLink class="w-3 h-3" />
					</a>
				</div>
			</header>
      <div class="overflow-y-auto flex-1">
        {#if currentArticle.site?.scrape_options?.display_mode === 'direct_link'}
          <iframe
            src={currentArticle.url}
            class="w-full h-full border-0"
            title={currentArticle.title}
            sandbox="allow-scripts allow-same-origin"
          >
            お使いのブラウザは iframe をサポートしていません。
          </iframe>
        {:else}
          <div class="p-4" bind:this={shadowHostElement} />
        {/if}
      </div>
		</div>
	</div>
{/if}
