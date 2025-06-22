// src/lib/api/db/article.ts

import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE, SITE_TABLE } from "$env/static/private";
import type { ArticleFeedItem, FullArticleData } from "$lib/types";
import { DB_BATCH_SIZE } from "$lib/server/config";

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
    .order("pub_date", { ascending: false })
    .limit(DB_BATCH_SIZE);

  if (error) throw error;
  return data || [];
}

/**
 * 指定IDの記事を1件取得（個別記事ページ用）
 */
export async function loadArticleByID(
  id: string | number,
): Promise<FullArticleData | null> {
  const { data, error } = await supabase
    .from(ARTICLE_TABLE)
    .select(`
      *, 
      site: ${SITE_TABLE}(title)
    `)
    .eq("id", Number(id))
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

/**
 * 指定siteIdの記事をフィード用にすべて取得
 */
export async function loadArticlesBySite(
  siteId: string | number,
): Promise<ArticleFeedItem[]> {
  const { data, error } = await supabase
    .from(ARTICLE_TABLE)
    .select(ARTICLE_FEED_SELECT)
    .eq("site_id", Number(siteId))
    .order("pub_date", { ascending: false })
    .limit(DB_BATCH_SIZE);

  if (error) throw error;
  return data || [];
}

/**
 * カテゴリがArt(2d, real)の記事をフィード用に取得
 */
export async function loadArticlesForArtCategory(): Promise<ArticleFeedItem[]> {
  const { data, error } = await supabase
    .from(ARTICLE_TABLE)
    .select(ARTICLE_FEED_SELECT)
    .in("category", ["2d", "real"])
    .order("pub_date", { ascending: false })
    .limit(DB_BATCH_SIZE);

  if (error) throw error;
  return data || [];
}

/**
 * 指定カテゴリの記事をフィード用にすべて取得
 */
export async function loadArticlesByCategory(
  category: string,
): Promise<ArticleFeedItem[]> {
  const { data, error } = await supabase
    .from(ARTICLE_TABLE)
    .select(ARTICLE_FEED_SELECT)
    .eq("category", category)
    .order("pub_date", { ascending: false })
    .limit(DB_BATCH_SIZE);

  if (error) throw error;
  return data || [];
}
