// src/routes/bookmark/+page.server.ts
import { getBookmarks } from "$lib/api/bookmark";
import type { PageServerLoad } from "./$types";
import type { ArticleWithSiteName } from "$lib/types";

interface BookmarkPageData {
  articles: ArticleWithSiteName[];
  count: number;
  error?: string;
}

export const load: PageServerLoad<BookmarkPageData> = async () => {
  try {
    // getBookmarks は site_title を含んだ articles を返すようになった
    const { articles, count } = await getBookmarks();
    return { articles, count: count ?? 0 };
  } catch (error: any) {
    console.error(
      "Error loading bookmarks in /routes/bookmark/+page.server.ts:",
      error.message,
    );
    // エラーが発生した場合でも、ページがクラッシュしないように空の配列とエラーメッセージを返す
    return {
      articles: [],
      count: 0,
      error: error.message || "ブックマークの読み込みに失敗しました。",
    };
  }
};
