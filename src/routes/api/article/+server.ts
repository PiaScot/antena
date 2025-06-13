import type { RequestHandler } from "@sveltejs/kit";
import {
  loadAllArticles,
  loadArticlesByCategory,
  loadArticlesBySite,
  loadArticlesForArtCategory,
} from "$lib/api/db/article";
import type { ArticleWithSiteName } from "$lib/types";
const batchLength = 300;

export const GET: RequestHandler = async ({ url }) => {
  const category = url.searchParams.get("category") || "all";
  const siteId = url.searchParams.get("site");

  try {
    let result: ArticleWithSiteName[] | null;
    if (siteId) {
      result = await loadArticlesBySite(siteId);
    } else if (category === "art") {
      result = await loadArticlesForArtCategory();
    } else if (category === "all") {
      result = await loadAllArticles();
    } else {
      result = await loadArticlesByCategory(category);
    }
    return new Response(JSON.stringify({ articles: result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
