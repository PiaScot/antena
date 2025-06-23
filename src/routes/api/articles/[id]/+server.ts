import type { RequestHandler } from "@sveltejs/kit";
import { error as svelteKitError, json } from "@sveltejs/kit";
import { loadArticleByID } from "$lib/api/db/article";

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id) {
    throw svelteKitError(400, "Article ID is required");
  }

  try {
    const article = await loadArticleByID(id);
    if (!article) {
      throw svelteKitError(404, `Article with id ${id} not found`);
    }
    return json(article);
  } catch (err) {
    throw svelteKitError(500, "Failed to load article");
  }
};
