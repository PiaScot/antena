// src/routes/api/category/+server.ts

import { json, type RequestHandler } from "@sveltejs/kit";
import {
  createCategoryInDB,
  deleteCategoryInDB,
  updateCategoryInDB,
} from "$lib/api/db/category";

/**
 * POST /api/category - 新しいカテゴリを作成します
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id, label } = await request.json();
    if (!id || typeof id !== "string" || !label || typeof label !== "string") {
      return json({ error: "IDとラベルは必須です" }, { status: 400 });
    }
    const newCategory = await createCategoryInDB(id, label);
    return json({ category: newCategory }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error
      ? err.message
      : "不明なエラーが発生しました。";
    console.error("Category creation failed:", errorMessage);

    let status = 500;
    if (errorMessage.includes("既に存在します")) status = 409;
    if (errorMessage.includes("IDは半角英数字")) status = 400;

    // ★ 必ずerrorMessage（文字列）を返す
    return json({ error: errorMessage }, { status });
  }
};

/**
 * PATCH /api/category - 既存のカテゴリを更新します
 */
export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const { originalId, id, label } = await request.json();
    if (!originalId || !id || !label) {
      return json({ error: "更新対象のIDと、新しいID・ラベルは必須です" }, {
        status: 400,
      });
    }
    const updatedCategory = await updateCategoryInDB(originalId, { id, label });
    return json({ category: updatedCategory }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error
      ? err.message
      : "不明なエラーが発生しました。";
    console.error("Category update failed:", errorMessage);

    let status = 500;
    if (errorMessage.includes("別のカテゴリで既に使用されています")) {
      status = 409;
    }

    // ★ 必ずerrorMessage（文字列）を返す
    return json({ error: errorMessage }, { status });
  }
};

/**
 * DELETE /api/category - 指定されたカテゴリを削除します
 */
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const id = url.searchParams.get("id");
    if (!id) {
      return json({ error: "カテゴリIDは必須です" }, { status: 400 });
    }
    await deleteCategoryInDB(id);
    return json({ ok: true });
  } catch (err: unknown) { // ★ anyの代わりにunknownを使用
    const errorMessage = err instanceof Error
      ? err.message
      : "不明なエラーが発生しました。";
    console.error("Category deletion failed:", errorMessage);
    return json({ error: errorMessage }, { status: 500 });
  }
};
