import { loadArticleByID } from '$lib/api/db/article';
import { getBookmark } from '$lib/api/db/bookmark';
import type { RequestHandler } from '@sveltejs/kit';
import { json, error as svelteKitError } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id) {
    throw svelteKitError(400, 'Article ID is required');
  }

  try {
    const article = await loadArticleByID(id);
    const isBookmark = await getBookmark(id);
    if (!article) {
      throw svelteKitError(404, `Article with id ${id} not found`);
    }
    const responseData = {
      article: article,
      isBookmarked: isBookmark
    };
    return json(responseData);
  } catch (_err) {
    throw svelteKitError(
      500,
      'Failed to load article err =>' + JSON.stringify(_err)
    );
  }
};
