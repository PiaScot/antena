<script lang="ts">
	import { readArticles } from '$lib/stores/readArticlesStore';
	import { pageContext } from '$lib/stores/pageContextStore'; // ★ 共有ストアをインポート
	import type { PageData } from './$types';

	const { data } = $props<{ data: PageData }>();

	$effect(() => {
		pageContext.set({
			article: data.article,
			isBookmarked: data.isBookmarked
		});

		readArticles.markAsRead(data.article.url);

		return () => {
			pageContext.set({ article: null, isBookmarked: false });
		};
	});
</script>

<div class="prose dark:prose-invert max-w-none p-4">
	<!-- <h1>{data.article.title}</h1> -->
	<!-- <p class="text-sm text-slate-500"> -->
	<!-- 	{new Date(data.article.pub_date).toLocaleString()} -->
	<!-- </p> -->
	<hr />
	{@html data.article.content}
</div>
