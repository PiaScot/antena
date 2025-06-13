import { loadAllArticles } from "$lib/api/db/article";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    const articles = await loadAllArticles();
    return { articles };
  } catch (error) {
    console.error(
      "検索ページのデータ読み込みに失敗しました:",
      error,
    );
    // エラーが発生した場合、内容をページに伝えます。
    const message = error instanceof Error
      ? error.message
      : "不明なエラーが発生しました。";
    return { articles: [], error: message };
  }
};
