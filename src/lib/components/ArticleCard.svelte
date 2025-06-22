<script lang="ts">
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
// ★ 新しい、フィード一覧用の型をインポート
import type { ArticleFeedItem } from "$lib/types";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

const { article, withImage = true } = $props<{
	// ★ 受け取るpropsの型を ArticleFeedItem に更新
	article: ArticleFeedItem;
	withImage?: boolean;
}>();

const formattedDate = $derived(
	dayjs(article.pub_date).tz().format("YYYY/MM/DD HH:mm"),
);

// --- リンク先を動的に決定するロジック ---

// DBから渡された表示モードを取得（なければデフォルトで 'in_app' とする）
const displayMode = $derived(
	article.site?.scrape_options?.display_mode ?? "in_app",
);

// 表示モードが 'direct_link' かどうかを判定
const isExternalLink = $derived(displayMode === "direct_link");

// 判定結果に基づいて、リンク先のURLを動的に決定
const linkUrl = $derived(
	isExternalLink ? article.url : `/articles/${article.id}`,
);

// 外部リンクの場合のみ、新しいタブで開くようにtarget属性を設定
const linkTarget = $derived(isExternalLink ? "_blank" : undefined);
</script>

<a
	href={linkUrl}
	target={linkTarget}
	rel="noopener noreferrer"
	class="group block w-full text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
>
	<div class="flex items-start gap-4">
		{#if withImage}
			<img
				src={article.thumbnail ? article.thumbnail : '/favicon.png'}
				alt="サムネイル"
				class="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-600"
				loading="lazy"
			/>
		{/if}

		<div class="flex-1 min-w-0">
			<div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
				<span>{formattedDate}</span>
				{#if article.site?.title}
					<span class="font-medium text-emerald-700 dark:text-emerald-400 truncate group-hover:underline" title={article.site.title}>
						{article.site.title}
					</span>
				{/if}
			</div>
			<h3 class="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[3rem]" title={article.title}>
				{article.title || "記事タイトル"}
			</h3>
		</div>
	</div>
</a>
