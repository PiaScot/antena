<script lang="ts">
import type { PageData } from "./$types";

const { data } = $props<{ data: PageData }>();
const { article } = data;
let shadowHostElement = $state<HTMLDivElement | undefined>();

$effect(() => {
	if (!shadowHostElement || !article?.content) return;
	const shadowRoot =
		shadowHostElement.shadowRoot ||
		shadowHostElement.attachShadow({ mode: "open" });
	const forcedStyle = document.createElement("style");
	forcedStyle.textContent = `
			:host {
				color: initial;
				background: white;
			}
		`;

	shadowRoot.innerHTML = "";
	shadowRoot.appendChild(forcedStyle);
	const parser = new DOMParser();
	const doc = parser.parseFromString(article.content, "text/html");
	shadowRoot.append(...doc.head.childNodes);
	shadowRoot.append(...doc.body.childNodes);
});
</script>

<div class="max-w-2xl mx-auto pt-4">
	{#if article}
		<h1 class="text-2xl md:text-3xl font-bold mb-4 px-4 text-gray-900 dark:text-gray-100">
			{article.title}
		</h1>

		<div class="mb-6 px-4 text-sm text-gray-500 dark:text-gray-400">
			<span>投稿日: {new Date(article.pub_date).toLocaleDateString()}</span>
			<span>記事URL： <a href={article.url} target="_blank" rel="noopener noreferrer" class="text-emerald-500 hover:underline">{article.url}</a></span>
		</div>

		<div bind:this={shadowHostElement}></div>
		{:else}
		<p class="text-center text-red-500">記事データの読み込みに失敗しました。</p>
	{/if}
</div>
