import type { RequestHandler } from "@sveltejs/kit";
import { supabase } from "$lib/server/supabase";
import { BOOKMARK_TABLE } from "$env/static/private";

// --- ブックマーク取得 ---
export const GET: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get("id");
  try {
    if (id) {
      // 1件だけ状態取得
      const { data: rows, error } = await supabase
        .from(BOOKMARK_TABLE)
        .select("*")
        .eq("id", id)
        .limit(1);

      if (error) throw error;
      return new Response(
        JSON.stringify({ bookmarked: rows && rows.length > 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } else {
      // 全件リスト
      const { data: rows, error, count } = await supabase
        .from(BOOKMARK_TABLE)
        .select("*", { count: "exact" })
        .order("pub_date", { ascending: false })
        .limit(200);

      if (error) throw error;
      if (!rows) {
        return new Response(
          JSON.stringify({ error: "記事が見つかりませんでした" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      // site_titleをJOINする場合はリレーション設定要（省略）
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
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
        },
      });
    }
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// --- ブックマーク登録・上書き ---
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    // 必須フィールド
    const { id, url, title, category, site_id, content, pub_date, thumbnail } =
      body;
    if (!id || !url || !title) {
      return new Response(
        JSON.stringify({ error: "必須情報が不足しています (id, url, title)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    // DB登録
    const { error } = await supabase
      .from(BOOKMARK_TABLE)
      .upsert([{
        id,
        url,
        title,
        category,
        site_id,
        content,
        pub_date,
        thumbnail,
        // created_atはDB側で自動セット
      }]);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// --- ブックマーク削除 ---
export const DELETE: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(
      JSON.stringify({ error: "id is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  try {
    const { error } = await supabase
      .from(BOOKMARK_TABLE)
      .delete()
      .eq("id", id);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
