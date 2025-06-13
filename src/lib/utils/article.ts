import type { Article, ArticleWithSiteName } from "$lib/types";

/**
 * Article from db, trans to ArticleWithSiteName
 */
export function flattenArticle(
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
