// src/routes/api/feed/+server.ts
import type { RequestHandler } from "@sveltejs/kit";
import type { Article } from "$lib/types";
import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE } from "$env/static/private";

export const GET: RequestHandler = async ({ url }) => {
  const category = url.searchParams.get("category") || "all";
  const siteId = url.searchParams.get("site");

  try {
    let result;

    if (siteId) {
      // ────────── site 指定あり ──────────
      result = await supabase
        .from(ARTICLE_TABLE)
        .select("*, site:antena_sites(title)", { count: "exact" })
        .eq("site_id", Number(siteId))
        .order("pub_date", { ascending: false })
        .limit(200);
    } else if (category === "all") {
      // ────────── カテゴリ all のときだけ別グループで in ──────────
      result = await supabase
        .from(ARTICLE_TABLE)
        .select("*, site:antena_sites(title)", { count: "exact" })
        .in("category", ["2d", "real"])
        .order("pub_date", { ascending: false })
        .limit(200);
    } else {
      // ────────── 特定カテゴリ指定あり ──────────
      result = await supabase
        .from(ARTICLE_TABLE)
        .select("*, site:antena_sites(title)", { count: "exact" })
        .eq("category", category)
        .order("pub_date", { ascending: false })
        .limit(200);
    }

    const { data: rows, count, error } = result;
    if (error) throw error;
    if (!rows) {
      return new Response(
        JSON.stringify({ error: "記事が見つかりませんでした" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // フロントが使いやすいようにフラットにマップ
    const articles = rows.map((r) => ({
      id: r.id,
      site_id: r.site_id,
      site_title: r.site?.title ?? null,
      title: r.title,
      url: r.url,
      category: r.category,
      content: r.content,
      pub_date: r.pub_date,
      thumbnail: r.thumbnail,
    }));

    return new Response(JSON.stringify({ articles, count }), {
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
