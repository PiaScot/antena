// src/routes/articles/[id]/+page.server.ts
import type { PageServerLoad } from "./$types";
import { error as svelteKitError, redirect } from "@sveltejs/kit";
import { loadArticleByID } from "$lib/api/db/article";

export const load: PageServerLoad = async ({ params }) => {
  const id = params.id;

  try {
    const article = await loadArticleByID(id);

    if (!article) {
      throw svelteKitError(404, `Not found article by id=>${id}`);
    }

    const displayMode = article.site?.scrape_options?.display_mode;

    if (displayMode === "direct_link") {
      throw redirect(307, article.url);
    }

    return { article };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as any).status === "number" &&
      (error as any).status >= 300 &&
      (error as any).status < 400
    ) {
      throw error;
    }

    const errorMessage = error instanceof Error
      ? error.message
      : "An unknown error occurred";
    console.error(`Failed to load article (id: ${id}):`, errorMessage);

    throw svelteKitError(
      500,
      "記事の読み込み中に予期せぬエラーが発生しました。",
    );
  }
};
