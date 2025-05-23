// src/routes/api/feed/+server.ts
import type { RequestHandler } from "@sveltejs/kit";
import type { Article } from "$lib/types";
import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE } from "$env/static/private";

export const GET: RequestHandler = async ({ url }) => {
  const category = url.searchParams.get("category") || "all";

  try {
    // ベースとなるビルダーを作成
    let builder = supabase
      .from<Article & { site: { title: string } }>(ARTICLE_TABLE)
      // articles.* に加えて、antena_sites.title を site.title としてネスト取得
      .select("*, site:antena_sites(title)", { count: "exact" });

    if (category === "all") {
      builder = builder.in("category", ["2d", "real"]);
    } // それ以外は eq で絞り込み
    else {
      builder = builder.eq("category", category);
    }

    // 並び替え＆件数制限
    const { data: articles, count, error: fetchError } = await builder
      .order("pub_date", { ascending: false })
      .limit(100);

    if (fetchError) {
      throw new Error(
        `Failed to fetch articles from table ${ARTICLE_TABLE}: ${fetchError.message}`,
      );
    }

    if (!articles) {
      return new Response(
        JSON.stringify({ error: "No articles found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    const payload = articles.map((a) => ({
      id: a.id,
      site_id: a.site_id,
      site_title: a.site?.title ?? null,
      title: a.title,
      url: a.url,
      category: a.category,
      content: a.content,
      pub_date: a.pub_date,
      thumbnail: a.thumbnail,
    }));

    return new Response(JSON.stringify({ articles: payload, count }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // 1時間キャッシュして、最大10分の stale-while-revalidate
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
