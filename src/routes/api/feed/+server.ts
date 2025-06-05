// src/routes/api/feed/+server.ts
import type { RequestHandler } from "@sveltejs/kit";
import {
  fetchAllArticles,
  fetchArticlesByCategory,
  fetchArticlesBySite,
  fetchArticlesForArtCategory,
} from "$lib/api/db/article";
const batchLength = 300;

export const GET: RequestHandler = async ({ url }) => {
  const category = url.searchParams.get("category") || "all";
  const siteId = url.searchParams.get("site");

  try {
    let result;
    if (siteId) {
      result = await fetchArticlesBySite(siteId);
    } else if (category === "art") {
      result = await fetchArticlesForArtCategory();
    } else if (category === "all") {
      result = await fetchAllArticles();
    } else {
      result = await fetchArticlesByCategory(category);
    }
    // result = { articles, count }
    return new Response(JSON.stringify(result), {
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
