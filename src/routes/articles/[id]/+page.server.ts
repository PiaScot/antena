// src/routes/articles/[id]/+page.server.ts
import type { PageServerLoad } from "./$types";
import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE, SITE_TABLE } from "$env/static/private";
import type { Article as DbArticle, ArticleWithSiteName } from "$lib/types"; // ArticleWithSiteName と元のArticle型をインポート

export const load: PageServerLoad = async ({ params }) => {
  const id = params.id;

  // 1. まず記事情報を取得
  const { data: articleData, error: articleError } = await supabase
    .from(ARTICLE_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (articleError) {
    console.error("Error fetching article:", articleError.message);
    return {
      status: 500,
      error: new Error("記事の取得中にエラーが発生しました"),
    };
  }

  if (!articleData) {
    return { status: 404, error: new Error("記事が見つかりません") };
  }

  // Supabaseから返されるデータはDbArticle型（またはそれに近い型）と想定
  const article = articleData as DbArticle;

  let siteTitle = ""; // デフォルトのサイトタイトル

  // 2. 記事に site_id があれば、サイト情報を取得
  if (article.site_id != null) { // site_id が null でないことを確認
    const { data: siteData, error: siteError } = await supabase
      .from(SITE_TABLE) // テーブル名を直接指定
      .select("title")
      .eq("id", article.site_id)
      .single();

    if (siteError) {
      // サイト情報取得エラーの場合、ログには残すが処理は続行し、siteTitleは空のままにする
      console.warn(
        `Could not fetch site title for site_id ${article.site_id}:`,
        siteError.message,
      );
    } else if (siteData?.title) {
      siteTitle = siteData.title;
    }
  } else {
    // site_id が null の場合 (記事が特定のサイトに紐付いていない場合など)
    console.warn(`Article with id ${article.id} has a null site_id.`);
  }

  // console.log(`articles/[id]/+page.server.ts: siteTitle => ${siteTitle}`);

  // 3. ArticleWithSiteName 型のオブジェクトを構築
  // DbArticleの各プロパティがnullの可能性があるため、?? "" でフォールバック
  const articleWithSiteName: ArticleWithSiteName = {
    id: article.id,
    site_id: article.site_id ?? 0, // ArticleWithSiteNameのsite_idがnumber型なのでnullの場合は0などにフォールバック (要件に応じて調整)
    title: article.title ?? "",
    site_title: siteTitle,
    url: article.url ?? "",
    category: article.category ?? "",
    thumbnail: article.thumbnail ?? "",
    pub_date: article.pub_date ?? "", // pub_dateがDateオブジェクトの場合、.toISOString() などが必要な場合もある
    content: article.content ?? "",
  };

  return { article: articleWithSiteName };
};
