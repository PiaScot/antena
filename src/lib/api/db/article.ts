// src/lib/api/db/article.ts
import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE, SITE_TABLE } from "$env/static/private";
import type { Article, ArticleWithSiteName } from "$lib/types";

const batchLength = 300;

/**
 * サイトIDで記事一覧を取得
 */
export async function fetchArticlesBySite(siteId: string | number) {
  const { data, error, count } = await supabase
    .from(ARTICLE_TABLE)
    .select(`*, site:${SITE_TABLE}(title)`, { count: "exact" })
    .eq("site_id", Number(siteId))
    .order("pub_date", { ascending: false })
    .limit(batchLength);

  if (error) throw error;
  return {
    articles: (data ?? []).map(flattenArticle),
    count: count ?? 0,
  };
}

/**
 * artカテゴリの場合: 「2d」「real」いずれか
 */
export async function fetchArticlesForArtCategory() {
  const { data, error, count } = await supabase
    .from(ARTICLE_TABLE)
    .select(`*, site:${SITE_TABLE}(title)`, { count: "exact" })
    .in("category", ["2d", "real"])
    .order("pub_date", { ascending: false })
    .limit(batchLength);

  if (error) throw error;
  return {
    articles: (data ?? []).map(flattenArticle),
    count: count ?? 0,
  };
}

/**
 * 特定カテゴリ指定
 */
export async function fetchArticlesByCategory(category: string) {
  const { data, error, count } = await supabase
    .from(ARTICLE_TABLE)
    .select(`*, site:${SITE_TABLE}(title)`, { count: "exact" })
    .eq("category", category)
    .order("pub_date", { ascending: false })
    .limit(batchLength);

  if (error) throw error;
  return {
    articles: (data ?? []).map(flattenArticle),
    count: count ?? 0,
  };
}

/**
 * すべての記事
 */
export async function fetchAllArticles() {
  const { data, error, count } = await supabase
    .from(ARTICLE_TABLE)
    .select(`*, site:${SITE_TABLE}(title)`, { count: "exact" })
    .order("pub_date", { ascending: false })
    .limit(batchLength);

  if (error) throw error;
  return {
    articles: (data ?? []).map(flattenArticle),
    count: count ?? 0,
  };
}

/**
 * Supabaseから取得した生データをArticleWithSiteNameに整形
 */
function flattenArticle(
  r: Article & { site?: { title?: string } },
): ArticleWithSiteName {
  return {
    id: r.id,
    site_id: r.site_id,
    site_title: r.site?.title ?? "",
    title: r.title,
    url: r.url,
    category: r.category,
    content: r.content,
    pub_date: r.pub_date,
    thumbnail: r.thumbnail,
  };
}
