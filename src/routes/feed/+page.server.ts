// src/routes/feed/+page.server.ts
import type { PageServerLoad } from "./$types";
import {
  loadAllArticles,
  loadArticlesByCategory,
  loadArticlesBySite,
  loadArticlesForArtCategory,
} from "$lib/api/db/article";
import type { ArticleWithSiteName } from "$lib/types";
import { error as svelteKitError } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ url }) => {
  const category = url.searchParams.get("category") || "all";
  const site = url.searchParams.get("site");

  try {
    let articles: ArticleWithSiteName[] = [];

    if (site) {
      articles = await loadArticlesBySite(site) ?? [];
    } else if (category.toLowerCase() === "art") {
      articles = await loadArticlesForArtCategory() ?? [];
    } else if (category && category !== "all") {
      articles = await loadArticlesByCategory(category) ?? [];
    } else {
      articles = await loadAllArticles() ?? [];
    }

    return {
      articles,
      category,
      site,
    };
  } catch (error: any) {
    console.error(`Failed to load articles: ${error?.message ?? error}`);
    throw svelteKitError(
      500,
      `Failed to load articles: ${error?.message ?? error}`,
    );
  }
};
