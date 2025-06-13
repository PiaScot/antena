// src/routes/page/+page.server.ts
import { loadAllSites } from "$lib/api/db/site";
import type { PageServerLoad } from "./$types";

// `data`プロパティに型を適用するためにPageDataをインポートします
import type { PageData } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    // `loadAllSites`が返すオブジェクトを正しく受け取る
    const { sites, count } = await loadAllSites();

    // `data`プロパティにsitesとcategoriesを含めるように修正
    // categoriesは `+layout.server.ts` から継承されるため、ここでは不要かもしれません。
    // もしこのページ固有でカテゴリが必要な� �合は別途取得します。
    return { sites, count };
  } catch (error: any) {
    return {
      sites: [],
      count: 0,
      error: error.message || "Failed to load site information from db.",
    };
  }
};
