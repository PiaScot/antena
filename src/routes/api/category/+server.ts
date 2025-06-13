import { json, type RequestHandler } from "@sveltejs/kit";
import { createCategoryInDB, deleteCategoryInDB } from "$lib/api/db/category";

/**
 * POST /api/category - 新しいカテゴリを作成します
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id, label } = await request.json();
    if (!id || typeof id !== "string" || !label || typeof label !== "string") {
      return json({ error: "IDとラベルは必� �です" }, { status: 400 });
    }

    const newCategory = await createCategoryInDB(id, label);
    return json({ category: newCategory }, { status: 201 });
  } catch (err: any) {
    console.error("Category creation failed:", err);
    return json({ error: err.message }, {
      status: err.message.includes("既に存在します")
        ? 409
        : (err.message.includes("IDは半角英数字") ? 400 : 500),
    });
  }
};

/**
 * DELETE /api/category - 指定されたカテゴリを削除します
 */
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const id = url.searchParams.get("id");
    if (!id) {
      return json({ error: "カテゴリIDは必� �です" }, { status: 400 });
    }

    await deleteCategoryInDB(id);
    return json({ ok: true });
  } catch (err: any) {
    console.error("Category deletion failed:", err);
    return json({ error: err.message }, { status: 500 });
  }
};
