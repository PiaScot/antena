import {
	deleteBookmark,
	getBookmark,
	getBookmarks,
	upsertBookmark
} from '$lib/api/db/bookmark';
import type { Article } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	try {
		if (id) {
			const bookmarked = await getBookmark(id);
			return json({ isBookmarked: bookmarked });
		}

		const articles = await getBookmarks();
		return json({ articles });
	} catch (err: unknown) {
		const errorMessage =
			err instanceof Error ? err.message : 'An unknown error occurred';
		console.error(
			'Error GET Request in/api/bookmark/+page.server.ts:',
			errorMessage
		);
		return json({ error: errorMessage }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const article: Article = await request.json();
		const result = await upsertBookmark(article);
		return json({ ok: true, result });
	} catch (err: unknown) {
		const errorMessage =
			err instanceof Error ? err.message : 'An unknown error occurred';
		console.error(
			'Error POST Request in/api/bookmark/+page.server.ts:',
			errorMessage
		);
		return json({ error: errorMessage }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	try {
		if (!id) {
			return json({ error: 'id parameter is required' }, { status: 400 });
		}
		const result = await deleteBookmark(id);
		return json({ ok: true, result });
	} catch (err: unknown) {
		const errorMessage =
			err instanceof Error ? err.message : 'An unknown error occurred';
		console.error(
			'Error DELETE Request in/api/bookmark/+page.server.ts:',
			errorMessage
		);
		return json({ error: errorMessage }, { status: 500 });
	}
};
