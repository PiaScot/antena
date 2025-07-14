// src/lib/api/db/bookmark.ts

import { BOOKMARK_TABLE, SITE_TABLE } from '$env/static/private';
import { DB_BATCH_SIZE } from '$lib/server/config';
import { supabase } from '$lib/server/supabase';
import type { Article, ArticleFeedItem } from '$lib/types';

const BOOKMARK_FEED_SELECT = `
  id,
  site_id,
  title,
  url,
  category,
  pub_date,
  thumbnail,
  site: ${SITE_TABLE} (
    title,
    scrape_options
  )
`;

/**
 * 指定IDの記事がブックマークされているか確認する
 */
export async function getBookmark(id: string | number): Promise<boolean> {
	const { error, count } = await supabase
		.from(BOOKMARK_TABLE)
		.select('id', { count: 'exact', head: true })
		.eq('id', Number(id));

	if (error) {
		console.error('Failed to get bookmark status:', error);
		throw error;
	}
	return (count ?? 0) > 0;
}

/**
 * すべてのブックマークをフィード用に取得する
 */
export async function getBookmarks(): Promise<{
	bookmarks: ArticleFeedItem[];
	count: number;
}> {
	const { data, error, count } = await supabase
		.from(BOOKMARK_TABLE)
		.select(BOOKMARK_FEED_SELECT, { count: 'exact' }) // ★ 最適化されたSELECT文を使用
		.order('pub_date', { ascending: false })
		.limit(DB_BATCH_SIZE);

	if (error) {
		console.error('Failed to get bookmarks:', error);
		throw error;
	}

	return {
		bookmarks: (data || []) as unknown as ArticleFeedItem[],
		count: count ?? 0
	};
}

/**
 * ブックマークを更新、または新規挿入する
 * @param article - ブックマークする記事データ。FullArticleDataまたはArticleFeedItemから必要なものを渡す。
 */
export async function upsertBookmark(
	article: Partial<Article> & Pick<Article, 'id' | 'url' | 'title'> // ★ 型をより厳密に
): Promise<{ ok: true }> {
	const { id, site_id, title, url, category, content, pub_date, thumbnail } =
		article;

	// DBのarticlesテーブルのスキーマに合わせてデータを整形
	const articleToUpsert: Article = {
		id,
		site_id: site_id === undefined ? null : site_id,
		title,
		url,
		category: category ?? '',
		content: content ?? '',
		pub_date: pub_date ?? new Date().toISOString(),
		thumbnail: thumbnail ?? ''
	};

	const { error } = await supabase.from(BOOKMARK_TABLE).upsert(articleToUpsert);

	if (error) {
		console.error('Failed to upsert bookmark:', error);
		throw error;
	}
	return { ok: true };
}

/**
 * ブックマークの削除
 */
export async function deleteBookmark(
	id: string | number
): Promise<{ ok: true }> {
	if (!id) throw new Error('No found id to be about to delete bookmark record');

	const { error } = await supabase
		.from(BOOKMARK_TABLE)
		.delete()
		.eq('id', Number(id));

	if (error) {
		console.error('Failed to delete bookmark:', error);
		throw error;
	}
	return { ok: true };
}
