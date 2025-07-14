import {
	createCategoryInDB,
	deleteCategoryInDB,
	updateCategoryInDB
} from '$lib/api/db/category';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * POST /api/category - 新しいカテゴリを作成します
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { id, label, super_category_id } = body;

		if (!id || !label) {
			return json({ error: '`id`と`label`は必須です。' }, { status: 400 });
		}

		const newCategory = await createCategoryInDB({
			id,
			label,
			super_category_id: super_category_id ?? null
		});

		return json(newCategory, { status: 201 });
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		console.error('Error creating category:', errorMessage);
		return json(
			{ error: `カテゴリの作成に失敗しました: ${errorMessage}` },
			{
				status: 500
			}
		);
	}
};

/**
 * PATCH /api/category - 既存のカテゴリを更新します
 */
export const PATCH: RequestHandler = async ({ request }) => {
	try {
		// ★★★ 1. super_category_id も受け取るように修正 ★★★
		const { originalId, id, label, super_category_id } = await request.json();

		if (!originalId || !id || !label) {
			return json(
				{ error: '更新対象のIDと、新しいID・ラベルは必須です' },
				{
					status: 400
				}
			);
		}

		// ★★★ 2. DB関数に渡すオブジェクトを構築 ★★★
		const updates: {
			id: string;
			label: string;
			super_category_id?: number | null;
		} = { id, label };

		// super_category_id がリクエストに含まれている場合のみ、updatesオブジェクトに追加
		if (super_category_id !== undefined) {
			updates.super_category_id = super_category_id;
		}

		const updatedCategory = await updateCategoryInDB(originalId, updates);
		return json({ category: updatedCategory }, { status: 200 });
	} catch (err: unknown) {
		const errorMessage =
			err instanceof Error ? err.message : '不明なエラーが発生しました。';
		console.error('Category update failed:', errorMessage);

		let status = 500;
		if (errorMessage.includes('別のカテゴリで既に使用されています')) {
			status = 409;
		}

		return json({ error: errorMessage }, { status });
	}
};

/**
 * DELETE /api/category - 指定されたカテゴリを削除します
 */
export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');
		if (!id) {
			return json({ error: 'カテゴリIDは必須です' }, { status: 400 });
		}
		await deleteCategoryInDB(id);
		return new Response(null, { status: 204 }); // 成功時は 204 No Content を返すのが一般的
	} catch (err: unknown) {
		const errorMessage =
			err instanceof Error ? err.message : '不明なエラーが発生しました。';
		console.error('Category deletion failed:', errorMessage);
		return json({ error: errorMessage }, { status: 500 });
	}
};
