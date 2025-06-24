import { supabase } from "$lib/server/supabase";
import { CATEGORY_TABLE } from "$env/static/private";
import type { Category } from "$lib/types";

/**
 * 新しいカテゴリを作成する
 */
export async function createCategoryInDB(
  id: string,
  label: string,
): Promise<Category> {
  // バリデーションの例
  if (!/^[a-z0-9-_]+$/.test(id)) {
    throw new Error(
      "カテゴリIDは半角英数字、ハイフン、アンダースコアのみ使用できます。",
    );
  }

  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .insert({ id, label })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") { // PostgreSQLのunique制約違反コード
      throw new Error(`カテゴリID「${id}」は既に存在します。`);
    }
    throw error;
  }
  return data;
}

/**
 * 既存のカテゴリを更新する
 */
export async function updateCategoryInDB(
  originalId: string,
  updates: { id: string; label: string },
): Promise<Category> {
  if (!/^[a-z0-9-_]+$/.test(updates.id)) {
    throw new Error(
      "カテゴリIDは半角英数字、ハイフン、アンダースコアのみ使用できます。",
    );
  }

  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .update({ id: updates.id, label: updates.label })
    .eq("id", originalId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        `更新後のカテゴリID「${updates.id}」は、別のカテゴリで既に使用されています。`,
      );
    }
    throw error;
  }
  return data;
}

/**
 * カテゴリを削除する
 */
export async function deleteCategoryInDB(id: string): Promise<void> {
  const { error } = await supabase
    .from(CATEGORY_TABLE)
    .delete()
    .eq("id", id);

  if (error) throw error;
}
