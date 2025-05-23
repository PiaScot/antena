import type { PageServerLoad } from "./$types";
import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE } from "$env/static/private";

export const load: PageServerLoad = async ({ params }) => {
  const id = params.id;
  const { data: article, error } = await supabase
    .from(ARTICLE_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error || !article) {
    return { status: 404, error: new Error("記事が見つかりません") };
  }

  return { article: article };
};
