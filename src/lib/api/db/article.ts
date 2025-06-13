// src/lib/api/db/article.ts
import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE, SITE_TABLE } from "$env/static/private";
import type { Article, ArticleWithSiteName } from "$lib/types";
import { DB_BATCH_SIZE } from "$lib/server/config";
import { flattenArticle } from "$lib/utils/article";

/**
 * すべての記事を取得
 */
export async function loadAllArticles(): Promise<ArticleWithSiteName[]> {
  const { data, error } = await supabase
    .from(ARTICLE_TABLE)
    .select(`*, site:${SITE_TABLE}(title)`, { count: "exact" })
    .order("pub_date", { ascending: false })
    .limit(DB_BATCH_SIZE);

  if (error) throw error;
  if (!data || data.length === 0) return [];
  return data.map(flattenArticle);
}

/**
 * 指定IDの記事を1件取得
 */
export async function loadArticleByID(
  id: string | number,
): Promise<ArticleWithSiteName | null> {
  const { data, error } = await supabase
    .from(ARTICLE_TABLE)
    .select(`*, site:${SITE_TABLE}(title)`, { count: "exact" })
    .eq("id", Number(id))
    .order("pub_date", { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || !data[0]) return null;
  return flattenArticle(data[0]);
}

/**
 * 指定siteIdの記事をすべて取得
 */
export async function loadArticlesBySite(
  siteId: string | number,
): Promise<ArticleWithSiteName[]> {
  const { data, error } = await supabase
    .from(ARTICLE_TABLE)
    .select(`*, site:${SITE_TABLE}(title)`, { count: "exact" })
    .eq("site_id", Number(siteId))
    .order("pub_date", { ascending: false })
    .limit(DB_BATCH_SIZE);

  if (error) throw error;
  if (!data || data.length === 0) return [];
  return data.map(flattenArticle);
}

/**
 * カテゴリが2dまたはrealの記事を取得（Art用）
 */
export async function loadArticlesForArtCategory(): Promise<
  ArticleWithSiteName[]
> {
  const { data, error } = await supabase
    .from(ARTICLE_TABLE)
    .select(`*, site:${SITE_TABLE}(title)`, { count: "exact" })
    .in("category", ["2d", "real"])
    .order("pub_date", { ascending: false })
    .limit(DB_BATCH_SIZE);

  if (error) throw error;
  if (!data || data.length === 0) return [];
  return data.map(flattenArticle);
}

/**
 * 指定カテゴリの記事をすべて取得
 */
export async function loadArticlesByCategory(
  category: string,
): Promise<ArticleWithSiteName[]> {
  const { data, error } = await supabase
    .from(ARTICLE_TABLE)
    .select(`*, site:${SITE_TABLE}(title)`, { count: "exact" })
    .eq("category", category)
    .order("pub_date", { ascending: false })
    .limit(DB_BATCH_SIZE);

  if (error) throw error;
  if (!data || data.length === 0) return [];
  return data.map(flattenArticle);
}
