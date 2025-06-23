<script lang="ts">
import { activeArticle } from "$lib/stores/activeArticle";
import {
	Bookmark,
	BookmarkCheck,
	ExternalLink,
	Home,
	LoaderCircle,
	X,
} from "@lucide/svelte";
import { tick } from "svelte";

let shadowHostElement = $state<HTMLDivElement | undefined>();
let isBookmarked = $state(false);
let bookmarkLoading = $state(false);

$effect(() => {
	const currentArticle = $activeArticle;
	if (currentArticle?.id) {
		const checkStatus = async () => {
			bookmarkLoading = true;
			try {
				const res = await fetch(`/api/bookmark?id=${currentArticle.id}`);
				if (res.ok) {
					isBookmarked = (await res.json()).isBookmarked ?? false;
				}
			} catch (err) {
				console.error("Failed to check bookmark status:", err);
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
	const currentArticle = $activeArticle;
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
		if (response.ok) {
			isBookmarked = !isBookmarked;
		}
	} catch (error) {
		console.error("Error toggling bookmark:", error);
	} finally {
		bookmarkLoading = false;
	}
}

$effect(() => {
	const article = $activeArticle;
	if (shadowHostElement && article?.content) {
		const shadowRoot =
			shadowHostElement.shadowRoot ||
			shadowHostElement.attachShadow({ mode: "open" });
		const forcedStyle = document.createElement("style");
		forcedStyle.textContent = `
        :host {
            color: initial;
            background: white;
        }
        figure {
            margin: 0;
        }
    `;
		shadowRoot.innerHTML = "";
		shadowRoot.appendChild(forcedStyle);
		const parser = new DOMParser();
		const doc = parser.parseFromString(article.content, "text/html");
		doc.head
			.querySelectorAll('style, link[rel="stylesheet"]')
			.forEach((node) => {
				shadowRoot.appendChild(node.cloneNode(true));
			});
		shadowRoot.append(...doc.body.childNodes);
	} else if (shadowHostElement?.shadowRoot) {
		shadowHostElement.shadowRoot.innerHTML = "";
	}

	if (article) {
		history.pushState({ modalOpen: true }, "");
		const handlePopState = () => {
			closeModal();
		};
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

function closeModal() {
	activeArticle.set(null);
}
</script>

{#if $activeArticle}
	<div class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onclick={closeModal} role="presentation"></div>
	<div class="fixed inset-0 z-50 flex justify-center overflow-y-auto px-2" onclick={(event) => { if (event.target === event.currentTarget) closeModal(); }} role="presentation">
		<div
			class="bg-white dark:bg-slate-800 w-full max-w-2xl my-2 rounded-lg shadow-2xl flex flex-col"
			onclick={(event) => event.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<header class="flex flex-col gap-2 p-3 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 rounded-t-lg flex-shrink-0">
				<div class="flex items-center justify-between gap-3">
					<button onclick={closeModal} aria-label="閉じる" class="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
						<X class="w-5 h-5" />
					</button>
					<h2 id="modal-title" class="text-base font-bold truncate text-slate-800 dark:text-slate-100 text-center flex-1" title={$activeArticle.title}>
						{$activeArticle.title}
					</h2>
					<button class="flex items-center justify-center w-8 h-8 text-emerald-500 dark:text-emerald-300" aria-label="ブックマーク" disabled={bookmarkLoading} onclick={toggleBookmark}>
						{#if bookmarkLoading}
							<LoaderCircle class="w-7 h-7 animate-spin" />
						{:else if isBookmarked}
							<BookmarkCheck class="w-7 h-7 text-emerald-500" />
						{:else}
							<Bookmark class="w-7 h-7" />
						{/if}
					</button>
				</div>
				<div class="flex items-center justify-between text-xs">
					{#if $activeArticle.site}
					<a href={`/feed?site=${$activeArticle.site_id}`} onclick={closeModal} class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:underline">
						<Home class="w-3 h-3" />
						<span>{$activeArticle.site.title}</span>
					</a>
					{/if}
					<a href={$activeArticle.url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:underline">
						<span>元記事を開く</span>
						<ExternalLink class="w-3 h-3" />
					</a>
				</div>
			</header>
			<div class="p-4 overflow-y-auto flex-1">
				<div bind:this={shadowHostElement}></div>
			</div>
		</div>
	</div>
{/if}
