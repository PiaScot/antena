import type { PageServerLoad } from "./$types";
import {
  loadAllArticles,
  loadArticlesByCategory,
  loadArticlesBySite,
  loadArticlesForArtCategory,
} from "$lib/api/db/article";
// svelteKitErrorは不要になることが多いので一旦削除

export const load: PageServerLoad = ({ url }) => { // ← asyncを外す
  const category = url.searchParams.get("category") || "all";
  const site = url.searchParams.get("site");

  // 時間のかかるデータ取得処理を Promise として定義
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
    // articles の中身そのものではなく、articles を取得する「約束」を渡す
    streamed: {
      articles: articlesPromise.then((res) => res ?? []),
    },
  };
};
