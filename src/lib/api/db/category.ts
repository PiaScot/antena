import { supabase } from "$lib/server/supabase";
import { CATEGORY_TABLE } from "$env/static/private";
import type {
  Category,
  Site,
  SuperCategory,
  SuperCategoryGroup,
} from "$lib/types";

/**
 * すべてのカテゴリをフラットなリストとして取得する
 */
export async function loadAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from<Category>(CATEGORY_TABLE)
    .select("*");

  if (error) throw error;
  return data ?? [];
}

/**
 * トップページ表示用に、大カテゴリとそれに紐づくカテゴリを階層化して取得する
 */
export async function loadSuperCategoryGroups(): Promise<SuperCategoryGroup[]> {
  const { data, error } = await supabase
    .from("super_categories")
    .select(`
      *,
      categories:antena_sites_category (
        *,
        sites:antena_sites(count)
      )
    `)
    .order("order", { ascending: true });

  if (error) throw error;
  return (data as SuperCategoryGroup[]) ?? [];
}

/**
 * 新しいカテゴリを作成する
 */
export async function createCategoryInDB(
  categoryData: { id: string; label: string; super_category_id: number | null },
): Promise<Category> {
  const { id, label, super_category_id } = categoryData;

  // Validation
  if (!/^[a-z0-9-_]+$/.test(id)) {
    throw new Error(
      "カテゴリIDは半角英数字、ハイフン、アンダースコアのみ使用できます。",
    );
  }
  if (!label.trim()) {
    throw new Error("カテゴリのラベルは空にできません。");
  }

  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .insert({ id, label, super_category_id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
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
  // ★★★ super_category_id も更新できるように、引数の型を修正 ★★★
  updates: { id: string; label: string; super_category_id?: number | null },
): Promise<Category> {
  if (!/^[a-z0-9-_]+$/.test(updates.id)) {
    throw new Error(
      "カテゴリIDは半角英数字、ハイフン、アンダースコアのみ使用できます。",
    );
  }

  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    // ★★★ updatesオブジェクトをそのまま渡すことで、柔軟な更新に対応 ★★★
    .update(updates)
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

// --- Super Category Functions ---

/**
 * 新しい大カテゴリを作成する
 */
export async function createSuperCategory(
  label: string,
  order: number,
): Promise<SuperCategory> {
  if (!label.trim()) {
    throw new Error("大カテゴリのラベルは空にできません。");
  }

  const { data, error } = await supabase
    .from("super_categories")
    .insert({ label, order })
    .select()
    .single();

  if (error) {
    console.error("Failed to create super category:", error);
    throw error;
  }
  return data;
}

/**
 * 大カテゴリのラベルを更新する
 */
export async function updateSuperCategoryLabel(
  id: number,
  label: string,
): Promise<SuperCategory> {
  if (!label.trim()) {
    throw new Error("大カテゴリのラベルは空にできません。");
  }

  const { data, error } = await supabase
    .from("super_categories")
    .update({ label })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Failed to update super category ${id}:`, error);
    throw error;
  }
  return data;
}

/**
 * 大カテゴリを削除する
 */
export async function deleteSuperCategory(id: number): Promise<void> {
  const { error } = await supabase
    .from("super_categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Failed to delete super category ${id}:`, error);
    throw error;
  }
}
