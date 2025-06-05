import { supabase } from "$lib/server/supabase";
import { BOOKMARK_TABLE, SITE_TABLE } from "$env/static/private";
import type { Article, ArticleWithSiteName } from "$lib/types";

export async function getBookmark(id: string) {
  const { data: rows, error } = await supabase
    .from(BOOKMARK_TABLE)
    .select("*")
    .eq("id", id)
    .limit(1);

  if (error) throw error;
  return { bookmarked: rows && rows.length > 0 };
}

export async function getBookmarks() {
  const q = `*, site:${SITE_TABLE}(title)`;
  const { data: rows, error, count } = await supabase
    .from(BOOKMARK_TABLE)
    .select(q, { count: "exact" })
    .order("pub_date", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching bookmarks with site title:", error.message);
    throw error;
  }

  if (!rows) {
    return { articles: [], count: 0 };
  }

  const articles: ArticleWithSiteName[] = (rows as any[]).map((r) => {
    const siteTitle = r.site?.title ?? "";

    return {
      id: r.id,
      site_id: r.site_id ?? 0,
      site_title: siteTitle,
      title: r.title ?? "",
      url: r.url ?? "",
      category: r.category ?? "",
      content: r.content ?? "",
      pub_date: r.pub_date ?? "",
      thumbnail: r.thumbnail ?? "",
    };
  });

  return { articles, count: count ?? 0 };
}

export async function upsertBookmark(article: Article) {
  const { id, url, title } = article;
  if (!id || !url || !title) {
    throw new Error("必須情報が不足しています (id, url, title)");
  }

  const { error } = await supabase.from(BOOKMARK_TABLE).upsert([article]);
  if (error) throw error;
  return { ok: true };
}

// ブックマーク削除
export async function deleteBookmark(id: string) {
  if (!id) throw new Error("id is required");
  const { error } = await supabase
    .from(BOOKMARK_TABLE)
    .delete()
    .eq("id", id);
  if (error) throw error;
  return { ok: true };
}
