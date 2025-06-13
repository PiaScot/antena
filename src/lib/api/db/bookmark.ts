import { supabase } from "$lib/server/supabase";
import { BOOKMARK_TABLE, SITE_TABLE } from "$env/static/private";
import type { Article, ArticleWithSiteName, Site } from "$lib/types";
import { DB_BATCH_SIZE } from "$lib/server/config";
import { flattenArticle } from "$lib/utils/article";

/**
 * 指定されたIDのブックマークが存在するか確認します。
 */
export async function getBookmark(id: string | number): Promise<boolean> {
  const { error, count } = await supabase
    .from(BOOKMARK_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("id", Number(id));

  if (error) {
    console.error("Failed to get bookmark status:", error);
    throw error;
  }
  return (count ?? 0) > 0;
}

/**
 * すべてのブックマーク記事を件数付きで取得します。
 */
export async function getBookmarks(): Promise<
  { bookmarks: ArticleWithSiteName[]; count: number }
> {
  const q = `*, site:${SITE_TABLE}(title)`;
  const { data, error, count } = await supabase
    .from(BOOKMARK_TABLE)
    .select(q, { count: "exact" }) // `count: "exact"`を追� して総件数を取得
    .order("pub_date", { ascending: false })
    .limit(DB_BATCH_SIZE);

  if (error) {
    console.error("Failed to get bookmarks:", error);
    throw error;
  }
  if (!data) return { bookmarks: [], count: 0 };

  const articles = data.map(flattenArticle);
  return { bookmarks: articles, count: count ?? 0 };
}

/**
 * ブックマークを登録または更新します。
 */
export async function upsertBookmark(
  article: Partial<ArticleWithSiteName>,
): Promise<{ ok: true }> {
  const { id, site_id, title, url, category, content, pub_date, thumbnail } =
    article;

  if (!id || !url || !title) {
    throw new Error("必要な情� �(id, url, title)が不足しています。");
  }

  const articleToUpsert: Article = {
    id,
    site_id: site_id ?? -1,
    title,
    url,
    category: category ?? "",
    content: content ?? "",
    pub_date: pub_date ?? new Date().toISOString(),
    thumbnail: thumbnail ?? "",
  };

  const { error } = await supabase.from(BOOKMARK_TABLE).upsert(articleToUpsert);

  if (error) {
    console.error("Failed to upsert bookmark:", error);
    throw error;
  }
  return { ok: true };
}

/**
 * ブックマークを削除します。
 */
export async function deleteBookmark(
  id: string | number,
): Promise<{ ok: true }> {
  if (!id) throw new Error("IDは必� �です");

  const { error } = await supabase
    .from(BOOKMARK_TABLE)
    .delete()
    .eq("id", Number(id));

  if (error) {
    console.error("Failed to delete bookmark:", error);
    throw error;
  }
  return { ok: true };
}
