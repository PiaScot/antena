// src/lib/api/db/article.ts

import { ARTICLE_TABLE, SITE_TABLE } from '$env/static/private';
import { DB_BATCH_SIZE } from '$lib/server/config';
import { supabase } from '$lib/server/supabase';
import type { ArticleFeedItem, FullArticleData } from '$lib/types';

/**
 * 記事フィードで利用する、最適化されたSELECT文
 * contentを含まず、表示に必要なサイト情報(title, scrape_options)を結合する
 */
const ARTICLE_FEED_SELECT = `
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
 * すべての記事をフィード用に取得
 */
export async function loadAllArticles(): Promise<ArticleFeedItem[]> {
	const { data, error } = await supabase
		.from(ARTICLE_TABLE)
		.select(ARTICLE_FEED_SELECT)
		.order('pub_date', { ascending: false })
		.limit(DB_BATCH_SIZE);

	if (error) throw error;
	return (data as unknown as ArticleFeedItem[]) || [];
}

/**
 * 指定IDの記事を1件取得（個別記事ページ用）
 */
export async function loadArticleByID(
	id: string | number
): Promise<FullArticleData | null> {
	const { data, error } = await supabase
		.from(ARTICLE_TABLE)
		.select(`*, site: ${SITE_TABLE}(title, scrape_options)`)
		.eq('id', Number(id))
		.single();

	if (error) {
		if (error.code === 'PGRST116') return null;
		throw error;
	}

	// Ensure data is not null before proceeding
	if (!data) return null;

	// Manually map the site data to FullArticleData
	const fullArticleData: FullArticleData = {
		id: (data as any).id,
		site_id: (data as any).site_id,
		title: (data as any).title,
		url: (data as any).url,
		category: (data as any).category,
		thumbnail: (data as any).thumbnail,
		pub_date: (data as any).pub_date,
		content: (data as any).content,
		site_title: (data as any).site?.title || '',
		site: (data as any).site || undefined
	};

	return fullArticleData;
}

/**
 * 指定siteIdの記事をフィード用にすべて取得
 */
export async function loadArticlesBySite(
	siteId: string | number
): Promise<ArticleFeedItem[]> {
	const { data, error } = await supabase
		.from(ARTICLE_TABLE)
		.select(ARTICLE_FEED_SELECT)
		.eq('site_id', Number(siteId))
		.order('pub_date', { ascending: false })
		.limit(DB_BATCH_SIZE);

	if (error) throw error;
	return (data as unknown as ArticleFeedItem[]) || [];
}

/**
 * カテゴリがArt(2d, real)の記事をフィード用に取得
 */
export async function loadArticlesForArtCategory(): Promise<ArticleFeedItem[]> {
	const { data, error } = await supabase
		.from(ARTICLE_TABLE)
		.select(ARTICLE_FEED_SELECT)
		.in('category', ['2d', 'real'])
		.order('pub_date', { ascending: false })
		.limit(DB_BATCH_SIZE);

	if (error) throw error;
	return (data as unknown as ArticleFeedItem[]) || [];
}

/**
 * 指定カテゴリの記事をフィード用にすべて取得
 */
export async function loadArticlesByCategory(
	category: string
): Promise<ArticleFeedItem[]> {
	const { data, error } = await supabase
		.from(ARTICLE_TABLE)
		.select(ARTICLE_FEED_SELECT)
		.eq('category', category)
		.order('pub_date', { ascending: false })
		.limit(DB_BATCH_SIZE);

	if (error) throw error;
	return (data as unknown as ArticleFeedItem[]) || [];
}
