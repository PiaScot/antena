import { supabase } from "$lib/server/supabase";
import { CATEGORY_TABLE, SITE_TABLE } from "$env/static/private";
import type { Category } from "$lib/types";

/**
 * 新しいカテゴリをデータベースに作成します。
 * @param id - ユーザーが入力したカテゴリID (英数字)
 * @param label - ユーザーが入力したカテゴリ名
 * @returns {Promise<Category>} 作成されたカテゴリ情報
 */
export async function createCategoryInDB(
  id: string,
  label: string,
): Promise<Category> {
  // IDのバリデーション: 英数字とハイフンのみを許可
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error("IDは半角英数字とハイフンのみ使用できます。");
  }

  const newCategory: Category = { id, label, visible: true };

  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .insert(newCategory)
    .select()
    .single();

  if (error) {
    // 主キー重複エラーの場合
    if (error.code === "23505") {
      throw new Error(`カテゴリID '${id}' は既に存在します。`);
    }
    console.error("Failed to create category:", error);
    throw error;
  }
  return data;
}

/**
 * カテゴリを削除し、関連するサイトのカテゴリを更新します。
 * @param id - 削除するカテゴリのID
 */
export async function deleteCategoryInDB(id: string): Promise<void> {
  // 1. このカテゴリを使用しているサイトのカテゴリを空にする
  const { error: updateError } = await supabase
    .from(SITE_TABLE)
    .update({ category: "" })
    .eq("category", id);

  if (updateError) {
    console.error(
      "Failed to update sites when deleting category:",
      updateError,
    );
    throw updateError;
  }

  // 2. カテゴリ自体を削除する
  const { error: deleteError } = await supabase
    .from(CATEGORY_TABLE)
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Failed to delete category:", deleteError);
    throw deleteError;
  }
}
