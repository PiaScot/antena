import {
	deleteSuperCategory,
	updateSuperCategoryLabel
} from '$lib/api/db/category';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { label } = await request.json();
		if (typeof label !== 'string') {
			return json(
				{ error: 'Invalid payload. "label" (string) is required.' },
				{
					status: 400
				}
			);
		}

		const updatedSuperCategory = await updateSuperCategoryLabel(
			Number(params.id),
			label
		);
		return json(updatedSuperCategory);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return json(
			{ error: `Failed to update super category: ${errorMessage}` },
			{
				status: 500
			}
		);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await deleteSuperCategory(Number(params.id));
		return new Response(null, { status: 204 });
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return json(
			{ error: `Failed to delete super category: ${errorMessage}` },
			{
				status: 500
			}
		);
	}
};
