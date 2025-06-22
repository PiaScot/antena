//routes/api/article/+server.ts
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
  loadAllArticles,
  loadArticlesByCategory,
  loadArticlesBySite,
  loadArticlesForArtCategory,
} from "$lib/api/db/article";
import type { ArticleFeedItem } from "$lib/types";

export const GET: RequestHandler = async ({ url }) => {
  const category = url.searchParams.get("category") || "all";
  const siteId = url.searchParams.get("site");

  try {
    let articles: ArticleFeedItem[];

    if (siteId) {
      articles = await loadArticlesBySite(siteId);
    } else if (category === "art") {
      articles = await loadArticlesForArtCategory();
    } else if (category === "all") {
      articles = await loadAllArticles();
    } else {
      articles = await loadArticlesByCategory(category);
    }

    return json({ articles: articles ?? [] }, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error
      ? err.message
      : "An unknown error occurred";
    console.error("Failed to serve articles via API:", errorMessage);

    return json({ error: "Could not fetch articles" }, {
      status: 500,
    });
  }
};
