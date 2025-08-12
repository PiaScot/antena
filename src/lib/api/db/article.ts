// src/lib/api/db/article.ts

import { ARTICLE_TABLE, SITE_TABLE, THREAD_TABLE } from '$env/static/private';
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


// 新しい掲示板用のデータ取得関数を定義
// async function loadThreadsByCategory(category: string): Promise<ArticleFeedItem[]> {
//   // 1. DBからthreadsテーブルを検索
//   const { data: threads, error } = await supabase
//     .from(THREAD_TABLE)
//     .select('*')
//     .eq('category', category)
//     .order('pub_date', { ascending: false })
//     .limit(DB_BATCH_SIZE);
//
//   if (error || !threads) {
//     return [];
//   }
//
//   // 2. ArticleFeedItem の形式にマッピングする
//   //    ★★★ このマッピング処理が最重要 ★★★
//   return threads.map(thread => ({
//     url: `/threads/${thread.id}`, // 表示する記事（スレッド）詳細ページのパス
//     title: thread.title,
//     pub_date: thread.pub_date,
//     thumbnail: thread.thumbnail || '/default-bbs-icon.png', // サムネがない場合のデフォルト画像
//     site_name: '爆サイ掲示板', // 右上に表示するサイト名（固定値でOK）
//     site_id: null, // antena_sitesのIDではないのでnull
//     res_count: thread.res_count,
//     // ArticleFeedItem に必要な他のプロパティがあれば追加
//   }));
// }
