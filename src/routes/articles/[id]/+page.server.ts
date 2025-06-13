// src/routes/articles/[id]/+page.server.ts
import type { PageServerLoad } from "./$types";
import { error as svelteKitError } from "@sveltejs/kit";
import { loadArticleByID } from "$lib/api/db/article";
import type { ArticleWithSiteName } from "$lib/types";

export const load: PageServerLoad<ArticleWithSiteName> = async ({ params }) => {
  const id = params.id;

  try {
    const article = await loadArticleByID(id);
    if (!article) {
      throw svelteKitError(404, `Not found article by id=>${id}`);
    }
    return { article };
  } catch (error: any) {
    if (error.status) {
      throw error;
    }
    console.error(`Failed to load article (id: ${id}):`, error.message);
    throw svelteKitError(
      500,
      "記事の読み込み中に予期せぬエラーが発生しました。",
    );
  }
};
