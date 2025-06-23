import type { PageServerLoad } from "./$types";
import {
  loadAllArticles,
  loadArticlesByCategory,
  loadArticlesBySite,
  loadArticlesForArtCategory,
} from "$lib/api/db/article";

export const load: PageServerLoad = ({ url }) => {
  const category = url.searchParams.get("category") || "all";
  const site = url.searchParams.get("site");
  const articlesPromise = (() => {
    if (site) {
      return loadArticlesBySite(site);
    }
    if (category.toLowerCase() === "art") {
      return loadArticlesForArtCategory();
    }
    if (category && category !== "all") {
      return loadArticlesByCategory(category);
    }
    return loadAllArticles();
  })();

  return {
    category,
    site,
    streamed: {
      articles: articlesPromise.then((res) => res ?? []),
    },
  };
};
