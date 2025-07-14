import { getBookmarks } from '$lib/api/db/bookmark';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const bookmarksPromise = getBookmarks();

	return {
		streamed: {
			bookmarks: bookmarksPromise.then((articles) => articles.bookmarks ?? [])
		}
	};
};
